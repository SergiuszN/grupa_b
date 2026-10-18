package catalog

import (
	"context"
	"math"
	"slices"
	"sort"
	"strings"
)

// Recommendation is an event card ranked for a taste profile.
type Recommendation struct {
	EventSummary
	Score      float64  `json:"score"`
	Performers []string `json:"performers"`
	Composers  []string `json:"composers"`
	Excerpt    *string  `json:"excerpt"`
}

// taste weighs what an event is made of. Every matching feature adds its weight;
// composer weights are multiplied by the share of the programme they cover.
type taste struct {
	kinds    map[string]float64
	venues   map[string]float64
	modern   float64            // composers born in 1860 or later
	old      float64            // composers born before 1860
	small    float64            // at most three credited performers
	keywords map[string]float64 // folded fragments of the Polish title, subtitle and description
}

// Tastes are the answers of the start quiz: the first question picks listen or
// watch, the next two narrow it down. Profiles are summed, so a full path of
// answers ranks best what matches the last, most specific one.
var Tastes = map[string]taste{
	"listen": {
		kinds: map[string]float64{"symphonic": 2, "chamber": 2, "jazz": 2, "concert": 2, "exhibition": -2, "tour": -2},
	},
	"watch": {
		kinds:    map[string]float64{"exhibition": 2, "tour": 2, "other": 1, "symphonic": -1.5, "chamber": -1.5, "jazz": -1.5, "concert": -1.5},
		keywords: map[string]float64{"obraz": 0.5, "malarstw": 0.5, "film": 1, "pokaz": 0.5, "spektakl": 0.5},
	},
	"classical": {
		kinds:  map[string]float64{"symphonic": 2, "chamber": 2, "jazz": -1},
		modern: 1, old: 1,
	},
	"contemporary": {
		kinds:    map[string]float64{"jazz": 2, "concert": 2},
		old:      -2,
		keywords: map[string]float64{"jazz": 1, "improwiz": 1, "elektroni": 1, "groove": 1, "folk": 0.5},
	},
	"modern-classic": {
		modern: 3, old: -1,
		keywords: map[string]float64{"xx wieku": 1, "xx wiek": 0.5, "konkurs kompozytorski": 2, "wspolczesn": 1},
	},
	"old-classics": {
		modern: -1, old: 3,
		keywords: map[string]float64{"barok": 1.5, "instrumentach historycznych": 2, "muzyke dawna": 1.5, "xviii wieku": 1, "xix wieku": 1},
	},
	"avant-garde": {
		kinds:    map[string]float64{"jazz": 1},
		modern:   1,
		keywords: map[string]float64{"awangard": 2, "eksperyment": 1.5, "improwiz": 1.5, "elektroni": 1.5, "groove": 1, "wymyka sie": 1, "nowoczesn": 1, "spektakl": 0.5},
	},
	"minimal": {
		kinds:    map[string]float64{"chamber": 1},
		small:    2,
		keywords: map[string]float64{"minimal": 2, "intym": 1.5, "cisz": 1, "duet": 1, "recital": 1, "akustycz": 1, "big band": -1.5, "groove": -1},
	},
	"exhibition": {
		kinds:    map[string]float64{"exhibition": 3, "other": 0.5},
		keywords: map[string]float64{"wystaw": 1, "fotografi": 0.5, "film": 0.5},
	},
	"architecture": {
		kinds:    map[string]float64{"tour": 3},
		venues:   map[string]float64{"hol": 0.5},
		keywords: map[string]float64{"architektur": 2, "budyn": 1, "przestrzen": 0.5},
	},
	"old-art": {
		kinds: map[string]float64{"exhibition": 1, "other": 0.5},
		// "(18" catches life dates such as "Karłowicz (1876-1909)"; a vernissage means a living artist.
		keywords: map[string]float64{"(18": 1.5, "historii fotografii": 1.5, "archiw": 1, "przemijan": 1.5, "dziesieciolecia": 1,
			"dokumentaln": 1, "mistrzow malarstwa": 1.5, "wernisaz": -2, "abstrakc": -1},
	},
	"contemporary-art": {
		kinds:    map[string]float64{"exhibition": 1},
		keywords: map[string]float64{"wernisaz": 2, "abstrakc": 1.5, "wspolczesn": 1, "malarstw": 0.5, "fotografi": 0.5},
	},
	"interiors": {
		kinds:    map[string]float64{"tour": 2},
		venues:   map[string]float64{"galeria-poziom-4": 1, "art-room": 1, "sala-kameralna": 0.5},
		keywords: map[string]float64{"wnetrz": 2, "poziom 4": 1, "sale kameralna": 0.5},
	},
	"city": {
		kinds:    map[string]float64{"tour": 1, "other": 1},
		venues:   map[string]float64{"hol": 0.5},
		keywords: map[string]float64{"ulicami": 2, "miasto": 1.5, "miasta": 1.5, "spacer": 1.5, "architektur": 1, "szczecin": 0.3},
	},
}

