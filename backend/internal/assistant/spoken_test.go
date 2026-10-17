package assistant

import (
	"strings"
	"testing"
)

func TestSpokenSplitter(t *testing.T) {
	tests := []struct {
		in, shown, spoken string
	}{
		{
			"W sobotę {{24 października|dwudziestego czwartego października}} o {{19:00|dziewiętnastej}}.",
			"W sobotę 24 października o 19:00.",
			"W sobotę dwudziestego czwartego października o dziewiętnastej.",
		},
		{"Bez liczb.", "Bez liczb.", "Bez liczb."},
		{"Tylko {{jedno}} pole.", "Tylko jedno pole.", "Tylko jedno pole."},
		{"Klamra { pojedyncza }.", "Klamra { pojedyncza }.", "Klamra { pojedyncza }."},
		{"Urwane {{40|czterdzieści", "Urwane 40", "Urwane czterdzieści"},
	}
	for _, tt := range tests {
		// Feed one rune at a time, as the model stream may split the markup anywhere.
		for _, chunked := range []bool{false, true} {
			var shown, spoken strings.Builder
			m := &spokenSplitter{shown: func(s string) { shown.WriteString(s) }, spoken: func(s string) { spoken.WriteString(s) }}
			if chunked {
				for _, r := range tt.in {
					m.Write(string(r))
				}
			} else {
				m.Write(tt.in)
			}
			m.Flush()
			if shown.String() != tt.shown || spoken.String() != tt.spoken {
				t.Errorf("%q (chunked=%v): shown %q, spoken %q; want %q, %q",
					tt.in, chunked, shown.String(), spoken.String(), tt.shown, tt.spoken)
			}
		}
	}
}
