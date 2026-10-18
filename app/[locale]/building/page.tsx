import { setRequestLocale } from "next-intl/server";
import type { Locale } from "@/i18n/config";
import {
  InfoActions,
  InfoCard,
  InfoFooter,
  InfoFacts,
  InfoHero,
  InfoList,
  InfoScreen,
  InfoSection,
  Prose,
} from "@/components/info/page";

const C = {
  pl: {
    eyebrow: "Budynek",
    title: "Lodowy pałac przy Małopolskiej.",
    lead: "Biała bryła, która w dzień odcina się od miasta, a wieczorem zmienia kolor. W środku — dwie sale i akustyka klasy Musikverein.",
    sections: {
      architecture: "Architektura",
      halls: "Sale",
      awards: "Nagrody",
      light: "Iluminacja",
      piano: "Fortepian",
    },
    architecture: [
      "Siedzibę zaprojektowało studio Barozzi/Veiga z Barcelony, wybrane spośród 44 pracowni w konkursie z 2007 roku. Budynek stoi w miejscu przedwojennego Konzerthausu, u zbiegu Małopolskiej i Matejki.",
      "Ponad 12 000 m² na czterech kondygnacjach: dwie sale, sale prób, sklep muzyczny, kawiarnie, foyer, garderoby artystów i biura. Inauguracja odbyła się wraz z początkiem sezonu 2014/2015.",
      "Ostry, szklany kształt od pierwszych szkiców nazwano „Lodowym Pałacem”. Bryła kontrastuje z neogotycką zabudową, ale nie zamyka się przed nią — wchodzi z nią w dialog.",
    ],
    facts: [
      { value: "2014", label: "Otwarcie" },
      { value: "12 000", label: "Metrów kwadratowych" },
      { value: "4", label: "Kondygnacje" },
      { value: "44", label: "Projekty w konkursie" },
    ],
    halls: [
      "Sala symfoniczna, zwana Słoneczną, ma 953 miejsca — do sprzedaży trafia 829. Scena ma 17,4 × 10,6 m. Akustykę projektował dr Higini Arau z Barcelony; parametry sali porównuje się z wiedeńskim Musikverein.",
      "Sala kameralna mieści 192 osoby, a scena ma 11,7 × 6,5 m. Czas pogłosu zgadza się z projektem co do setnej sekundy — stąd „akustyczna perełka”.",
    ],
    hallsFacts: [
      { value: "953", label: "Miejsc symfoniczna" },
      { value: "192", label: "Miejsc kameralna" },
      { value: "17,4 m", label: "Scena symfoniczna" },
      { value: "11,7 m", label: "Scena kameralna" },
    ],
    awards: [
      "Mies van der Rohe Award 2015 — nagroda architektoniczna Unii Europejskiej.",
      "Designs of the Year 2015 — London Design Museum.",
      "Grand Prix Nagrody Prezydenta RP w konkursie „Życie w Architekturze”.",
      "Eurobuild Awards 2014 — Architectural Design of the Year.",
      "4. miejsce w plebiscycie „7 cudów Polski” National Geographic Traveler.",
    ],
    light: [
      "Biała fasada może świecić w setkach kolorów i układów. Iluminacja zmienia się wraz z kalendarzem wydarzeń i porą roku.",
      "Wieczorem budynek jest widoczny z drugiego brzegu Odry — to jeden z najbardziej rozpoznawalnych punktów miasta.",
    ],
    lightAction: "Zobacz iluminacje",
    piano: [
      "W Galerii Poziom 4. stoi fortepian Bechstein z 1865 roku, który przed wojną grał w szczecińskim Konzerthausie. Po remoncie wrócił do miasta w 2026 roku.",
      "Instrument jest prezentowany gościom koncertów symfonicznych — to fizyczny pomost między przedwojennym Szczecinem a dzisiejszą Filharmonią.",
    ],
    actions: {
      tours: "Zwiedzanie",
      history: "Historia",
      visit: "Planuj wizytę",
    },
    footerTitle: "Zobacz go wieczorem.",
    footerBody:
      "Fasada świeci po zmroku. W środku czekają dwie sale i widok z czwartego piętra.",
    footerLinks: ["Zwiedzanie", "Historia", "Repertuar"],
  },
  en: {
    eyebrow: "The building",
    title: "An ice palace on Małopolska.",
    lead: "A white volume that stands out by day and changes colour at night. Inside — two halls and acoustics in the Musikverein class.",
    sections: {
      architecture: "Architecture",
      halls: "Halls",
      awards: "Awards",
      light: "Illumination",
      piano: "The piano",
    },
    architecture: [
      "The building was designed by Barozzi/Veiga of Barcelona, chosen from 44 studios in a 2007 competition. It stands on the site of the pre-war Konzerthaus, at the corner of Małopolska and Matejki.",
      "Over 12,000 m² across four storeys: two halls, rehearsal rooms, a music shop, cafés, the foyer, artists' dressing rooms and offices. It opened with the 2014/2015 season.",
      "The sharp glass form was called the “Ice Palace” from the first sketches. It contrasts with the neo-Gothic surroundings without turning away from them.",
    ],
    facts: [
      { value: "2014", label: "Opened" },
      { value: "12,000", label: "Square metres" },
      { value: "4", label: "Storeys" },
      { value: "44", label: "Competition entries" },
    ],
    halls: [
      "The symphonic hall, known as the Sun Hall, seats 953, with 829 on sale. The stage measures 17.4 × 10.6 m. Acoustics were designed by Dr Higini Arau of Barcelona; the hall is compared to Vienna's Musikverein.",
      "The chamber hall seats 192, with an 11.7 × 6.5 m stage. Its reverberation time matches the design to a hundredth of a second — hence the “acoustic gem”.",
    ],
    hallsFacts: [
      { value: "953", label: "Symphonic seats" },
      { value: "192", label: "Chamber seats" },
      { value: "17.4 m", label: "Symphonic stage" },
      { value: "11.7 m", label: "Chamber stage" },
    ],
    awards: [
      "Mies van der Rohe Award 2015 — the European Union architecture prize.",
      "Designs of the Year 2015 — London Design Museum.",
      "Grand Prix of the President of Poland in the “Life in Architecture” competition.",
      "Eurobuild Awards 2014 — Architectural Design of the Year.",
      "4th place in National Geographic Traveler's “7 Wonders of Poland”.",
    ],
    light: [
      "The white facade can glow in hundreds of colours and patterns. The illumination follows the event calendar and the season.",
      "At night the building is visible from the other bank of the Oder — one of the city's most recognisable landmarks.",
    ],
    lightAction: "See the illumination",
    piano: [
      "The Level 4 Gallery holds an 1865 Bechstein piano that played in Szczecin's Konzerthaus before the war. After restoration it returned to the city in 2026.",
      "The instrument is presented to symphonic concert guests — a physical bridge between pre-war Szczecin and today's Philharmonic.",
    ],
    actions: {
      tours: "Guided tours",
      history: "History",
      visit: "Plan your visit",
    },
    footerTitle: "See it after dark.",
    footerBody:
      "The facade glows after dusk. Inside await two halls and a view from the fourth floor.",
    footerLinks: ["Guided tours", "History", "Programme"],
  },
  de: {
    eyebrow: "Das Gebäude",
    title: "Ein Eispalast an der Małopolska.",
    lead: "Ein weißer Körper, der tagsüber auffällt und abends die Farbe wechselt. Innen zwei Säle und Akustik auf Musikverein-Niveau.",
    sections: {
      architecture: "Architektur",
      halls: "Säle",
      awards: "Auszeichnungen",
      light: "Illumination",
      piano: "Das Klavier",
    },
    architecture: [
      "Entworfen vom Büro Barozzi/Veiga aus Barcelona, ausgewählt aus 44 Studios im Wettbewerb 2007. Das Gebäude steht am Ort des Vorkriegs-Konzerthauses, an der Ecke Małopolska und Matejki.",
      "Über 12.000 m² auf vier Ebenen: zwei Säle, Proberäume, Musikgeschäft, Cafés, Foyer, Künstlergarderoben und Büros. Eröffnet mit der Saison 2014/2015.",
      "Die scharfe Glasform hieß schon in den ersten Entwürfen „Eispalast“. Sie kontrastiert mit der neugotischen Umgebung, ohne sich von ihr abzuwenden.",
    ],
    facts: [
      { value: "2014", label: "Eröffnet" },
      { value: "12.000", label: "Quadratmeter" },
      { value: "4", label: "Ebenen" },
      { value: "44", label: "Wettbewerbsentwürfe" },
    ],
    halls: [
      "Der Sinfoniesaal, der „Sonnensaal“, hat 953 Plätze, 829 davon im Verkauf. Die Bühne misst 17,4 × 10,6 m. Die Akustik entwarf Dr. Higini Arau aus Barcelona; der Saal wird mit dem Wiener Musikverein verglichen.",
      "Der Kammermusiksaal fasst 192 Personen, die Bühne misst 11,7 × 6,5 m. Die Nachhallzeit entspricht dem Entwurf auf eine Hundertstelsekunde — daher „akustisches Juwel“.",
    ],
    hallsFacts: [
      { value: "953", label: "Sinfoniesaal" },
      { value: "192", label: "Kammermusiksaal" },
      { value: "17,4 m", label: "Sinfonie-Bühne" },
      { value: "11,7 m", label: "Kammer-Bühne" },
    ],
    awards: [
      "Mies van der Rohe Award 2015 — der Architekturpreis der Europäischen Union.",
      "Designs of the Year 2015 — London Design Museum.",
      "Grand Prix des polnischen Präsidenten im Wettbewerb „Leben in der Architektur“.",
      "Eurobuild Awards 2014 — Architectural Design of the Year.",
      "4. Platz bei „7 Wunder Polens“ von National Geographic Traveler.",
    ],
    light: [
      "Die weiße Fassade kann in Hunderten Farben und Mustern leuchten. Die Illumination folgt dem Veranstaltungskalender und der Jahreszeit.",
      "Abends ist das Gebäude vom anderen Oderufer sichtbar — eines der bekanntesten Wahrzeichen der Stadt.",
    ],
    lightAction: "Illumination ansehen",
    piano: [
      "In der Galerie Ebene 4 steht ein Bechstein-Klavier von 1865, das vor dem Krieg im Szczeciner Konzerthaus gespielt wurde. Nach der Restaurierung kehrte es 2026 in die Stadt zurück.",
      "Das Instrument wird den Gästen der Sinfoniekonzerte präsentiert — eine physische Brücke zwischen dem Vorkriegs-Szczecin und der heutigen Philharmonie.",
    ],
    actions: {
      tours: "Führungen",
      history: "Geschichte",
      visit: "Besuch planen",
    },
    footerTitle: "Sehen Sie es nach Einbruch der Dunkelheit.",
    footerBody:
      "Die Fassade leuchtet nach der Dämmerung. Innen warten zwei Säle und der Blick aus der vierten Etage.",
    footerLinks: ["Führungen", "Geschichte", "Programm"],
  },
} as const;

