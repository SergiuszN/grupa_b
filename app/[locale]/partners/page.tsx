import { setRequestLocale } from "next-intl/server";
import { Building2, Handshake, Megaphone, Sparkles } from "lucide-react";
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
    eyebrow: "Partnerzy i biznes",
    title: "Kultura i biznes grają razem.",
    lead: "Partnerstwo rozumiemy dosłownie: obie strony mają z niego wynieść coś, co da się zmierzyć — wizerunek, relacje, doświadczenie.",
    sections: {
      idea: "Partnerstwo",
      forms: "Formy współpracy",
      current: "Obecni partnerzy",
      rent: "Wynajem przestrzeni",
      contact: "Kontakt",
    },
    idea: [
      "Współpracę z otoczeniem biznesowym budujemy jak relację: długoterminowo, indywidualnie i z poszanowaniem swobody wyboru. Zależy nam na modelu win-win, nie na jednorazowej transakcji.",
      "Przez lata wypracowaliśmy plany działań promocyjnych dopasowane do różnych celów — od budowania marki po relacje z klientami i zespołem. Chętnie przygotujemy propozycję pod konkretną firmę.",
      "Zapraszamy także do współpracy przy pojedynczych wydarzeniach okazjonalnych i projektach społecznych.",
    ],
    forms: [
      {
        title: "Mecenas",
        body: "Najwyższy poziom partnerstwa: wsparcie całego sezonu artystycznego i obecność w komunikacji instytucji.",
        icon: Sparkles,
      },
      {
        title: "Patron sezonu",
        body: "Wsparcie sezonu z ekspozycją marki w materiałach, na stronie i podczas wybranych wydarzeń.",
        icon: Megaphone,
      },
      {
        title: "Partner wydarzenia",
        body: "Współpraca przy jednym koncercie, festiwalu lub projekcie — z pakietem świadczeń szytym na miarę.",
        icon: Handshake,
      },
      {
        title: "Wynajem i wspólne projekty",
        body: "Wydarzenia firmowe, konferencje i sesje zdjęciowe w przestrzeniach Filharmonii.",
        icon: Building2,
      },
    ],
    current: "Mecenas, patroni i partnerzy",
    partners: [
      { name: "Enea", role: "Mecenas Filharmonii" },
      { name: "STRABAG", role: "Patron sezonu 2026/2027" },
      { name: "Dealer BMW Bońkowscy", role: "Partner motoryzacyjny" },
      { name: "Sanprobi", role: "Partner zdrowia" },
      { name: "Ibis Styles Szczecin Stare Miasto", role: "Partner wspierający" },
      { name: "Novotel Szczecin Centrum", role: "Partner wspierający" },
      { name: "Home.pl", role: "Partner wspierający" },
      { name: "Eryk Sp. z o.o.", role: "Partner Jazz Camp for Kids 2026" },
    ],
    rent: [
      "Sala symfoniczna, sala kameralna, hol główny i przestrzeń wystawiennicza Poziom 4. są dostępne na wydarzenia artystyczne, konferencje i uroczystości firmowe.",
      "Ceny są ustalane indywidualnie. Przy współpracy z Filharmonią obowiązuje rabat.",
    ],
    rentFacts: [
      { value: "16 000 zł", label: "Sala symfoniczna / 6 h" },
      { value: "6 500 zł", label: "Sala kameralna / 6 h" },
      { value: "8 000 zł", label: "Hol / 6 h" },
      { value: "5 000 zł", label: "Poziom 4. / 6 h" },
    ],
    rentNote:
      "Ceny netto, orientacyjne, dla sezonu 2025/2026. Każda dodatkowa godzina jest wyceniana osobno. Sesje zdjęciowe wyceniamy po konsultacji.",
    contact: [
      "Partnerstwo biznesowe: Jakub Gibowski, tel. +48 531 300 190, j.gibowski@filharmonia.szczecin.pl.",
      "Wynajem przestrzeni: Magdalena Sawicka-Błądek, tel. +48 576 050 270, wynajmy@filharmonia.szczecin.pl.",
    ],
    actions: {
      write: "Porozmawiajmy o partnerstwie",
      rent: "Zapytaj o wynajem",
      programme: "Repertuar",
    },
    footerTitle: "Zbudujmy sezon razem.",
    footerBody:
      "Opowiedz nam o celu, a przygotujemy pakiet świadczeń dopasowany do firmy.",
    footerLinks: ["Repertuar", "Planuj wizytę", "Strefa mediów"],
  },
  en: {
    eyebrow: "Partners and business",
    title: "Culture and business play together.",
    lead: "We take partnership literally: both sides should gain something measurable — image, relationships, experience.",
    sections: {
      idea: "Partnership",
      forms: "Ways to work together",
      current: "Current partners",
      rent: "Venue hire",
      contact: "Contact",
    },
    idea: [
      "We build business relationships like any relationship: long-term, individually and with room to choose. We want a win-win model, not a one-off transaction.",
      "Over the years we have developed promotional plans for different goals — from brand building to customer and team relations. We are happy to prepare a proposal for a specific company.",
      "We also welcome collaboration on single occasional events and community projects.",
    ],
    forms: [
      {
        title: "Patron",
        body: "The highest level of partnership: support for the whole artistic season and presence in the institution's communication.",
        icon: Sparkles,
      },
      {
        title: "Season patron",
        body: "Season support with brand exposure in materials, on the website and at selected events.",
        icon: Megaphone,
      },
      {
        title: "Event partner",
        body: "Collaboration on one concert, festival or project — with a tailored package of benefits.",
        icon: Handshake,
      },
      {
        title: "Venue hire and joint projects",
        body: "Corporate events, conferences and photo shoots in the Philharmonic's spaces.",
        icon: Building2,
      },
    ],
    current: "Patrons and partners",
    partners: [
      { name: "Enea", role: "Patron of the Philharmonic" },
      { name: "STRABAG", role: "Season patron 2026/2027" },
      { name: "Dealer BMW Bońkowscy", role: "Automotive partner" },
      { name: "Sanprobi", role: "Health partner" },
      { name: "Ibis Styles Szczecin Stare Miasto", role: "Supporting partner" },
      { name: "Novotel Szczecin Centrum", role: "Supporting partner" },
      { name: "Home.pl", role: "Supporting partner" },
      { name: "Eryk Sp. z o.o.", role: "Jazz Camp for Kids 2026 partner" },
    ],
    rent: [
      "The symphonic hall, chamber hall, main foyer and the Level 4 exhibition space are available for artistic events, conferences and corporate ceremonies.",
      "Prices are set individually. Partners working with the Philharmonic receive a discount.",
    ],
    rentFacts: [
      { value: "16,000 PLN", label: "Symphonic hall / 6 h" },
      { value: "6,500 PLN", label: "Chamber hall / 6 h" },
      { value: "8,000 PLN", label: "Foyer / 6 h" },
      { value: "5,000 PLN", label: "Level 4 / 6 h" },
    ],
    rentNote:
      "Net indicative prices for the 2025/2026 season. Each additional hour is priced separately. Photo shoots are quoted after consultation.",
    contact: [
      "Business partnerships: Jakub Gibowski, +48 531 300 190, j.gibowski@filharmonia.szczecin.pl.",
      "Venue hire: Magdalena Sawicka-Błądek, +48 576 050 270, wynajmy@filharmonia.szczecin.pl.",
    ],
    actions: {
      write: "Let's talk partnership",
      rent: "Ask about venue hire",
      programme: "Programme",
    },
    footerTitle: "Let's build a season together.",
    footerBody:
      "Tell us your goal and we will prepare a package tailored to your company.",
    footerLinks: ["Programme", "Plan your visit", "Media room"],
  },
  de: {
    eyebrow: "Partner und Wirtschaft",
    title: "Kultur und Wirtschaft spielen zusammen.",
    lead: "Partnerschaft verstehen wir wörtlich: Beide Seiten sollen etwas Messbares gewinnen — Image, Beziehungen, Erfahrung.",
    sections: {
      idea: "Partnerschaft",
      forms: "Formen der Zusammenarbeit",
      current: "Aktuelle Partner",
      rent: "Raumvermietung",
      contact: "Kontakt",
    },
    idea: [
      "Beziehungen zur Wirtschaft bauen wir wie jede Beziehung auf: langfristig, individuell und mit Wahlfreiheit. Uns geht es um ein Win-win-Modell, nicht um ein einmaliges Geschäft.",
      "Über die Jahre haben wir Aktionspläne für verschiedene Ziele entwickelt — vom Markenaufbau bis zu Kunden- und Teambeziehungen. Für ein konkretes Unternehmen erstellen wir gern ein Angebot.",
      "Auch bei einzelnen Gelegenheitsveranstaltungen und sozialen Projekten arbeiten wir gern zusammen.",
    ],
    forms: [
      {
        title: "Mäzen",
        body: "Die höchste Partnerschaftsstufe: Unterstützung der gesamten Saison und Präsenz in der Kommunikation der Institution.",
        icon: Sparkles,
      },
      {
        title: "Saisonpatron",
        body: "Saisonunterstützung mit Markenpräsenz in Materialien, auf der Website und bei ausgewählten Veranstaltungen.",
        icon: Megaphone,
      },
      {
        title: "Veranstaltungspartner",
        body: "Zusammenarbeit bei einem Konzert, Festival oder Projekt — mit maßgeschneidertem Leistungspaket.",
        icon: Handshake,
      },
      {
        title: "Vermietung und gemeinsame Projekte",
        body: "Firmenveranstaltungen, Konferenzen und Fotoshootings in den Räumen der Philharmonie.",
        icon: Building2,
      },
    ],
    current: "Mäzene und Partner",
    partners: [
      { name: "Enea", role: "Mäzen der Philharmonie" },
      { name: "STRABAG", role: "Saisonpatron 2026/2027" },
      { name: "Dealer BMW Bońkowscy", role: "Automobilpartner" },
      { name: "Sanprobi", role: "Gesundheitspartner" },
      { name: "Ibis Styles Szczecin Stare Miasto", role: "Förderpartner" },
      { name: "Novotel Szczecin Centrum", role: "Förderpartner" },
      { name: "Home.pl", role: "Förderpartner" },
      { name: "Eryk Sp. z o.o.", role: "Partner Jazz Camp for Kids 2026" },
    ],
    rent: [
      "Sinfoniesaal, Kammermusiksaal, Hauptfoyer und die Ausstellungsfläche Ebene 4 stehen für künstlerische Veranstaltungen, Konferenzen und Firmenfeiern zur Verfügung.",
      "Die Preise werden individuell festgelegt. Bei Zusammenarbeit mit der Philharmonie gilt ein Rabatt.",
    ],
    rentFacts: [
      { value: "16.000 PLN", label: "Sinfoniesaal / 6 Std." },
      { value: "6.500 PLN", label: "Kammermusiksaal / 6 Std." },
      { value: "8.000 PLN", label: "Foyer / 6 Std." },
      { value: "5.000 PLN", label: "Ebene 4 / 6 Std." },
    ],
    rentNote:
      "Netto-Richtpreise für die Saison 2025/2026. Jede weitere Stunde wird separat berechnet. Fotoshootings werden nach Beratung kalkuliert.",
    contact: [
      "Wirtschaftspartnerschaften: Jakub Gibowski, +48 531 300 190, j.gibowski@filharmonia.szczecin.pl.",
      "Raumvermietung: Magdalena Sawicka-Błądek, +48 576 050 270, wynajmy@filharmonia.szczecin.pl.",
    ],
    actions: {
      write: "Sprechen wir über Partnerschaft",
      rent: "Nach Vermietung fragen",
      programme: "Programm",
    },
    footerTitle: "Bauen wir gemeinsam eine Saison.",
    footerBody:
      "Erzählen Sie uns Ihr Ziel — wir erstellen ein passendes Paket für Ihr Unternehmen.",
    footerLinks: ["Programm", "Besuch planen", "Medienraum"],
  },
} as const;

