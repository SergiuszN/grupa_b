package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/SergiuszN/grupa_b/backend/internal/assistant"
)

// maxAssistantBody fits about a minute of 16 kHz mono WAV in base64.
const maxAssistantBody = 8 << 20

type assistantRequest struct {
	Lang        string           `json:"lang"`
	Audio       string           `json:"audio"`        // base64
	AudioFormat string           `json:"audio_format"` // wav (default), mp3, ...
	Text        string           `json:"text"`
	History     []assistant.Turn `json:"history"`
	Speak       *bool            `json:"speak"` // default true
}

// handleAssistant answers one spoken or typed question as a Server-Sent Events
// stream (see assistant.Run for the event types; failures end with "error").
func (a *api) handleAssistant(w http.ResponseWriter, r *http.Request) {
	if a.assistant == nil {
		writeError(w, http.StatusServiceUnavailable, "unavailable", "assistant is not configured (OPENROUTER_API_KEY)")
		return
	}
	var body assistantRequest
	if err := json.NewDecoder(http.MaxBytesReader(w, r.Body, maxAssistantBody)).Decode(&body); err != nil {
		writeError(w, http.StatusBadRequest, "bad_request", "invalid JSON body")
		return
	}
	req := assistant.Request{
		Lang:        body.Lang,
		AudioFormat: body.AudioFormat,
		Text:        body.Text,
		History:     body.History,
		Speak:       body.Speak == nil || *body.Speak,
	}
	if req.Lang == "" {
		req.Lang = lang(r)
	}
	if req.AudioFormat == "" {
		req.AudioFormat = "wav"
	}
	if body.Audio != "" {
		audio, err := base64.StdEncoding.DecodeString(body.Audio)
		if err != nil {
			writeError(w, http.StatusBadRequest, "bad_request", "audio must be base64")
			return
		}
		req.Audio = audio
	}
	if len(req.Audio) == 0 && strings.TrimSpace(req.Text) == "" {
		writeError(w, http.StatusBadRequest, "bad_request", "audio or text is required")
		return
	}

	flusher, ok := w.(http.Flusher)
	if !ok {
		writeError(w, http.StatusInternalServerError, "internal", "streaming unsupported")
		return
	}
	h := w.Header()
	h.Set("Content-Type", "text/event-stream")
	h.Set("Cache-Control", "no-cache")
	h.Set("X-Accel-Buffering", "no")
	w.WriteHeader(http.StatusOK)
	flusher.Flush()

	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Minute)
	defer cancel()

	var mu sync.Mutex // events come from the agent and from the speech goroutine
	emit := func(event string, data any) {
		payload, err := json.Marshal(data)
		if err != nil {
			return
		}
		mu.Lock()
		defer mu.Unlock()
		if ctx.Err() != nil {
			return
		}
		_, _ = w.Write([]byte("event: " + event + "\ndata: " + string(payload) + "\n\n"))
		flusher.Flush()
	}

	started := time.Now()
	err := a.assistant.Run(ctx, req, emit)
	switch {
	case err == nil:
		slog.Info("assistant answered", "ms", time.Since(started).Milliseconds())
	case errors.Is(err, assistant.ErrNothingHeard):
		emit("error", map[string]string{"code": "nothing_heard", "message": "no speech recognized"})
	case r.Context().Err() != nil:
		slog.Info("assistant cancelled by client")
	default:
		slog.Error("assistant failed", "err", err)
		emit("error", map[string]string{"code": "upstream", "message": "assistant failed"})
	}
}
