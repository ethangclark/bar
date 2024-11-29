"use client";

import { BrowserSession } from "./_browserSession/BrowserSession";
import { ClientOnly } from "./_components/ClientOnly";
import { Page } from "./_components/Page";
import { Title } from "./_components/Title";

export default function Home() {
  return (
    <Page>
      <Title>QA Bot</Title>
      <ClientOnly>
        <BrowserSession />
      </ClientOnly>
    </Page>
  );
}
