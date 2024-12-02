"use client";

import { ClientOnly } from "./_components/ClientOnly";
import { Page } from "./_components/Page";
import { Title } from "./_components/Title";
import { Main } from "./_main/Main";

export default function Home() {
  return (
    <Page>
      <Title>Baramu</Title>
      <ClientOnly>
        <Main />
      </ClientOnly>
    </Page>
  );
}