export default async function BuildingPage({
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
        image="/photos/3-main.jpg"
        imageAlt="Budynek Filharmonii"
        lead={c.lead}
        title={c.title}
      />

      <InfoSection index="01" title={c.sections.architecture}>
        <Prose>
          {c.architecture.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <div className="mt-5">
          <InfoFacts items={[...c.facts]} />
        </div>
      </InfoSection>

      <InfoSection index="02" title={c.sections.halls}>
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
            { href: "/tours", label: c.actions.tours },
            { href: "/visit", label: c.actions.visit },
          ]}
        />
      </InfoSection>

      <InfoSection index="03" title={c.sections.awards}>
        <ul className="flex max-w-[620px] flex-col">
          {c.awards.map((award, index) => (
            <li
              className="border-line flex items-baseline gap-4 border-b py-3 text-[0.9375rem] leading-[1.3125rem]"
              key={award}
            >
              <span className="text-gold w-6 shrink-0 text-[0.6875rem] font-medium tracking-[0.12em]">
                {String(index + 1).padStart(2, "0")}
              </span>
              {award}
            </li>
          ))}
        </ul>
      </InfoSection>

      <InfoSection index="04" title={c.sections.light}>
        <Prose>
          {c.light.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoList>
          <InfoCard
            external
            href="https://filharmonia.szczecin.pl/the_building"
            image="/photos/illumination-2.jpg"
            meta="filharmonia.szczecin.pl"
            title={c.lightAction}
          />
        </InfoList>
      </InfoSection>

      <InfoSection index="05" title={c.sections.piano}>
        <Prose>
          {c.piano.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
        <InfoActions items={[{ href: "/history", label: c.actions.history }]} />
      </InfoSection>

      <InfoFooter
        body={c.footerBody}
        links={[
          { href: "/tours", label: c.footerLinks[0] },
          { href: "/history", label: c.footerLinks[1] },
          { href: "/calendar", label: c.footerLinks[2] },
        ]}
        title={c.footerTitle}
      />
    </InfoScreen>
  );
}
