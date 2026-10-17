// Package assistant is the voice guide of the Philharmonic: speech-to-text,
// an agent loop with catalog tools and streamed text-to-speech of the reply.
package assistant

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
	"github.com/SergiuszN/grupa_b/backend/internal/openrouter"
	"github.com/SergiuszN/grupa_b/backend/internal/search"
)

var warsaw = mustLoadLocation("Europe/Warsaw")

// Config selects the OpenRouter models.
type Config struct {
	ChatModel       string
	ReasoningEffort string
	TranscribeModel string
	SpeechModel     string
	MaxSteps        int
}

// DefaultConfig is the model set the assistant was built and tested with.
var DefaultConfig = Config{
	ChatModel:       "openai/gpt-6-luna",
	ReasoningEffort: "none", // tested: faster, with no loss in tool use for this task
	TranscribeModel: "microsoft/mai-transcribe-2",
	SpeechModel:     "microsoft/mai-voice-2.1",
	MaxSteps:        6,
}

// voices per reply language; every language uses the same persona.
var voices = map[string]string{
	"pl": "pl-PL-Harper:MAI-Voice-2.1",
	"en": "en-US-Harper:MAI-Voice-2.1",
	"de": "de-DE-Harper:MAI-Voice-2.1",
}

// Emit sends one event of the reply stream to the client.
type Emit func(event string, data any)

// Assistant answers spoken or typed questions about the programme.
type Assistant struct {
	client *openrouter.Client
	store  *catalog.Store
	index  *search.Index // nil: plain text search only
	cfg    Config
	venues []string
	now    func() time.Time
}

// New creates the assistant. index may be nil.
func New(client *openrouter.Client, store *catalog.Store, index *search.Index, cfg Config) *Assistant {
	a := &Assistant{client: client, store: store, index: index, cfg: cfg, now: time.Now}
	if venues, err := store.ListVenues(context.Background()); err == nil {
		for _, v := range venues {
			a.venues = append(a.venues, v.Slug)
		}
	}
	return a
}

// Turn is one earlier message of the conversation, kept by the client.
type Turn struct {
	Role    string `json:"role"` // user | assistant
	Content string `json:"content"`
}

// Request is one user turn: recorded audio or typed text.
type Request struct {
	Lang        string
	Audio       []byte
	AudioFormat string
	Text        string
	History     []Turn
	Speak       bool
}

// ErrNothingHeard means the recording contained no speech.
var ErrNothingHeard = errors.New("nothing heard")

const maxHistory = 12

// Run handles one turn and streams its events:
//
//	transcript {text, language}  what the user said
//	tool       {name}            the agent is using a tool
//	events     {events: [Card]}  event cards to show
//	sources    {sources: [Source]} website pages a practical answer comes from
//	delta      {text}            next piece of the reply text
//	audio      {seq, text, data} next MP3 clip of the spoken reply (base64)
//	done       {text, language}  the full reply
func (a *Assistant) Run(ctx context.Context, req Request, emit Emit) error {
	lang := catalog.NormalizeLang(req.Lang)
	text := strings.TrimSpace(req.Text)

	if len(req.Audio) > 0 {
		started := time.Now()
		tr, err := a.client.Transcribe(ctx, a.cfg.TranscribeModel, req.Audio, req.AudioFormat)
		if err != nil {
			return fmt.Errorf("transcribe: %w", err)
		}
		text = strings.TrimSpace(tr.Text)
		if l := spokenLang(tr.Language); l != "" {
			lang = l
		}
		slog.Info("assistant transcript", "ms", time.Since(started).Milliseconds(), "language", tr.Language, "chars", len(text))
		emit("transcript", map[string]string{"text": text, "language": lang})
	}
	if text == "" {
		return ErrNothingHeard
	}

	messages := []openrouter.Message{{Role: "system", Content: a.systemPrompt(lang)}}
	history := req.History[max(0, len(req.History)-maxHistory):]
	for _, t := range history {
		if (t.Role == "user" || t.Role == "assistant") && strings.TrimSpace(t.Content) != "" {
			messages = append(messages, openrouter.Message{Role: t.Role, Content: t.Content})
		}
	}
	messages = append(messages, openrouter.Message{Role: "user", Content: text})

	var voice *speaker
	if req.Speak {
		voice = newSpeaker(ctx,
			func(ctx context.Context, s string) ([]byte, error) {
				return a.client.Speech(ctx, a.cfg.SpeechModel, voices[lang], s)
			},
			func(audio []byte, seq int, s string) {
				emit("audio", map[string]any{"seq": seq, "text": s, "data": base64.StdEncoding.EncodeToString(audio)})
			})
		defer func() {
			if voice != nil {
				voice.Close()
			}
		}()
	}

	var reply strings.Builder
	onText := func(s string) {
		reply.WriteString(s)
		emit("delta", map[string]string{"text": s})
		if voice != nil {
			voice.Write(s)
		}
	}

	tools := a.tools()
	for step := 0; ; step++ {
		creq := openrouter.ChatRequest{Model: a.cfg.ChatModel, Messages: messages, MaxTokens: 1500}
		if step < a.cfg.MaxSteps {
			creq.Tools = tools // the last step must answer with what it has
		}
		if a.cfg.ReasoningEffort != "" {
			creq.Reasoning = &openrouter.Reasoning{Effort: a.cfg.ReasoningEffort}
		}
		started := time.Now()
		msg, finish, err := a.client.ChatStream(ctx, creq, onText)
		if err != nil {
			return fmt.Errorf("chat: %w", err)
		}
		slog.Info("assistant step", "step", step, "ms", time.Since(started).Milliseconds(), "finish", finish, "tool_calls", len(msg.ToolCalls))
		if len(msg.ToolCalls) == 0 {
			break
		}
		messages = append(messages, msg)
		if msg.Content != "" && !strings.HasSuffix(msg.Content, " ") {
			onText(" ") // keep "Let me check." apart from the next step's text
		}
		if voice != nil {
			voice.Flush()
		}
		for _, call := range msg.ToolCalls {
			emit("tool", map[string]string{"name": call.Function.Name})
			messages = append(messages, openrouter.Message{
				Role:       "tool",
				ToolCallID: call.ID,
				Content:    a.runTool(ctx, call, lang, emit),
			})
		}
	}

	if voice != nil {
		voice.Close()
		voice = nil
	}
	emit("done", map[string]string{"text": strings.TrimSpace(reply.String()), "language": lang})
	return nil
}