// composerBorn holds birth years of the composers in the programmes, keyed by folded name.
var composerBorn = map[string]int{
	"johann bernhard bach": 1676, "georg philipp telemann": 1681, "johann sebastian bach": 1685,
	"joseph haydn": 1732, "johann baptist vanhal": 1739, "wolfgang amadeus mozart": 1756,
	"jozef elsner": 1769, "ludwig van beethoven": 1770, "johann nepomuk hummel": 1778,
	"franciszek lessel": 1780, "heinrich joseph baermann": 1784, "karol kurpinski": 1785,
	"carl maria von weber": 1786, "jan nepomucen bobrowicz": 1805, "felix mendelssohn-bartholdy": 1809,
	"fryderyk chopin": 1810, "robert schumann": 1810, "stanislaw moniuszko": 1819,
	"bedrich smetana": 1824, "johannes brahms": 1833, "heinrich urban": 1837, "max bruch": 1838,
	"piotr czajkowski": 1840, "antonin dvorak": 1841, "gabriel faure": 1845, "leos janacek": 1854,
	"gustav mahler": 1860, "claude debussy": 1862, "richard strauss": 1864, "carl fruhling": 1868,
	"alexander zemlinsky": 1871, "max reger": 1873, "sergiej rachmaninow": 1873, "witold maliszewski": 1873,
	"maurice ravel": 1875, "reinhold gliere": 1875, "mieczyslaw karlowicz": 1876, "feliks nowowiejski": 1877,
	"ottorino respighi": 1879, "gian francesco malipiero": 1882, "igor strawinski": 1882,
	"karol szymanowski": 1882, "bohuslav martinu": 1890, "arthur benjamin": 1893,
	"emil frantisek burian": 1904, "dymitr szostakowicz": 1906, "vaclav trojan": 1907,
	"mieczyslaw wajnberg": 1919, "einojuhani rautavaara": 1928, "myroslav skoryk": 1938,
	"john adams": 1947, "mario venzago": 1948, "miroslav tadic": 1959, "soo yeon lyuh": 1978,
	"marek pasieczny": 1980,
}

const modernFrom = 1860

type eventFeatures struct {
	id         int64
	kind       string
	text       string
	venues     []string
	performers int
	composers  []string
	first      string
	score      float64
}

func (t taste) score(f eventFeatures) float64 {
	s := t.kinds[f.kind]
	for _, v := range f.venues {
		s += t.venues[v]
	}
	if f.performers > 0 && f.performers <= 3 {
		s += t.small
	}
	var known, modern, old int
	for _, c := range f.composers {
		born, ok := composerBorn[Fold(c)]
		if !ok {
			continue
		}
		known++
		if born >= modernFrom {
			modern++
		} else {
			old++
		}
	}
	if known > 0 {
		s += t.modern*float64(modern)/float64(known) + t.old*float64(old)/float64(known)
	}
	for k, w := range t.keywords {
		if strings.Contains(f.text, k) {
			s += w
		}
	}
	return s
}

