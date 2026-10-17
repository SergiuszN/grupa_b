import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import styles from "../page.module.css";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("HomePage");

  return (
    <div className={styles.page}>
      <header className="w-full max-w-5xl flex justify-between items-center py-4">
        <div className="font-semibold text-lg tracking-tight">WUD Szczecin</div>
        <LanguageSwitcher />
      </header>

      <main className={styles.main}>
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-gray-500 text-lg">{t("subtitle")}</p>
        </div>

        <ol>
          <li>
            {t("editPrompt")} <code>app/[locale]/page.tsx</code>
          </li>
          <li>{t("savePrompt")}</li>
        </ol>

        <div className={styles.ctas}>
          <a
            className={styles.primary}
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className={styles.logo}
              src="/vercel.svg"
              alt="Vercel logomark"
              width={20}
              height={20}
            />
            {t("deployNow")}
          </a>
          <a
            href="https://next-intl.dev"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.secondary}
          >
            {t("readDocs")}
          </a>
        </div>
        <Button appName="web" className={styles.secondary}>
          {t("openAlert")}
        </Button>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://next-intl.dev"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          {t("examples")}
        </a>
      </footer>
    </div>
  );
}
