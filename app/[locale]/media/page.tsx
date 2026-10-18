import { setRequestLocale } from "next-intl/server";
import { Download } from "lucide-react";
import type { Locale } from "@/i18n/config";
import { Logo } from "@/components/brand/logo";
import { BlurImage } from "@/components/ui/blur-image";
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

const PHOTOS = [
  { src: "/photos/3-main.jpg", alt: "Budynek Filharmonii" },
  { src: "/photos/symphonic-1.jpg", alt: "Sala symfoniczna" },
  { src: "/photos/foyer-4.jpg", alt: "Foyer" },
  { src: "/photos/illumination-3.jpg", alt: "Iluminacja" },
];

const C = {
  pl: {
    eyebrow: "Strefa mediów",
    title: "Materiały, które można cytować.",
    lead: "Komunikaty, zdjęcia, logo i biogramy. Wszystko, czego potrzebujesz przed publikacją — w jednym miejscu.",
    sections: {
      news: "Komunikaty",
      photos: "Zdjęcia",
      logo: "Logo",
      bios: "Biogramy",
      contact: "Kontakt dla mediów",
    },
    news: "Najnowsze komunikaty",
    articles: [
      {
        date: "25 czerwca 2026",
        title: "Szczecińscy filharmonicy w Elbphilharmonie",
        body: "Orkiestra po raz pierwszy zagrała w Hamburgu, w jednej z najbardziej prestiżowych sal świata.",
      },
      {
        date: "13 czerwca 2026",
        title: "Koniec 78. sezonu",
        body: "III Symfonia d-moll Mahlera z ponad setką muzyków na scenie zamknęła sezon owacją na stojąco.",
      },
      {
        date: "31 marca 2026",
        title: "Fortepian Bechstein wrócił do domu",
        body: "Instrument z 1865 roku, który grał w przedwojennym Konzerthausie, zabrzmiał ponownie przy Małopolskiej 48.",
      },
      {
        date: "4 września 2025",
        title: "Nowy sezon artystyczny",
        body: "Wielkie dzieła, jazz, muzyka świata i wystawy — zapowiedź sezonu 2025/2026.",
      },
    ],
    photosBody:
      "Zdjęcia z budynku, sal i wydarzeń są dostępne do publikacji w kontekście Filharmonii. Podaj źródło: „Fot. Filharmonia w Szczecinie”. Po materiał w wysokiej rozdzielczości napisz do rzecznika.",
    photoCredit: "Fot. Filharmonia w Szczecinie",
    logoTip:
      "Logo stosuj w oryginalnych proporcjach, z zachowaniem marginesu równego wysokości znaku. Nie zmieniaj kolorów ani układu sygnetu i napisu.",
    biosBody:
      "Biogramy orkiestry, dyrygentów i gości są w katalogu artystów. Najważniejsze fakty: zespół działa od 1948 roku, liczy ponad 90 muzyków i w 2023 roku otrzymał Złoty Medal Gloria Artis.",
    contactBody: [
      "Rzecznik prasowy: rzecznik@filharmonia.szczecin.pl, tel. +48 537 999 308.",
      "Sekretariat: sekretariat@filharmonia.szczecin.pl, tel. +48 91 430 95 11, poniedziałek–piątek 8:00–16:00.",
    ],
    facts: [
      { value: "1948", label: "Rok założenia" },
      { value: "90+", label: "Muzyków" },
      { value: "2023", label: "Gloria Artis" },
      { value: "24 h", label: "Czas odpowiedzi" },
    ],
    actions: {
      write: "Napisz do rzecznika",
      artists: "Biogramy artystów",
      history: "Historia",
      download: "Pobierz logo",
    },
    note: "Materiały prasowe w wersjach PL/EN/DE udostępniamy na życzenie. Zdjęcia objęte są prawami autorskimi — prosimy o podanie źródła.",
    footerTitle: "Piszemy o tym, co ważne.",
    footerBody:
      "Potrzebujesz cytatu, zdjęcia albo rozmowy z artystą? Napisz do rzecznika — odpowiadamy w ciągu doby.",
    footerLinks: ["Repertuar", "Orkiestra", "Historia"],
  },
  en: {
    eyebrow: "Media room",
    title: "Materials you can quote.",
    lead: "Announcements, photographs, logo and biographies. Everything you need before publishing — in one place.",
    sections: {
      news: "Announcements",
      photos: "Photographs",
      logo: "Logo",
      bios: "Biographies",
      contact: "Press contact",
    },
    news: "Latest announcements",
    articles: [
      {
        date: "25 June 2026",
        title: "Szczecin musicians at the Elbphilharmonie",
        body: "The orchestra performed for the first time in Hamburg, in one of the world's most prestigious halls.",
      },
      {
        date: "13 June 2026",
        title: "The end of the 78th season",
        body: "Mahler's Symphony No. 3 with over a hundred musicians on stage closed the season with a standing ovation.",
      },
      {
        date: "31 March 2026",
        title: "The Bechstein piano came home",
        body: "The 1865 instrument that played in the pre-war Konzerthaus sounded again at Małopolska 48.",
      },
      {
        date: "4 September 2025",
        title: "A new artistic season",
        body: "Great works, jazz, world music and exhibitions — the 2025/2026 season preview.",
      },
    ],
    photosBody:
      "Photographs of the building, halls and events are available for publication in the context of the Philharmonic. Credit: “Photo: Szczecin Philharmonic”. For high-resolution material, write to the press office.",
    photoCredit: "Photo: Szczecin Philharmonic",
    logoTip:
      "Use the logo in its original proportions with clear space equal to the mark's height. Do not change the colours or the arrangement of the mark and wordmark.",
    biosBody:
      "Biographies of the orchestra, conductors and guests are in the artist catalogue. Key facts: the ensemble has existed since 1948, has over 90 musicians and received the Gold Gloria Artis Medal in 2023.",
    contactBody: [
      "Press office: rzecznik@filharmonia.szczecin.pl, +48 537 999 308.",
      "Secretariat: sekretariat@filharmonia.szczecin.pl, +48 91 430 95 11, Monday–Friday 8 am–4 pm.",
    ],
    facts: [
      { value: "1948", label: "Founded" },
      { value: "90+", label: "Musicians" },
      { value: "2023", label: "Gloria Artis" },
      { value: "24 h", label: "Response time" },
    ],
    actions: {
      write: "Write to the press office",
      artists: "Artist biographies",
      history: "History",
      download: "Download the logo",
    },
    note: "Press materials in PL/EN/DE are available on request. Photographs are copyrighted — please credit the source.",
    footerTitle: "We write about what matters.",
    footerBody:
      "Need a quote, a photograph or an artist interview? Write to the press office — we reply within a day.",
    footerLinks: ["Programme", "Orchestra", "History"],
  },
  de: {
    eyebrow: "Medienraum",
    title: "Materialien zum Zitieren.",
    lead: "Mitteilungen, Fotos, Logo und Biografien. Alles, was Sie vor der Veröffentlichung brauchen — an einem Ort.",
    sections: {
      news: "Mitteilungen",
      photos: "Fotos",
      logo: "Logo",
      bios: "Biografien",
      contact: "Pressekontakt",
    },
    news: "Neueste Mitteilungen",
    articles: [
      {
        date: "25. Juni 2026",
        title: "Szczeciner Musiker in der Elbphilharmonie",
        body: "Das Orchester spielte erstmals in Hamburg, in einem der renommiertesten Säle der Welt.",
      },
      {
        date: "13. Juni 2026",
        title: "Ende der 78. Saison",
        body: "Mahlers 3. Sinfonie mit über hundert Musikern auf der Bühne beendete die Saison mit stehenden Ovationen.",
      },
      {
        date: "31. März 2026",
        title: "Das Bechstein-Klavier kehrte zurück",
        body: "Das Instrument von 1865, das im Vorkriegs-Konzerthaus spielte, erklang wieder an der Małopolska 48.",
      },
      {
        date: "4. September 2025",
        title: "Eine neue Saison",
        body: "Große Werke, Jazz, Weltmusik und Ausstellungen — die Vorschau auf die Saison 2025/2026.",
      },
    ],
    photosBody:
      "Fotos von Gebäude, Sälen und Veranstaltungen sind zur Veröffentlichung im Kontext der Philharmonie verfügbar. Quelle: „Foto: Philharmonie Szczecin“. Hochauflösendes Material erhalten Sie beim Pressereferat.",
    photoCredit: "Foto: Philharmonie Szczecin",
    logoTip:
      "Verwenden Sie das Logo in den Originalproportionen mit einem Freiraum in Höhe des Zeichens. Farben und Anordnung von Zeichen und Schriftzug nicht verändern.",
    biosBody:
      "Biografien von Orchester, Dirigenten und Gästen finden Sie im Künstlerkatalog. Wichtigste Fakten: Das Ensemble besteht seit 1948, hat über 90 Musiker und erhielt 2023 die Goldmedaille Gloria Artis.",
    contactBody: [
      "Pressereferat: rzecznik@filharmonia.szczecin.pl, +48 537 999 308.",
      "Sekretariat: sekretariat@filharmonia.szczecin.pl, +48 91 430 95 11, Montag–Freitag 8–16 Uhr.",
    ],
    facts: [
      { value: "1948", label: "Gegründet" },
      { value: "90+", label: "Musiker" },
      { value: "2023", label: "Gloria Artis" },
      { value: "24 Std.", label: "Antwortzeit" },
    ],
    actions: {
      write: "An das Pressereferat schreiben",
      artists: "Künstlerbiografien",
      history: "Geschichte",
      download: "Logo herunterladen",
    },
    note: "Pressematerialien in PL/EN/DE stellen wir auf Anfrage bereit. Fotos sind urheberrechtlich geschützt — bitte Quellenangabe.",
    footerTitle: "Wir schreiben über das Wesentliche.",
    footerBody:
      "Sie brauchen ein Zitat, ein Foto oder ein Interview? Schreiben Sie an das Pressereferat — wir antworten innerhalb eines Tages.",
    footerLinks: ["Programm", "Orchester", "Geschichte"],
  },
} as const;

