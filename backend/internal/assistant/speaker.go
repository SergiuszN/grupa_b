package assistant

import (
	"context"
	"log/slog"
	"regexp"
	"strings"
	"unicode"
	"unicode/utf8"
)

// speaker turns streamed reply text into audio while the model is still
// writing: text is cut into sentence chunks, each chunk is synthesized in
// parallel and the clips are emitted strictly in order.
type speaker struct {
	ctx    context.Context
	synth  func(ctx context.Context, text string) ([]byte, error)
	emit   func(clip []byte, seq int, text string)
	buf    strings.Builder
	chunks int
	queue  chan chan clip
	slots  chan struct{}
	done   chan struct{}
}

type clip struct {
	audio []byte
	text  string
}

const (
	firstChunkMin = 12  // say something as soon as the first short sentence is ready
	nextChunkMin  = 140 // later chunks are longer: fewer calls, more natural prosody
	parallelTTS   = 3
)

func newSpeaker(ctx context.Context, synth func(context.Context, string) ([]byte, error), emit func([]byte, int, string)) *speaker {
	s := &speaker{
		ctx:   ctx,
		synth: synth,
		emit:  emit,
		queue: make(chan chan clip, 32),
		slots: make(chan struct{}, parallelTTS),
		done:  make(chan struct{}),
	}
	go s.run()
	return s
}

func (s *speaker) run() {
	defer close(s.done)
	seq := 0
	for ch := range s.queue {
		c := <-ch
		if c.audio != nil {
			s.emit(c.audio, seq, c.text)
			seq++
		}
	}
}

// Write adds streamed text and sends every complete chunk to synthesis.
func (s *speaker) Write(text string) {
	s.buf.WriteString(text)
	for {
		need := nextChunkMin
		if s.chunks == 0 {
			need = firstChunkMin
		}
		cut := sentenceCut(s.buf.String(), need)
		if cut < 0 {
			return
		}
		all := s.buf.String()
		s.buf.Reset()
		s.buf.WriteString(all[cut:])
		s.enqueue(all[:cut])
	}
}

// Flush synthesizes whatever text is buffered, e.g. "Let me check." before a tool call.
func (s *speaker) Flush() {
	s.enqueue(s.buf.String())
	s.buf.Reset()
}

// Close synthesizes the remaining text and waits until all clips are emitted.
func (s *speaker) Close() {
	s.Flush()
	close(s.queue)
	<-s.done
}

func (s *speaker) enqueue(text string) {
	text = speakable(text)
	if text == "" {
		return
	}
	s.chunks++
	ch := make(chan clip, 1)
	s.queue <- ch
	go func() {
		s.slots <- struct{}{}
		defer func() { <-s.slots }()
		audio, err := s.synth(s.ctx, text)
		if err != nil {
			if s.ctx.Err() == nil {
				slog.Warn("tts failed", "err", err)
			}
			audio = nil
		}
		ch <- clip{audio: audio, text: text}
	}()
}

// sentenceCut returns the end of the last complete sentence in s once at least
// need runes are available, or -1. A sentence ends with . ! ? … or a newline
// followed by whitespace and then an upper-case letter or quote; when
// the next character has not arrived yet, we wait.
func sentenceCut(s string, need int) int {
	if utf8.RuneCountInString(s) < need {
		return -1
	}
	cut := -1
	for i, r := range s {
		if r == '\n' {
			if utf8.RuneCountInString(s[:i]) >= need {
				cut = i + 1
			}
			continue
		}
		if r != '.' && r != '!' && r != '?' && r != '…' {
			continue
		}
		end := i + utf8.RuneLen(r)
		rest := s[end:]
		trimmed := strings.TrimLeft(rest, " \t")
		if len(trimmed) == len(rest) || trimmed == "" {
			continue // no space after it, or we don't know what follows yet
		}
		if r == '.' && isAbbreviation(s[:i]) {
			continue
		}
		next, _ := utf8.DecodeRuneInString(trimmed)
		if unicode.IsUpper(next) || next == '"' || next == '„' || next == '\n' {
			if utf8.RuneCountInString(s[:end]) >= need {
				cut = end
			}
		}
	}
	return cut
}

// isAbbreviation reports whether the text ends with a short lower-case word
// such as "np", "ul", "im" or "nr", which a dot does not end a sentence after.
func isAbbreviation(before string) bool {
	word := before[strings.LastIndexFunc(before, func(r rune) bool { return !unicode.IsLetter(r) })+1:]
	n := utf8.RuneCountInString(word)
	return n > 0 && n <= 3 && word == strings.ToLower(word)
}

var (
	reURL      = regexp.MustCompile(`https?://\S+`)
	reMarkdown = regexp.MustCompile("[*_#`>|]+")
	reSpaces   = regexp.MustCompile(`\s+`)
)

// speakable removes things a voice should not read out.
func speakable(s string) string {
	s = reURL.ReplaceAllString(s, "")
	s = reMarkdown.ReplaceAllString(s, "")
	s = reSpaces.ReplaceAllString(s, " ")
	return strings.TrimSpace(s)
}
