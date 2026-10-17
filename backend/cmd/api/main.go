package main

import (
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
	_ "time/tzdata"

	"github.com/SergiuszN/grupa_b/backend/internal/assistant"
	"github.com/SergiuszN/grupa_b/backend/internal/catalog"
	"github.com/SergiuszN/grupa_b/backend/internal/openrouter"
	"github.com/SergiuszN/grupa_b/backend/internal/search"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	dbPath := getenv("DB_PATH", "../data/filharmonia.sqlite")
	store, err := catalog.Open(dbPath)
	if err != nil {
		slog.Error("open database", "path", dbPath, "err", err)
		os.Exit(1)
	}
	defer store.Close()

	addr := ":" + getenv("PORT", "8080")
	srv := &http.Server{
		Addr:              addr,
		Handler:           newRouter(store, newAssistant(store)),
		ReadHeaderTimeout: 5 * time.Second,
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		slog.Info("api listening", "addr", addr)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("server error", "err", err)
			os.Exit(1)
		}
	}()

	<-ctx.Done()
	slog.Info("shutting down")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("shutdown error", "err", err)
	}
}

func newRouter(store *catalog.Store, asst *assistant.Assistant) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", handleHealthz)
	(&api{store: store, assistant: asst, now: time.Now}).routes(mux)
	return withCORS(mux)
}

// newAssistant sets up the voice assistant when an OpenRouter key is present.
// Without the search index it still works, with plain text search only.
func newAssistant(store *catalog.Store) *assistant.Assistant {
	client := openrouter.New(os.Getenv("OPENROUTER_API_KEY"))
	if client == nil {
		slog.Warn("OPENROUTER_API_KEY not set, assistant disabled")
		return nil
	}
	indexPath := getenv("SEARCH_DB_PATH", "../data/search.sqlite")
	index, err := search.Open(indexPath)
	if err != nil {
		slog.Warn("search index not loaded, run `make index`", "path", indexPath, "err", err)
		index = nil
	} else {
		slog.Info("search index loaded", "path", indexPath, "documents", index.Size(), "visitor_info", index.InfoSize(), "model", index.Model())
	}
	cfg := assistant.DefaultConfig
	cfg.ChatModel = getenv("ASSISTANT_MODEL", cfg.ChatModel)
	cfg.ReasoningEffort = getenv("ASSISTANT_REASONING", cfg.ReasoningEffort)
	cfg.TranscribeModel = getenv("TRANSCRIBE_MODEL", cfg.TranscribeModel)
	cfg.SpeechModel = getenv("SPEECH_MODEL", cfg.SpeechModel)
	return assistant.New(client, store, index, cfg)
}

func handleHealthz(w http.ResponseWriter, _ *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	enc := json.NewEncoder(w)
	enc.SetEscapeHTML(false)
	_ = enc.Encode(v)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
