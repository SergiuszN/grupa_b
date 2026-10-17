package assistant

import "strings"

// spokenSplitter separates the reply into what is shown and what is spoken.
// Text-to-speech reads digits poorly ("19:00", "24 października"), so the
// model writes numbers as {{shown|spoken}}, e.g. "o {{19:00|dziewiętnastej}}":
// the screen gets "19:00", the voice gets the inflected words. The markup may
// arrive split across stream tokens, so an unfinished "{{..." is held back.
type spokenSplitter struct {
	buf    string
	shown  func(string)
	spoken func(string)
}

const (
	markupOpen  = "{{"
	markupClose = "}}"
	maxMarkup   = 200 // longer "{{..." without "}}" is not markup
)

func (m *spokenSplitter) Write(s string) {
	m.buf += s
	for m.buf != "" {
		open := strings.Index(m.buf, markupOpen)
		if open < 0 {
			// Keep a trailing "{" that may start "{{" in the next token.
			keep := 0
			if strings.HasSuffix(m.buf, "{") {
				keep = 1
			}
			m.both(m.buf[:len(m.buf)-keep])
			m.buf = m.buf[len(m.buf)-keep:]
			return
		}
		m.both(m.buf[:open])
		m.buf = m.buf[open:]
		end := strings.Index(m.buf, markupClose)
		if end < 0 {
			if len(m.buf) > maxMarkup {
				m.both(strings.TrimPrefix(m.buf, markupOpen))
				m.buf = ""
			}
			return
		}
		m.markup(m.buf[len(markupOpen):end])
		m.buf = m.buf[end+len(markupClose):]
	}
}

// Flush emits whatever is held back, without the braces.
func (m *spokenSplitter) Flush() {
	rest := strings.NewReplacer(markupOpen, "", markupClose, "").Replace(m.buf)
	m.buf = ""
	if shown, spoken, ok := strings.Cut(rest, "|"); ok {
		m.shown(shown)
		m.spoken(spoken)
		return
	}
	m.both(rest)
}

func (m *spokenSplitter) markup(inner string) {
	shown, spoken, ok := strings.Cut(inner, "|")
	if !ok {
		spoken = shown
	}
	m.shown(shown)
	m.spoken(spoken)
}

func (m *spokenSplitter) both(s string) {
	if s == "" {
		return
	}
	m.shown(s)
	m.spoken(s)
}