// spokenLang maps a detected language ("pl", "pl-PL", "polish") to a supported one.
func spokenLang(detected string) string {
	d := strings.ToLower(strings.TrimSpace(detected))
	for code, name := range map[string]string{"pl": "polish", "en": "english", "de": "german"} {
		if strings.HasPrefix(d, code) || d == name {
			return code
		}
	}
	return ""
}

var languageNames = map[string]string{"pl": "Polish", "en": "English", "de": "German"}

func (a *Assistant) systemPrompt(lang string) string {
	now := a.now().In(warsaw)
	var days strings.Builder
	for i := range 15 {
		d := now.AddDate(0, 0, i)
		fmt.Fprintf(&days, "%s %s; ", d.Format(time.DateOnly), d.Weekday())
	}
	// Spell out weekends: "this weekend" on a Sunday is easy to get wrong.
	sat := now.AddDate(0, 0, (6-int(now.Weekday())+7)%7)
	weekends := fmt.Sprintf("The coming weekend is %s-%s.", sat.Format(time.DateOnly), sat.AddDate(0, 0, 1).Format(time.DateOnly))
	if now.Weekday() == time.Sunday {
		weekends = fmt.Sprintf("Today (Sunday) is still this weekend, so \"this weekend\" means today; the next weekend is %s-%s.",
			now.AddDate(0, 0, 6).Format(time.DateOnly), now.AddDate(0, 0, 7).Format(time.DateOnly))
	}
	return fmt.Sprintf(`You are the voice guide of the Mieczysław Karłowicz Philharmonic in Szczecin (Filharmonia w Szczecinie). You help visitors find and choose concerts and other events from the Philharmonic's calendar.

What you can do (tell the user briefly when they ask what you can do, with one or two example questions):
- find events by date ("this weekend", "in November"), genre, composer, performer, work, mood or theme;
- suggest events for children of a given age, families, seniors or first-time visitors;
- filter by price, free entry, hall and accessibility (wheelchair, visual, hearing, sensory);
- explain what a concert is about, who performs, the programme and how long it takes;
- compare options and recommend the best one for the user's needs, and show it on screen with a ticket button;
- answer practical questions about the visit: tickets and discounts, refunds, getting there and parking, opening hours, cloakroom, dress code, cafes, accessibility, guided tours, galleries, education offer, rentals and contact.

Rules:
- Facts about events (titles, dates, prices, performers, availability) come only from your tools. Never invent them. If the tools find nothing, say so and offer an alternative.
- For practical questions about visiting (tickets, discounts, parking, transport, hours, cloakroom, dress code, food, rules, accessibility, building, tours, schools, rentals, contact) call get_visitor_info and answer only from what it returns; its source links appear on screen, so you may say "szczegóły są na stronie Filharmonii" instead of reading out links. If it has no answer, say you don't know and give the box office phone number. Phone numbers are fine to say aloud.
- For any question about what is on, call search_events. For details or a recommendation, also call get_event_details for the top candidates. Prefer events with tickets available; mention when something is sold out.
- When you recommend or mention specific events, call show_events with the 1-3 best options (different events) before your final answer.
- If nothing matches, relax the filters yourself (wider dates, without the age or price limit, a broader query) and propose the closest alternatives, saying how they differ. Do not give up after the first empty search.
- If the request is vague, still propose something concrete, then ask one short follow-up question (e.g. about date or company).
- Before a tool call you may say one very short phrase (like "Już sprawdzam." in Polish) so the user hears you right away.
- Your reply is read aloud by text-to-speech. Write plain spoken sentences: no markdown, no lists, no emojis, no links, no IDs. Keep it short: 2-4 sentences, at most about 70 words. Say dates naturally (e.g. "w sobotę 24 października o 19:00"), prices as "od 40 do 90 złotych".
- Reply in %s.

Today is %s (%s), Europe/Warsaw time %s. %s Next days: %s`,
		languageNames[lang], now.Format(time.DateOnly), now.Weekday(), now.Format("15:04"), weekends, days.String())
}

func mustLoadLocation(name string) *time.Location {
	loc, err := time.LoadLocation(name)
	if err != nil {
		panic(fmt.Sprintf("load location %s: %v", name, err))
	}
	return loc
}
