import type { ReactNode } from "react";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { SiteHeader } from "@/components/landing/site-header";
import { BlurImage } from "@/components/ui/blur-image";

export function InfoScreen({ children }: { children: ReactNode }) {
  return (
    <main className="bg-paper text-ink flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col">
        <SiteHeader tone="light" />
        {children}
      </div>
    </main>
  );
}

export function InfoHero({
  eyebrow,
  title,
  lead,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <header className="px-6 pt-8 pb-4 md:pt-14 md:pb-8">
      <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.16em] uppercase">
        {eyebrow}
      </p>
      <h1 className="mt-3 max-w-[760px] text-[36px] leading-[40px] font-bold tracking-[-0.035em] md:text-[56px] md:leading-[60px]">
        {title}
      </h1>
      {lead ? (
        <p className="text-muted mt-4 max-w-[620px] text-[16px] leading-[24px] md:text-[17px] md:leading-[26px]">
          {lead}
        </p>
      ) : null}
      {image ? (
        <BlurImage
          alt={imageAlt ?? ""}
          className="mt-7 h-[220px] rounded-[24px] md:mt-10 md:h-[380px]"
          priority
          src={image}
        />
      ) : null}
    </header>
  );
}

export function InfoSection({
  index,
  title,
  id,
  children,
}: {
  index: string;
  title: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section className="border-line mx-6 border-t py-8 md:py-11" id={id}>
      <div className="md:grid md:grid-cols-[240px_1fr] md:gap-12">
        <div className="md:sticky md:top-8 md:self-start">
          <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.16em]">
            {index}
          </p>
          <h2 className="mt-1.5 text-[22px] leading-[28px] font-bold tracking-[-0.025em] md:text-[24px] md:leading-[30px]">
            {title}
          </h2>
        </div>
        <div className="mt-4 md:mt-0">{children}</div>
      </div>
    </section>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="flex max-w-[640px] flex-col gap-3 text-[15px] leading-[23px] md:text-[16px] md:leading-[25px]">
      {children}
    </div>
  );
}

export function InfoFacts({
  items,
}: {
  items: { value: string; label: string }[];
}) {
  return (
    <dl className="border-line bg-line grid grid-cols-2 gap-px overflow-clip rounded-2xl border md:grid-cols-4">
      {items.map((item) => (
        <div className="bg-paper px-4 py-4" key={item.label}>
          <dt className="text-muted text-[10px] leading-[13px] font-medium tracking-[0.14em] uppercase">
            {item.label}
          </dt>
          <dd className="mt-1.5 text-[19px] leading-[24px] font-bold tracking-[-0.02em]">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function InfoCard({
  href,
  image,
  title,
  meta,
  note,
  external = false,
  icon,
}: {
  href: string;
  image?: string | null;
  title: string;
  meta?: string | null;
  note?: string | null;
  external?: boolean;
  icon?: ReactNode;
}) {
  const body = (
    <>
      {image ? (
        <BlurImage
          alt=""
          className="h-[76px] w-[96px] shrink-0 rounded-xl"
          src={image}
        />
      ) : icon ? (
        <div className="border-line text-gold flex size-[44px] shrink-0 items-center justify-center rounded-full border">
          {icon}
        </div>
      ) : null}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-[16px] leading-[21px] font-bold tracking-[-0.015em]">
          {title}
        </p>
        {meta ? (
          <p className="text-muted text-[13px] leading-[18px]">{meta}</p>
        ) : null}
        {note ? (
          <p className="text-muted mt-0.5 text-[13px] leading-[18px]">{note}</p>
        ) : null}
      </div>
      {external ? (
        <ArrowUpRight
          aria-hidden="true"
          className="text-muted mt-1 shrink-0"
          size={17}
          strokeWidth={1.7}
        />
      ) : (
        <ArrowRight
          aria-hidden="true"
          className="text-muted mt-1 shrink-0"
          size={17}
          strokeWidth={1.7}
        />
      )}
    </>
  );

  const className =
    "border-line hover:bg-surface focus-visible:outline-gold flex items-start gap-4 border-b py-4 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2";

  if (external) {
    return (
      <a className={className} href={href} rel="noreferrer" target="_blank">
        {body}
      </a>
    );
  }

  return (
    <Link className={className} href={href}>
      {body}
    </Link>
  );
}

export function InfoList({ children }: { children: ReactNode }) {
  return <div className="flex flex-col">{children}</div>;
}

export function InfoNote({ children }: { children: ReactNode }) {
  return (
    <p className="border-line text-muted mt-5 border-l-2 pl-4 text-[13px] leading-[19px]">
      {children}
    </p>
  );
}

export function InfoActions({
  items,
}: {
  items: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div className="mt-6 flex flex-wrap gap-2.5">
      {items.map((item, index) =>
        item.external ? (
          <a
            className={`focus-visible:outline-ink inline-flex h-12 items-center gap-2 rounded-full px-5 text-[14px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${
              index === 0
                ? "bg-gold hover:bg-gold-deep text-white"
                : "border-ink text-ink hover:bg-surface border-[1.5px]"
            }`}
            href={item.href}
            key={item.label}
            rel="noreferrer"
            target="_blank"
          >
            {item.label}
            <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </a>
        ) : (
          <Link
            className={`focus-visible:outline-ink inline-flex h-12 items-center gap-2 rounded-full px-5 text-[14px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 ${
              index === 0
                ? "bg-gold hover:bg-gold-deep text-white"
                : "border-ink text-ink hover:bg-surface border-[1.5px]"
            }`}
            href={item.href}
            key={item.label}
          >
            {item.label}
            <ArrowRight aria-hidden="true" size={16} strokeWidth={1.8} />
          </Link>
        ),
      )}
    </div>
  );
}

export function InfoFooter({
  title,
  body,
  links,
}: {
  title: string;
  body: string;
  links: { href: string; label: string }[];
}) {
  return (
    <footer className="bg-ink text-paper mx-6 mt-4 mb-6 rounded-[24px] px-6 py-8 md:px-10 md:py-10">
      <p className="text-gold text-[11px] leading-[14px] font-medium tracking-[0.16em]">
        FILHARMONIA SZCZECIN
      </p>
      <p className="mt-2 max-w-[520px] text-[22px] leading-[28px] font-bold tracking-[-0.03em] md:text-[28px] md:leading-[34px]">
        {title}
      </p>
      <p className="text-paper/70 mt-2 max-w-[460px] text-[14px] leading-[21px]">
        {body}
      </p>
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">
        {links.map((link) => {
          const className =
            "text-paper/85 hover:text-paper focus-visible:outline-paper text-[14px] font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4";

          const external =
            link.href.startsWith("http") || link.href.startsWith("mailto:");

          return external ? (
            <a
              className={className}
              href={link.href}
              key={link.href}
              rel="noreferrer"
            >
              {link.label}
            </a>
          ) : (
            <Link className={className} href={link.href} key={link.href}>
              {link.label}
            </Link>
          );
        })}
      </div>
      <p className="text-paper/50 mt-6 text-[12px] leading-4">
        ul. Małopolska 48, 70-515 Szczecin · kasa@filharmonia.szczecin.pl · +48
        91 431 07 20
      </p>
    </footer>
  );
}
