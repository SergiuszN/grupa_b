// Command index builds the assistant's search index (FTS5 + embeddings) from
// the catalog database. Unchanged documents keep their embeddings.
package main

import (
	"context"
	"flag"
	"log/slog"
	"os"
	"os/signal"

	"github.com/SergiuszN/grupa_b/backend/internal/openrouter"
	"github.com/SergiuszN/grupa_b/backend/internal/search"
)

func main() {
	slog.SetDefault(slog.New(slog.NewTextHandler(os.Stderr, nil)))

	db := flag.String("db", getenv("DB_PATH", "../data/filharmonia.sqlite"), "catalog database")
	info := flag.String("info", getenv("VISITOR_INFO_PATH", "../data/visitor_info.json"), "visitor information (JSON); empty to skip")
	out := flag.String("out", getenv("SEARCH_DB_PATH", "../data/search.sqlite"), "search index to (re)build")
	model := flag.String("model", getenv("EMBEDDING_MODEL", "openai/text-embedding-3-small"), "embedding model")
	flag.Parse()

	client := openrouter.New(os.Getenv("OPENROUTER_API_KEY"))
	if client == nil {
		slog.Error("OPENROUTER_API_KEY is not set")
		os.Exit(1)
	}

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()

	embed := func(ctx context.Context, inputs []string) ([][]float32, error) {
		return client.Embed(ctx, *model, inputs)
	}
	if err := search.Build(ctx, *db, *info, *out, *model, embed); err != nil {
		slog.Error("build search index", "err", err)
		os.Exit(1)
	}
	slog.Info("search index ready", "path", *out)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