export default async function MediaPage({
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
        image="/photos/exterior-3.jpg"
        imageAlt="Filharmonia Szczecin"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.news}>
        <ul className="flex flex-col">
          {c.articles.map((article) => (
            <li className="border-line border-b py-4" key={article.title}>
              <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.12em] uppercase">
                {article.date}
              </p>
              <h3 className="mt-1.5 text-[17px] leading-[23px] font-bold tracking-[-0.02em]">
                {article.title}
              </h3>
              <p className="text-muted mt-1 max-w-[560px] text-[14px] leading-[21px]">
                {article.body}
              </p>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection index="02" title={c.sections.photos}>
        <p className="text-muted max-w-[600px] text-[15px] leading-[23px]">
          {c.photosBody}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {PHOTOS.map((photo) => (
            <a
              className="focus-visible:outline-gold group block focus-visible:outline-2 focus-visible:outline-offset-2"
              download
              href={photo.src}
              key={photo.src}
            >
              <BlurImage
                alt={photo.alt}
                className="aspect-[4/3] w-full rounded-[16px] transition-opacity group-hover:opacity-90"
                src={photo.src}
              />
              <p className="text-muted mt-1.5 flex items-center gap-1.5 text-[11px] leading-[15px]">
                <Download aria-hidden="true" size={12} strokeWidth={1.8} />
                {c.photoCredit}
              </p>
            </a>
          ))}
        </div>
      </InfoSection>

      <InfoSection index="03" title={c.sections.logo}>
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="bg-ink text-paper flex h-[180px] w-full max-w-[320px] items-center justify-center rounded-[20px]">
            <span className="scale-[1.8]">
              <Logo />
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-muted max-w-[460px] text-[14px] leading-[21px]">
              {c.logoTip}
            </p>
            <InfoActions
              items={[
                {
                  href: "/images/logo-mark.png",
                  label: c.actions.download,
                  external: true,
                },
              ]}
            />
          </div>
        </div>
      </InfoSection>

      <InfoSection index="04" title={c.sections.bios}>
        <Prose>
          <p>{c.biosBody}</p>
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.facts]} />
        </div>
        <InfoActions
          items={[
            { href: "/artists", label: c.actions.artists },
            { href: "/history", label: c.actions.history },
          ]}
        />
      </InfoSection>

      <InfoSection index="05" title={c.sections.contact}>
        <Prose>
          {c.contactBody.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Prose>
        <InfoNote>{c.note}</InfoNote>
        <InfoActions
          items={[
            {
              href: "mailto:rzecznik@filharmonia.szczecin.pl",
              label: c.actions.write,
              external: true,
            },
          ]}
        />
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/calendar", label: c.footerLinks[0] },
          { href: "/artists", label: c.footerLinks[1] },
          { href: "/history", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