// Recommend ranks upcoming events for the given tastes (keys of Tastes). Events
// for children and schools, external rentals and events without an image are
// left out: the result feeds a swipe deck of evenings out.
func (s *Store) Recommend(ctx context.Context, lang, today string, tastes []string, limit int) ([]Recommendation, error) {
	profile := make([]taste, 0, len(tastes))
	for _, name := range tastes {
		if t, ok := Tastes[name]; ok {
			profile = append(profile, t)
		}
	}

	where, args := Filter{From: today}.where()
	where += " AND e.image_url IS NOT NULL AND e.kind NOT IN ('education', 'external')"

	rows, err := s.db.QueryContext(ctx, `SELECT e.id, e.kind, MIN(p.starts_at),
			fold(COALESCE(t.title, '') || ' ' || COALESCE(t.subtitle, '') || ' ' || COALESCE(t.description, t.summary, '')),
			group_concat(DISTINCT v.slug),
			(SELECT COUNT(*) FROM event_artists ea WHERE ea.event_id = e.id)
		`+filterFrom+`
		LEFT JOIN event_translations t ON t.event_id = e.id AND t.language_code = 'pl'
		WHERE `+where+` GROUP BY e.id`, args...)
	if err != nil {
		return nil, err
	}
	var events []eventFeatures
	byID := map[int64]*eventFeatures{}
	for rows.Next() {
		var f eventFeatures
		var venues *string
		if err := rows.Scan(&f.id, &f.kind, &f.first, &f.text, &venues, &f.performers); err != nil {
			rows.Close()
			return nil, err
		}
		if venues != nil {
			f.venues = strings.Split(*venues, ",")
		}
		events = append(events, f)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}
	for i := range events {
		byID[events[i].id] = &events[i]
	}

	rows, err = s.db.QueryContext(ctx, `SELECT ew.event_id, c.display_name
		FROM event_works ew JOIN works w ON w.id = ew.work_id JOIN artists c ON c.id = w.composer_id
		ORDER BY ew.event_id, ew.position`)
	if err != nil {
		return nil, err
	}
	composers := map[int64][]string{}
	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			rows.Close()
			return nil, err
		}
		if f, ok := byID[id]; ok {
			f.composers = append(f.composers, name)
			if !slices.Contains(composers[id], name) {
				composers[id] = append(composers[id], name)
			}
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Guided tours differ only by language: prefer the one in the reader's language.
	tourLang := map[string]string{"pl": "polskim", "en": "angielskim", "de": "niemieckim"}[lang]
	for i := range events {
		f := &events[i]
		for _, t := range profile {
			f.score += t.score(*f)
		}
		if f.kind == "tour" && strings.Contains(f.text, "w jezyku "+tourLang) {
			f.score += 0.1
		}
	}
	sort.SliceStable(events, func(i, j int) bool {
		if events[i].score != events[j].score {
			return events[i].score > events[j].score
		}
		if events[i].first != events[j].first {
			return events[i].first < events[j].first
		}
		return events[i].id < events[j].id
	})

	// One card per tour and per repeated title (the same exhibition is listed twice).
	ids := make([]int64, 0, limit)
	scores := map[int64]float64{}
	seen := map[string]bool{}
	for _, f := range events {
		if len(ids) == limit {
			break
		}
		key := f.kind
		if f.kind != "tour" {
			key = firstWords(f.text, 8)
		}
		if seen[key] {
			continue
		}
		seen[key] = true
		ids = append(ids, f.id)
		scores[f.id] = math.Round(f.score*100) / 100
	}

	summaries, err := s.eventSummaries(ctx, lang, ids)
	if err != nil || len(ids) == 0 {
		return []Recommendation{}, err
	}
	perfs, err := s.performances(ctx, where+" AND e.id IN ("+placeholders(len(ids))+") ORDER BY p.starts_at",
		append(args, anyArgs(ids)...), false)
	if err != nil {
		return nil, err
	}
	out := make([]Recommendation, len(summaries))
	index := map[int64]int{}
	for i, e := range summaries {
		out[i] = Recommendation{EventSummary: e, Score: scores[e.ID], Composers: composers[e.ID], Performers: []string{}}
		if out[i].Composers == nil {
			out[i].Composers = []string{}
		}
		index[e.ID] = i
	}
	for _, p := range perfs {
		r := &out[index[p.eventID]]
		r.Performances = append(r.Performances, p.Performance)
	}

	if err := s.recommendationDetails(ctx, lang, ids, out, index); err != nil {
		return nil, err
	}
	return out, nil
}

// recommendationDetails fills in the first performers and a short description.
func (s *Store) recommendationDetails(ctx context.Context, lang string, ids []int64, out []Recommendation, index map[int64]int) error {
	rows, err := s.db.QueryContext(ctx, `SELECT ea.event_id, a.display_name
		FROM event_artists ea JOIN artists a ON a.id = ea.artist_id
		WHERE ea.event_id IN (`+placeholders(len(ids))+`) ORDER BY ea.event_id, ea.position, a.display_name`, anyArgs(ids)...)
	if err != nil {
		return err
	}
	for rows.Next() {
		var id int64
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			rows.Close()
			return err
		}
		name = strings.Join(strings.Fields(name), " ")
		r := &out[index[id]]
		if len(r.Performers) < 3 && !slices.Contains(r.Performers, name) {
			r.Performers = append(r.Performers, name)
		}
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return err
	}

	rows, err = s.db.QueryContext(ctx, `SELECT e.id, COALESCE(t.summary, t.description)
		FROM events e `+translationJoin("event_translations", "t", "event_id", "e")+`
		WHERE e.id IN (`+placeholders(len(ids))+`)`, append([]any{lang}, anyArgs(ids)...)...)
	if err != nil {
		return err
	}
	defer rows.Close()
	for rows.Next() {
		var id int64
		var text *string
		if err := rows.Scan(&id, &text); err != nil {
			return err
		}
		if text != nil {
			if ex := excerpt(*text, 240); ex != "" {
				out[index[id]].Excerpt = &ex
			}
		}
	}
	return rows.Err()
}

// excerpt returns whole sentences from the start of text, up to max characters.
func excerpt(text string, max int) string {
	text = strings.Join(strings.Fields(text), " ")
	runes := []rune(text)
	if len(runes) <= max {
		return text
	}
	cut := string(runes[:max])
	if i := strings.LastIndexAny(cut, ".!?"); i > max/3 {
		return cut[:i+1]
	}
	if i := strings.LastIndex(cut, " "); i > 0 {
		cut = cut[:i]
	}
	return strings.TrimRight(cut, ",;:–- ") + "…"
}

func firstWords(s string, n int) string {
	words := strings.Fields(s)
	return strings.Join(words[:min(n, len(words))], " ")
}
