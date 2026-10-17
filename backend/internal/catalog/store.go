// Package catalog reads the Filharmonia demo database (SQLite, read-only).
package catalog

import (
	"context"
	"database/sql"
	"database/sql/driver"
	"errors"
	"fmt"
	"net/url"
	"strings"
	"unicode"

	"modernc.org/sqlite"
)

// Languages supported by the content model; the first one is the fallback.
var Languages = []string{"pl", "en", "de"}

const fallbackLang = "pl"

// ErrNotFound is returned when a requested record does not exist.
var ErrNotFound = errors.New("not found")

func init() {
	// fold(text) lowercases and strips diacritics so that "karlowicz" matches "Karłowicz".
	err := sqlite.RegisterDeterministicScalarFunction("fold", 1, func(_ *sqlite.FunctionContext, args []driver.Value) (driver.Value, error) {
		s, ok := args[0].(string)
		if !ok {
			return nil, nil
		}
		return Fold(s), nil
	})
	if err != nil {
		panic(err)
	}
}

// Store gives read-only access to the catalog.
type Store struct {
	db *sql.DB
}

// Open opens the SQLite file in read-only mode.
func Open(path string) (*Store, error) {
	dsn := "file:" + (&url.URL{Path: path}).EscapedPath() + "?mode=ro&_pragma=query_only(1)&_pragma=busy_timeout(5000)"
	db, err := sql.Open("sqlite", dsn)
	if err != nil {
		return nil, err
	}
	if err := db.Ping(); err != nil {
		db.Close()
		return nil, fmt.Errorf("open %s: %w", path, err)
	}
	return &Store{db: db}, nil
}

// Close closes the database.
func (s *Store) Close() error { return s.db.Close() }

// Ping checks that the database is reachable.
func (s *Store) Ping(ctx context.Context) error { return s.db.PingContext(ctx) }

// NormalizeLang returns a supported language code, falling back to Polish.
func NormalizeLang(lang string) string {
	lang = strings.ToLower(strings.TrimSpace(lang))
	for _, l := range Languages {
		if lang == l {
			return l
		}
	}
	return fallbackLang
}

var foldMap = map[rune]string{
	'ą': "a", 'ć': "c", 'ę': "e", 'ł': "l", 'ń': "n", 'ó': "o", 'ś': "s", 'ź': "z", 'ż': "z",
	'ä': "a", 'ö': "o", 'ü': "u", 'ß': "ss",
	'á': "a", 'à': "a", 'â': "a", 'é': "e", 'è': "e", 'ê': "e", 'ë': "e", 'í': "i", 'ì': "i",
	'î': "i", 'ï': "i", 'ò': "o", 'ô': "o", 'õ': "o", 'ú': "u", 'ù': "u", 'û': "u", 'ý': "y",
	'č': "c", 'ř': "r", 'š': "s", 'ž': "z", 'ñ': "n", 'ç': "c", 'å': "a", 'ø': "o",
}

// Fold lowercases s and replaces common Latin diacritics with plain letters.
func Fold(s string) string {
	var b strings.Builder
	b.Grow(len(s))
	for _, r := range strings.ToLower(s) {
		if rep, ok := foldMap[r]; ok {
			b.WriteString(rep)
		} else if unicode.Is(unicode.Mn, r) {
			continue
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}

// likePattern builds a LIKE pattern matching the folded query anywhere in the text.
func likePattern(q string) string {
	r := strings.NewReplacer(`\`, `\\`, `%`, `\%`, `_`, `\_`)
	return "%" + r.Replace(Fold(strings.TrimSpace(q))) + "%"
}

// translationJoin returns a LEFT JOIN on a translation table that picks the
// requested language and falls back to Polish when that translation is missing.
func translationJoin(table, alias, fk, parent string) string {
	return fmt.Sprintf(
		"LEFT JOIN %[1]s %[2]s ON %[2]s.%[3]s = %[4]s.id AND %[2]s.language_code = COALESCE("+
			"(SELECT language_code FROM %[1]s WHERE %[3]s = %[4]s.id AND language_code = ?), '%[5]s')",
		table, alias, fk, parent, fallbackLang)
}

func placeholders(n int) string {
	return strings.TrimSuffix(strings.Repeat("?,", n), ",")
}

func anyArgs[T any](vs []T) []any {
	out := make([]any, len(vs))
	for i, v := range vs {
		out[i] = v
	}
	return out
}
