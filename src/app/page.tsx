"use client";

import { ClientOnly } from "./_components/ClientOnly";
import { Page } from "./_components/Page";
import { Main } from "./_main/Main";
import { Logo, LogoText } from "./_components/Logo";

export default function Home() {
  const h = 50;
  return (
    <Page logo={true}>
      <div className="mb-24 mt-32 flex items-center">
        <Logo height={h} />
        <LogoText className="text-6xl" />
      </div>
      <ClientOnly>
        <Main />
      </ClientOnly>
    </Page>
  );
}