export default async function PartnersPage({
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
        image="/photos/illumination-2.jpg"
        imageAlt="Iluminacja Filharmonii"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.idea}>
        <Prose>
          {c.idea.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </InfoSection>

      <InfoSection index="02" title={c.sections.forms}>
        <div className="grid gap-4 md:grid-cols-2">
          {c.forms.map((form) => {
            const Icon = form.icon;
            return (
              <div
                className="border-line flex flex-col rounded-[20px] border p-5"
                key={form.title}
              >
                <Icon
                  aria-hidden="true"
                  className="text-gold"
                  size={20}
                  strokeWidth={1.7}
                />
                <h3 className="mt-3 text-[1.125rem] leading-[1.5rem] font-bold tracking-[-0.02em]">
                  {form.title}
                </h3>
                <p className="text-muted mt-1.5 text-[0.875rem] leading-[1.3125rem]">
                  {form.body}
                </p>
              </div>
            );
          })}
        </div>
      </InfoSection>

      <InfoSection index="03" title={c.sections.current}>
        <ul className="flex flex-col">
          {c.partners.map((partner) => (
            <li
              className="border-line flex flex-col gap-0.5 border-b py-3.5 md:flex-row md:items-baseline md:justify-between md:gap-6"
              key={partner.name}
            >
              <span className="text-[1rem] leading-[1.375rem] font-bold tracking-[-0.015em]">
                {partner.name}
              </span>
              <span className="text-muted text-[0.75rem] leading-[1rem] tracking-[0.06em] uppercase">
                {partner.role}
              </span>
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection index="04" title={c.sections.rent}>
        <Prose>
          {c.rent.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.rentFacts]} />
        </div>
        <InfoNote>{c.rentNote}</InfoNote>
        <InfoActions
          items={[
            {
              href: "mailto:wynajmy@filharmonia.szczecin.pl",
              label: c.actions.rent,
              external: true,
            },
            { href: "/calendar", label: c.actions.programme },
          ]}
        />
      </InfoSection>

      <InfoSection index="05" title={c.sections.contact}>
        <ul className="flex flex-col">
          {c.contact.map((line) => (
            <li
              className="border-line text-[0.9375rem] leading-[1.4375rem] border-b py-3.5"
              key={line}
            >
              {line}
            </li>
          ))}
        </ul>
        <InfoActions
          items={[
            {
              href: "mailto:j.gibowski@filharmonia.szczecin.pl",
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
          { href: "/visit", label: c.footerLinks[1] },
          { href: "/media", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
