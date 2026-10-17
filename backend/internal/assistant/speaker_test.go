package assistant

import (
	"context"
	"strings"
	"sync"
	"testing"
)

func TestSentenceCut(t *testing.T) {
	tests := []struct {
		in   string
		need int
		want string // text before the cut, "" = no cut
	}{
		{"Już sprawdzam. Dziś", 10, "Już sprawdzam."},
		{"Już sprawdzam.", 10, ""}, // what follows is not known yet
		{"Krótko. Dalej", 20, ""},  // not enough text
		{"Symfonia nr. 40 g-moll gra", 5, ""},
		{"Grają o 19.00 w sali. Bilety są", 5, "Grają o 19.00 w sali."},
		{"Pierwsze zdanie! Drugie zdanie? Trzecie", 5, "Pierwsze zdanie! Drugie zdanie?"},
		{"Gramy np. Mozarta i im. Karłowicza. Potem", 5, "Gramy np. Mozarta i im. Karłowicza."},
		{"Lista:\nkolejna linia", 3, "Lista:\n"},
	}
	for _, tt := range tests {
		cut := sentenceCut(tt.in, tt.need)
		got := ""
		if cut >= 0 {
			got = tt.in[:cut]
		}
		if got != tt.want {
			t.Errorf("sentenceCut(%q, %d) = %q, want %q", tt.in, tt.need, got, tt.want)
		}
	}
}

func TestSpeakable(t *testing.T) {
	got := speakable("**Polecam** koncert — bilety: https://example.com/x?y=1 \n\n # tutaj")
	if want := "Polecam koncert — bilety: tutaj"; got != want {
		t.Errorf("speakable = %q, want %q", got, want)
	}
}

func TestSpeakerKeepsOrder(t *testing.T) {
	var mu sync.Mutex
	var spoken []string
	synth := func(_ context.Context, text string) ([]byte, error) {
		return []byte(text), nil
	}
	s := newSpeaker(context.Background(), synth, func(audio []byte, seq int, _ string) {
		mu.Lock()
		defer mu.Unlock()
		if seq != len(spoken) {
			t.Errorf("clip seq %d out of order", seq)
		}
		spoken = append(spoken, string(audio))
	})
	reply := "Już sprawdzam. " + strings.Repeat("Bardzo długie zdanie o koncercie. ", 6) + "Na który termin masz ochotę?"
	for _, r := range reply {
		s.Write(string(r)) // token by token, like the model stream
	}
	s.Close()

	if len(spoken) < 2 || spoken[0] != "Już sprawdzam." {
		t.Fatalf("clips = %q, want the short first sentence spoken on its own", spoken)
	}
	if got := strings.Join(spoken, " "); got != strings.TrimSpace(reply) {
		t.Errorf("joined clips = %q, want the whole reply", got)
	}
}
