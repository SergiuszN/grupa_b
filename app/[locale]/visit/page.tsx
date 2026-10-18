import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import {
  InfoActions,
  InfoFooter,
  InfoFacts,
  InfoHero,
  InfoNote,
  InfoScreen,
  InfoSection,
  Prose,
} from "@/components/info/page";

const C = {
  pl: {
    eyebrow: "Planuj wizytę",
    title: "Wszystko, co warto wiedzieć przed wieczorem.",
    lead: "Bilety, dojazd, parking, szatnia i sale — w jednym miejscu. Reszta dzieje się już na miejscu.",
    sections: {
      tickets: "Bilety",
      transport: "Dojazd",
      parking: "Parking",
      cloakroom: "Szatnia",
      halls: "Sale",
      access: "Dostępność",
      food: "Kawiarnie",
    },
    tickets: [
      "Bilety kupisz całodobowo online, w kasie i w biletomacie. Po zapłacie PDF przychodzi e-mailem — wystarczy pokazać go na telefonie.",
      "Kasa: wtorek–czwartek 13:00–18:00, piątek 13:00–20:00, sobota 12:00–16:00 oraz na godzinę przed każdym wydarzeniem. Rezerwację trzeba wykupić w ciągu 7 dni.",
      "Ulgi przysługują m.in. uczniom, studentom do 26 lat, seniorom i osobom z orzeczeniem o niepełnosprawności. Bilet grupowy zaczyna się od 15 osób.",
    ],
    ticketFacts: [
      { value: "24/7", label: "Sprzedaż online" },
      { value: "7 dni", label: "Na wykup rezerwacji" },
      { value: "15+", label: "Bilet grupowy" },
      { value: "30 zł", label: "Bilet studencki" },
    ],
    ticketNote:
      "Bilety kupione online nie podlegają zwrotowi ani wymianie, z wyjątkiem odwołania wydarzenia. Niewykorzystany bilet traci ważność.",
    transport: [
      "Autobus 70 i tramwaje 1 oraz 4 zatrzymują się na przystanku Filharmonia, tuż obok budynku. Autobus 90 — przystanek Starzyńskiego.",
      "Około 5 minut pieszo od Placu Rodła, skąd odjeżdżają autobusy 107, A, B, C, 59 i 68 oraz tramwaje 2, 3, 5, 10 i 11.",
    ],
    transportActions: ["Mapa i dojazd", "Rozkłady jazdy"],
    parking: [
      "Dwupoziomowy parking podziemny na 154 miejsca. Wjazd od ul. Małopolskiej 48, winda prowadzi prosto do holu.",
      "Parking otwiera się godzinę przed wydarzeniem i jest bezpłatny dla gości z biletem.",
    ],
    parkingFacts: [
      { value: "154", label: "Miejsca" },
      { value: "2", label: "Poziomy" },
      { value: "4", label: "Miejsca dla ON" },
      { value: "0 zł", label: "Z biletem" },
    ],
    cloakroom: [
      "Szatnia jest w holu, na wprost drzwi wejściowych. Zostawisz tam płaszcz, kurtkę i parasol.",
      "Otwiera się godzinę przed koncertem i zamyka 30 minut po jego zakończeniu — pamiętaj o odbiorze rzeczy.",
    ],
    halls: [
      "Sala symfoniczna, zwana Słoneczną, ma 953 miejsca i akustykę porównywaną z wiedeńskim Musikverein. Sala kameralna — 192 miejsca — nazywana jest „akustyczną perełką”.",
      "Koncerty kameralne odbywają się też w holu, bez numerowanych miejsc.",
    ],
    hallsFacts: [
      { value: "953", label: "Sala symfoniczna" },
      { value: "192", label: "Sala kameralna" },
      { value: "40 min", label: "Zwiedzanie" },
      { value: "3", label: "Języki zwiedzania" },
    ],
    hallsActions: ["Budynek i sale", "Zwiedzanie z przewodnikiem"],
    access: [
      "Wejście główne jest na poziomie chodnika, bez barier. Windy prowadzą do obu sal, galerii i na parking podziemny.",
      "W obu salach są miejsca dla osób na wózkach. Przed zakupem biletu skontaktuj się z kasą — dobierze miejsce i może zapewnić asystenta podczas koncertu.",
      "Osoby z orzeczeniem o niepełnosprawności mają bilety ulgowe, a w przypadku znacznego stopnia — bilety po 10 zł. Opiekun również kupuje bilet ulgowy.",
    ],
    accessNote:
      "Kontakt w sprawie dostępności: Katarzyna Hołownia, kasa Filharmonii, tel. +48 91 431 07 20, kasa@filharmonia.szczecin.pl.",
    food: [
      "Symfonia Cafe w holu: wtorek–piątek 10:00–18:00, weekend 12:00–18:00, w dni koncertowe do ostatniego gościa.",
      "Kawiarnia koncertowa na 3. piętrze jest otwarta wyłącznie podczas koncertów w sali symfonicznej — godzinę przed startem.",
    ],
    footerTitle: "Przyjdź 20 minut wcześniej.",
    footerBody:
      "Drzwi otwieramy godzinę przed wydarzeniem, sala — pół godziny. Dzwonki przypomną o początku.",
    footerLinks: ["Repertuar", "Dojazd", "Zwiedzanie"],
    actions: {
      programme: "Repertuar",
      directions: "Mapa i dojazd",
      tours: "Zwiedzanie",
      building: "Budynek",
      schedule: "Rozkłady jazdy",
    },
  },
  en: {
    eyebrow: "Plan your visit",
    title: "Everything worth knowing before the evening.",
    lead: "Tickets, transport, parking, cloakroom and halls — in one place. The rest happens on site.",
    sections: {
      tickets: "Tickets",
      transport: "Getting here",
      parking: "Parking",
      cloakroom: "Cloakroom",
      halls: "Halls",
      access: "Accessibility",
      food: "Cafés",
    },
    tickets: [
      "Tickets are available online around the clock, at the box office and at the ticket machine. After payment a PDF arrives by e-mail — showing it on your phone is enough.",
      "Box office: Tuesday–Thursday 1–6 pm, Friday 1–8 pm, Saturday 12–4 pm, and one hour before every event. Reservations must be paid within 7 days.",
      "Concessions include pupils, students up to 26, seniors and people with a disability certificate. Group tickets start at 15 people.",
    ],
    ticketFacts: [
      { value: "24/7", label: "Online sales" },
      { value: "7 days", label: "To pay a reservation" },
      { value: "15+", label: "Group ticket" },
      { value: "30 PLN", label: "Student ticket" },
    ],
    ticketNote:
      "Tickets bought online cannot be returned or exchanged unless the event is cancelled. An unused ticket expires.",
    transport: [
      "Bus 70 and trams 1 and 4 stop at Filharmonia, right next to the building. Bus 90 stops at Starzyńskiego.",
      "About 5 minutes on foot from Plac Rodła, served by buses 107, A, B, C, 59 and 68 and trams 2, 3, 5, 10 and 11.",
    ],
    transportActions: ["Map and directions", "Timetables"],
    parking: [
      "A two-level underground car park with 154 spaces. Entry from Małopolska 48; the lift takes you straight to the foyer.",
      "The car park opens an hour before the event and is free for ticket holders.",
    ],
    parkingFacts: [
      { value: "154", label: "Spaces" },
      { value: "2", label: "Levels" },
      { value: "4", label: "Accessible spaces" },
      { value: "0 PLN", label: "With a ticket" },
    ],
    cloakroom: [
      "The cloakroom is in the foyer, opposite the main door. Leave your coat, jacket and umbrella there.",
      "It opens an hour before the concert and closes 30 minutes after it ends — remember to collect your things.",
    ],
    halls: [
      "The symphonic hall, known as the Sun Hall, seats 953 and has acoustics compared to Vienna's Musikverein. The chamber hall — 192 seats — is called an “acoustic gem”.",
      "Chamber concerts also take place in the foyer, without numbered seats.",
    ],
    hallsFacts: [
      { value: "953", label: "Symphonic hall" },
      { value: "192", label: "Chamber hall" },
      { value: "40 min", label: "Guided tour" },
      { value: "3", label: "Tour languages" },
    ],
    hallsActions: ["Building and halls", "Guided tours"],
    access: [
      "The main entrance is at pavement level, without barriers. Lifts reach both halls, the galleries and the underground car park.",
      "Both halls have spaces for wheelchair users. Contact the box office before buying — they will choose a seat and can arrange an assistant during the concert.",
      "People with a disability certificate pay the concession price, and 10 PLN for a significant degree. A companion also buys a concession ticket.",
    ],
    accessNote:
      "Accessibility contact: Katarzyna Hołownia, box office, +48 91 431 07 20, kasa@filharmonia.szczecin.pl.",
    food: [
      "Symfonia Cafe in the foyer: Tuesday–Friday 10 am–6 pm, weekends 12–6 pm, on concert days until the last guest.",
      "The concert café on level 3 is open only during symphonic concerts — from an hour before the start.",
    ],
    footerTitle: "Arrive 20 minutes early.",
    footerBody:
      "Doors open an hour before the event, the hall half an hour before. The bells will remind you.",
    footerLinks: ["Programme", "Directions", "Guided tours"],
    actions: {
      programme: "Programme",
      directions: "Map and directions",
      tours: "Guided tours",
      building: "Building",
      schedule: "Timetables",
    },
  },
  de: {
    eyebrow: "Besuch planen",
    title: "Alles Wichtige vor dem Abend.",
    lead: "Tickets, Anreise, Parken, Garderobe und Säle — an einem Ort. Der Rest passiert vor Ort.",
    sections: {
      tickets: "Tickets",
      transport: "Anreise",
      parking: "Parken",
      cloakroom: "Garderobe",
      halls: "Säle",
      access: "Barrierefreiheit",
      food: "Cafés",
    },
    tickets: [
      "Tickets gibt es rund um die Uhr online, an der Kasse und am Automaten. Nach der Zahlung kommt das PDF per E-Mail — das Handy genügt am Eingang.",
      "Kasse: Dienstag–Donnerstag 13–18 Uhr, Freitag 13–20 Uhr, Samstag 12–16 Uhr und eine Stunde vor jeder Veranstaltung. Reservierungen müssen binnen 7 Tagen bezahlt werden.",
      "Ermäßigungen gelten unter anderem für Schüler, Studierende bis 26, Seniorinnen und Senioren sowie Menschen mit Schwerbehindertenausweis. Gruppentickets ab 15 Personen.",
    ],
    ticketFacts: [
      { value: "24/7", label: "Online-Verkauf" },
      { value: "7 Tage", label: "Für die Zahlung" },
      { value: "15+", label: "Gruppenticket" },
      { value: "30 PLN", label: "Studierendenticket" },
    ],
    ticketNote:
      "Online gekaufte Tickets können nicht zurückgegeben oder umgetauscht werden, außer bei Absage der Veranstaltung. Unbenutzte Tickets verfallen.",
    transport: [
      "Bus 70 sowie die Straßenbahnen 1 und 4 halten direkt am Haus (Haltestelle Filharmonia). Bus 90 hält an der Haltestelle Starzyńskiego.",
      "Etwa 5 Minuten zu Fuß vom Plac Rodła mit den Bussen 107, A, B, C, 59 und 68 sowie den Straßenbahnen 2, 3, 5, 10 und 11.",
    ],
    transportActions: ["Karte und Anfahrt", "Fahrpläne"],
    parking: [
      "Zweigeschossige Tiefgarage mit 154 Plätzen. Einfahrt von der Małopolska 48, der Aufzug führt direkt ins Foyer.",
      "Die Garage öffnet eine Stunde vor der Veranstaltung und ist für Gäste mit Ticket kostenlos.",
    ],
    parkingFacts: [
      { value: "154", label: "Plätze" },
      { value: "2", label: "Ebenen" },
      { value: "4", label: "Behindertenplätze" },
      { value: "0 PLN", label: "Mit Ticket" },
    ],
    cloakroom: [
      "Die Garderobe liegt im Foyer, gegenüber dem Haupteingang. Mantel, Jacke und Schirm können Sie dort abgeben.",
      "Sie öffnet eine Stunde vor dem Konzert und schließt 30 Minuten nach dem Ende — bitte denken Sie an die Abholung.",
    ],
    halls: [
      "Der Sinfoniesaal, der „Sonnensaal“, bietet 953 Plätze und eine Akustik, die mit dem Wiener Musikverein verglichen wird. Der Kammermusiksaal mit 192 Plätzen gilt als „akustisches Juwel“.",
      "Kammerkonzerte finden auch im Foyer statt, ohne nummerierte Plätze.",
    ],
    hallsFacts: [
      { value: "953", label: "Sinfoniesaal" },
      { value: "192", label: "Kammermusiksaal" },
      { value: "40 Min.", label: "Führung" },
      { value: "3", label: "Sprachen" },
    ],
    hallsActions: ["Gebäude und Säle", "Führungen"],
    access: [
      "Der Haupteingang liegt auf Gehsteigebene und ist barrierefrei. Aufzüge führen in beide Säle, zu den Galerien und in die Tiefgarage.",
      "Beide Säle haben Plätze für Rollstuhlfahrer. Kontaktieren Sie vor dem Kauf die Kasse — sie wählt einen passenden Platz und organisiert auf Wunsch eine Begleitung.",
      "Menschen mit Schwerbehindertenausweis zahlen den ermäßigten Preis, bei hohem Grad 10 PLN. Eine Begleitperson erhält ebenfalls eine ermäßigte Karte.",
    ],
    accessNote:
      "Kontakt zur Barrierefreiheit: Katarzyna Hołownia, Kasse, +48 91 431 07 20, kasa@filharmonia.szczecin.pl.",
    food: [
      "Symfonia Cafe im Foyer: Dienstag–Freitag 10–18 Uhr, Wochenende 12–18 Uhr, an Konzerttagen bis zum letzten Gast.",
      "Das Konzertcafé in der 3. Etage ist nur bei Sinfoniekonzerten geöffnet — ab einer Stunde vor Beginn.",
    ],
    footerTitle: "Kommen Sie 20 Minuten früher.",
    footerBody:
      "Die Türen öffnen eine Stunde vor der Veranstaltung, der Saal eine halbe Stunde vorher. Die Glocken erinnern an den Beginn.",
    footerLinks: ["Programm", "Anfahrt", "Führungen"],
    actions: {
      programme: "Programm",
      directions: "Karte und Anfahrt",
      tours: "Führungen",
      building: "Gebäude",
      schedule: "Fahrpläne",
    },
  },
} as const;

