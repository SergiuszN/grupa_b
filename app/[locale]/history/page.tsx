import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import { Timeline, type TimelineEntry } from "@/components/history/timeline";
import {
  InfoActions,
  InfoFooter,
  InfoHero,
  InfoNote,
  InfoScreen,
  InfoSection,
  Prose,
} from "@/components/info/page";

const C: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    lead: string;
    timeline: TimelineEntry[];
    timelineTitle: string;
    archiveTitle: string;
    archive: string[];
    archiveNote: string;
    actions: { archive: string; orchestra: string; programme: string };
    footerTitle: string;
    footerBody: string;
    footerLinks: string[];
    previous: string;
    next: string;
  }
> = {
  pl: {
    eyebrow: "Historia i archiwum",
    title: "Osiemdziesiąt lat dźwięku.",
    lead: "Od kina Bałtyk i sali w urzędzie miasta do Lodowego Pałacu. Przesuń oś czasu i zobacz, jak zmieniała się Filharmonia.",
    timelineTitle: "Oś czasu",
    timeline: [
      {
        year: "1884",
        title: "Konzerthaus",
        body: "18 października otwiera się pierwsza prawdziwa sala koncertowa w Szczecinie. Na inauguracji gra „Stworzenie świata” Haydna. Na jej miejscu stoi dziś Filharmonia.",
      },
      {
        year: "1945",
        title: "Pierwszy koncert",
        body: "23 listopada w kinie Bałtyk zabrzmiały Rachmaninow, Rubinstein i Czajkowski. Muzycy grali w kinach, remizach i zakładach — byle razem.",
      },
      {
        year: "1948",
        title: "Początek orkiestry",
        body: "Powstaje Robotnicze Towarzystwo Muzyczne. Ten rok uznajemy za oficjalny start państwowej orkiestry w Szczecinie; pierwszym dyrygentem zostaje Felicjan Lasota.",
      },
      {
        year: "1953",
        title: "Państwowa Filharmonia",
        body: "15 grudnia, dzięki staraniom Janusza Cegiełły, powstaje Państwowa Filharmonia. Muzycy dostają lewe skrzydło gmachu władz miasta — na sześćdziesiąt lat.",
      },
      {
        year: "1957",
        title: "Sala i patron",
        body: "Sala przechodzi remont: orzechowa boazeria, nowoczesne jarzeniówki. Dyrektyję obejmuje Józef Wiłkomirski, a instytucja zyskuje patrona — Mieczysława Karłowicza.",
      },
      {
        year: "1962",
        title: "Violetta Villas",
        body: "W cyklu „Spotkanie z melodią” występuje dawna uczennica szczecińskiej szkoły muzycznej. Publiczność szaleje, a Filharmonia przeżywa oblężenie.",
      },
      {
        year: "1970",
        title: "Wielka Orkiestra",
        body: "Gwiazdą sezonu 1970/1971 zostaje Wielka Orkiestra Symfoniczna Radia i Telewizji z Moskwy pod batutą Genadija Rożdżestwienskiego.",
      },
      {
        year: "1994",
        title: "Pierwsza dyrektorka",
        body: "Stanowisko dyrektora obejmuje Jadwiga Igiel-Sak. Za jej kadencji powstaje album „Słynne kaprysy”, a miasto zaczyna mówić o nowej sali.",
      },
      {
        year: "1998",
        title: "Fryderyk",
        body: "„Słynne kaprysy” — nagrane z Tatianą Szebanową i Jarosławem Drzewickim pod batutą Jerzego Salwarowskiego — dostają nominację do Fryderyka.",
      },
      {
        year: "2005",
        title: "Polskie Requiem",
        body: "Krzysztof Penderecki dyryguje „Polskim Requiem” na terenie Stoczni Szczecińskiej. To największy koncert w historii miasta.",
      },
      {
        year: "2012",
        title: "Powrót nad Małopolską",
        body: "Dyrektorką zostaje Dorota Serwa. Wraca marzenie o budowie nowej Filharmonii w miejscu przedwojennego Konzerthausu — historia zatacza koło.",
      },
      {
        year: "2014",
        title: "Nowa siedziba",
        body: "5 września orkiestra gra inaugurację w nowym budynku studia Barozzi/Veiga. Sezon 2014/2015 otwiera cykl „ƒorte. ƒortissimo. ƒilharmonia”.",
      },
      {
        year: "2015",
        title: "Mies van der Rohe",
        body: "Budynek otrzymuje nagrodę architektoniczną Unii Europejskiej — Mies van der Rohe Award. „Lodowy Pałac” staje się symbolem miasta.",
      },
      {
        year: "2018",
        title: "Siedemdziesiąt lat",
        body: "Orkiestra świętuje jubileusz. Szefem artystycznym zostaje norweski dyrygent Rune Bergmann, a zespół nagrywa niemal wszystkie dzieła Karłowicza.",
      },
      {
        year: "2023",
        title: "Gloria Artis",
        body: "Orkiestra dostaje Złoty Medal „Zasłużony Kulturze Gloria Artis”. Dyrektorem naczelnym i artystycznym jest Przemysław Neumann.",
      },
      {
        year: "2026",
        title: "Powrót i debiut",
        body: "Do Filharmonii wraca fortepian Bechstein z 1865 roku z przedwojennego Konzerthausu. Orkiestra debiutuje w Elbphilharmonie w Hamburgu.",
      },
    ],
    archiveTitle: "Archiwum",
    archive: [
      "Pełna kronika — zdjęcia, programy, nagrania i wspomnienia — jest w osobnej bazie historii Filharmonii. Sięgamy do niej przy każdym jubileuszu.",
      "Materiały archiwalne i kwerendy: biblioteka oraz sekretariat Filharmonii.",
    ],
    archiveNote:
      "Historia orkiestry i budynku opracowana na podstawie materiałów archiwalnych Filharmonii oraz książki „Filharmonicy szczecińscy 1948–1998” Mikołaja Szczęsnego.",
    actions: {
      archive: "Otwórz archiwum",
      orchestra: "Orkiestra i artyści",
      programme: "Repertuar",
    },
    footerTitle: "Historia gra dalej.",
    footerBody:
      "Najbliższy koncert to kolejny wpis w tej kronice. Zajrzyj do repertuaru.",
    footerLinks: ["Repertuar", "Orkiestra", "Budynek"],
    previous: "Wcześniejszy rok",
    next: "Późniejszy rok",
  },
  en: {
    eyebrow: "History and archive",
    title: "Eighty years of sound.",
    lead: "From the Bałtyk cinema and a room in the city hall to the Ice Palace. Move the timeline and see how the Philharmonic changed.",
    timelineTitle: "Timeline",
    timeline: [
      {
        year: "1884",
        title: "Konzerthaus",
        body: "On 18 October the city's first real concert hall opens with Haydn's “The Creation”. Today's Philharmonic stands on its site.",
      },
      {
        year: "1945",
        title: "The first concert",
        body: "On 23 November the Bałtyk cinema heard Rachmaninoff, Rubinstein and Tchaikovsky. Musicians played in cinemas, depots and factories — anything to play together.",
      },
      {
        year: "1948",
        title: "The orchestra begins",
        body: "The Workers' Music Society is founded. This is the official start of the state orchestra in Szczecin; Felicjan Lasota becomes its first conductor.",
      },
      {
        year: "1953",
        title: "State Philharmonic",
        body: "On 15 December, through Janusz Cegiełła's efforts, the State Philharmonic is established. The musicians receive the left wing of the city hall — for sixty years.",
      },
      {
        year: "1957",
        title: "Hall and patron",
        body: "The hall is renovated: walnut panelling, modern strip lighting. Józef Wiłkomirski takes over, and the institution gains its patron — Mieczysław Karłowicz.",
      },
      {
        year: "1962",
        title: "Violetta Villas",
        body: "A former pupil of the Szczecin music school performs in the “Meeting with Melody” series. The audience goes wild and the Philharmonic is besieged.",
      },
      {
        year: "1970",
        title: "The Great Orchestra",
        body: "The star of the 1970/1971 season is the Moscow Radio and Television Symphony Orchestra under Gennady Rozhdestvensky.",
      },
      {
        year: "1994",
        title: "The first woman director",
        body: "Jadwiga Igiel-Sak becomes director. Her tenure brings the album “Famous Caprices” and the city starts talking about a new hall.",
      },
      {
        year: "1998",
        title: "Fryderyk",
        body: "“Famous Caprices” — recorded with Tatiana Shebanova and Jarosław Drzewiecki under Jerzy Salwarowski — is nominated for a Fryderyk award.",
      },
      {
        year: "2005",
        title: "Polish Requiem",
        body: "Krzysztof Penderecki conducts his “Polish Requiem” at the Szczecin Shipyard. It is the largest concert in the city's history.",
      },
      {
        year: "2012",
        title: "Back to Małopolska",
        body: "Dorota Serwa becomes director. The dream of a new Philharmonic on the site of the pre-war Konzerthaus returns — history comes full circle.",
      },
      {
        year: "2014",
        title: "The new building",
        body: "On 5 September the orchestra opens the Barozzi/Veiga building. The 2014/2015 season begins with the “ƒorte. ƒortissimo. ƒilharmonia” series.",
      },
      {
        year: "2015",
        title: "Mies van der Rohe",
        body: "The building wins the European Union's architecture prize, the Mies van der Rohe Award. The “Ice Palace” becomes a symbol of the city.",
      },
      {
        year: "2018",
        title: "Seventy years",
        body: "The orchestra celebrates its jubilee. Norwegian conductor Rune Bergmann becomes artistic director, and the ensemble records nearly all of Karłowicz's works.",
      },
      {
        year: "2023",
        title: "Gloria Artis",
        body: "The orchestra receives the Gold Medal for Merit to Culture — Gloria Artis. Przemysław Neumann is general and artistic director.",
      },
      {
        year: "2026",
        title: "Return and debut",
        body: "The 1865 Bechstein piano from the pre-war Konzerthaus returns. The orchestra makes its debut at the Elbphilharmonie in Hamburg.",
      },
    ],
    archiveTitle: "Archive",
    archive: [
      "The full chronicle — photographs, programmes, recordings and memories — lives in a separate history database. We return to it at every jubilee.",
      "Archival materials and queries: the library and the Philharmonic secretariat.",
    ],
    archiveNote:
      "The history of the orchestra and building is based on the Philharmonic's archives and Mikołaj Szczęsny's book “Filharmonicy szczecińscy 1948–1998”.",
    actions: {
      archive: "Open the archive",
      orchestra: "Orchestra and artists",
      programme: "Programme",
    },
    footerTitle: "History keeps playing.",
    footerBody:
      "The next concert is another entry in this chronicle. See the programme.",
    footerLinks: ["Programme", "Orchestra", "Building"],
    previous: "Earlier year",
    next: "Later year",
  },
  de: {
    eyebrow: "Geschichte und Archiv",
    title: "Achtzig Jahre Klang.",
    lead: "Vom Kino Bałtyk und einem Saal im Rathaus zum Eispalast. Bewegen Sie die Zeitleiste und sehen Sie, wie sich die Philharmonie verändert hat.",
    timelineTitle: "Zeitleiste",
    timeline: [
      {
        year: "1884",
        title: "Konzerthaus",
        body: "Am 18. Oktober eröffnet der erste echte Konzertsaal der Stadt mit Haydns „Schöpfung“. Heute steht an dieser Stelle die Philharmonie.",
      },
      {
        year: "1945",
        title: "Das erste Konzert",
        body: "Am 23. November erklangen im Kino Bałtyk Rachmaninow, Rubinstein und Tschaikowski. Die Musiker spielten in Kinos, Depots und Fabriken — Hauptsache zusammen.",
      },
      {
        year: "1948",
        title: "Der Anfang des Orchesters",
        body: "Die Arbeiter-Musikgesellschaft wird gegründet. Dies gilt als offizieller Start des staatlichen Orchesters in Szczecin; Felicjan Lasota wird erster Dirigent.",
      },
      {
        year: "1953",
        title: "Staatliche Philharmonie",
        body: "Am 15. Dezember entsteht durch Janusz Cegiełłas Einsatz die Staatliche Philharmonie. Die Musiker erhalten den linken Flügel des Rathauses — für sechzig Jahre.",
      },
      {
        year: "1957",
        title: "Saal und Patron",
        body: "Der Saal wird renoviert: Nussbaumvertäfelung, moderne Leuchtstoffröhren. Józef Wiłkomirski übernimmt, die Institution erhält ihren Patron — Mieczysław Karłowicz.",
      },
      {
        year: "1962",
        title: "Violetta Villas",
        body: "Eine ehemalige Schülerin der Szczeciner Musikschule tritt in der Reihe „Begegnung mit der Melodie“ auf. Das Publikum ist außer sich, die Philharmonie belagert.",
      },
      {
        year: "1970",
        title: "Das Große Orchester",
        body: "Star der Saison 1970/1971 ist das Sinfonieorchester des Moskauer Rundfunks unter Gennadi Roschdestwenski.",
      },
      {
        year: "1994",
        title: "Die erste Direktorin",
        body: "Jadwiga Igiel-Sak wird Direktorin. In ihre Amtszeit fällt das Album „Berühmte Capricen“, und die Stadt beginnt über einen neuen Saal zu sprechen.",
      },
      {
        year: "1998",
        title: "Fryderyk",
        body: "„Berühmte Capricen“ — mit Tatiana Shebanova und Jarosław Drzewiecki unter Jerzy Salwarowski — wird für den Fryderyk-Preis nominiert.",
      },
      {
        year: "2005",
        title: "Polnisches Requiem",
        body: "Krzysztof Penderecki dirigiert sein „Polnisches Requiem“ auf dem Gelände der Szczeciner Werft. Es ist das größte Konzert der Stadtgeschichte.",
      },
      {
        year: "2012",
        title: "Zurück an die Małopolska",
        body: "Dorota Serwa wird Direktorin. Der Traum von einer neuen Philharmonie am Ort des Vorkriegs-Konzerthauses kehrt zurück — die Geschichte schließt den Kreis.",
      },
      {
        year: "2014",
        title: "Das neue Haus",
        body: "Am 5. September eröffnet das Orchester den Bau von Barozzi/Veiga. Die Saison 2014/2015 beginnt mit der Reihe „ƒorte. ƒortissimo. ƒilharmonia“.",
      },
      {
        year: "2015",
        title: "Mies van der Rohe",
        body: "Das Gebäude gewinnt den Architekturpreis der Europäischen Union, den Mies van der Rohe Award. Der „Eispalast“ wird zum Symbol der Stadt.",
      },
      {
        year: "2018",
        title: "Siebzig Jahre",
        body: "Das Orchester feiert Jubiläum. Der norwegische Dirigent Rune Bergmann wird Künstlerischer Leiter, das Ensemble nimmt fast alle Werke von Karłowicz auf.",
      },
      {
        year: "2023",
        title: "Gloria Artis",
        body: "Das Orchester erhält die Goldmedaille „Verdient um die Kultur — Gloria Artis“. Przemysław Neumann ist General- und Künstlerischer Direktor.",
      },
      {
        year: "2026",
        title: "Rückkehr und Debüt",
        body: "Das Bechstein-Klavier von 1865 aus dem Vorkriegs-Konzerthaus kehrt zurück. Das Orchester debütiert in der Elbphilharmonie in Hamburg.",
      },
    ],
    archiveTitle: "Archiv",
    archive: [
      "Die vollständige Chronik — Fotos, Programme, Aufnahmen und Erinnerungen — liegt in einer eigenen Historien-Datenbank. Zu jedem Jubiläum greifen wir darauf zurück.",
      "Archivmaterial und Recherchen: Bibliothek und Sekretariat der Philharmonie.",
    ],
    archiveNote:
      "Die Geschichte von Orchester und Gebäude basiert auf den Archiven der Philharmonie und Mikołaj Szczęsnys Buch „Filharmonicy szczecińscy 1948–1998“.",
    actions: {
      archive: "Archiv öffnen",
      orchestra: "Orchester und Künstler",
      programme: "Programm",
    },
    footerTitle: "Die Geschichte spielt weiter.",
    footerBody:
      "Das nächste Konzert ist ein weiterer Eintrag in dieser Chronik. Sehen Sie ins Programm.",
    footerLinks: ["Programm", "Orchester", "Gebäude"],
    previous: "Früheres Jahr",
    next: "Späteres Jahr",
  },
};

export default async function HistoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const c = C[(locale as Locale) in C ? (locale as Locale) : "pl"];

  return (
    <InfoScreen>
      <InfoHero
        eyebrow={c.eyebrow}
        image="/photos/1-main.jpg"
        imageAlt="Filharmonia Szczecin"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.timelineTitle}>
        <Timeline
          entries={c.timeline}
          labels={{ previous: c.previous, next: c.next }}
        />
      </InfoSection>

      <InfoSection index="02" title={c.archiveTitle}>
        <Prose>
          {c.archive.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoNote>{c.archiveNote}</InfoNote>
        <InfoActions
          items={[
            {
              href: "https://historia.filharmonia.szczecin.pl/pl",
              label: c.actions.archive,
              external: true,
            },
            { href: "/artists", label: c.actions.orchestra },
          ]}
        />
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/artists", label: c.footerLinks[1] },
          { href: "/building", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
