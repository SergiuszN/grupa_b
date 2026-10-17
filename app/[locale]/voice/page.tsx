import { getTranslations, setRequestLocale } from "next-intl/server";
import { Screen } from "@/components/flow/screen";
import { VoiceAssistant } from "@/components/voice/voice-assistant";

export default async function Voice({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Voice");

  return (
    <Screen>
      <VoiceAssistant
        labels={{
          hi: t("hi"),
          title: t("title"),
          subtitle: t("subtitle"),
          suggestions: [t("suggestion1"), t("suggestion2"), t("suggestion3")],
          status: {
            idle: t("talk"),
            listening: t("listening"),
            processing: t("thinking"),
            speaking: t("speaking"),
          },
          activity: {
            transcribing: t("transcribing"),
            searching: t("searching"),
            reading: t("reading"),
            showing: t("showing"),
            answering: t("thinking"),
          },
          errors: {
            mic: t("errorMic"),
            unsupported: t("errorUnsupported"),
            nothing_heard: t("errorNothingHeard"),
            unavailable: t("errorUnavailable"),
            failed: t("errorFailed"),
          },
          placeholder: t("placeholder"),
          send: t("send"),
          reset: t("reset"),
          tickets: t("tickets"),
          details: t("details"),
          free: t("free"),
          soldOut: t("soldOut"),
          you: t("you"),
          guide: t("guide"),
        }}
        locale={locale}
      />
    </Screen>
  );
}