export default async function VisitPage({
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
        image="/photos/foyer-4.jpg"
        imageAlt="Foyer Filharmonii"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.tickets}>
        <Prose>
          {c.tickets.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.ticketFacts]} />
        </div>
        <InfoNote>{c.ticketNote}</InfoNote>
        <InfoActions
          items={[
            { href: "/calendar", label: c.actions.programme },
            { href: "/tours", label: c.actions.tours },
          ]}
        />
      </InfoSection>

      <InfoSection index="02" title={c.sections.transport}>
        <Prose>
          {c.transport.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoActions
          items={[
            { href: "/directions", label: c.actions.directions },
            {
              href: "https://www.zditm.szczecin.pl",
              label: c.actions.schedule,
              external: true,
            },
          ]}
        />
      </InfoSection>

      <InfoSection index="03" title={c.sections.parking}>
        <Prose>
          {c.parking.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.parkingFacts]} />
        </div>
      </InfoSection>

      <InfoSection index="04" title={c.sections.cloakroom}>
        <Prose>
          {c.cloakroom.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </InfoSection>

      <InfoSection id="halls" index="05" title={c.sections.halls}>
        <Prose>
          {c.halls.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.hallsFacts]} />
        </div>
        <InfoActions
          items={[
            { href: "/building", label: c.actions.building },
            { href: "/tours", label: c.actions.tours },
          ]}
        />
      </InfoSection>

      <InfoSection index="06" title={c.sections.access}>
        <Prose>
          {c.access.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoNote>{c.accessNote}</InfoNote>
      </InfoSection>

      <InfoSection index="07" title={c.sections.food}>
        <Prose>
          {c.food.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/directions", label: c.footerLinks[1] },
          { href: "/tours", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
