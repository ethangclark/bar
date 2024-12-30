"use client";
import { ContactFooter } from "~/client/components/ContactLink";
import { Page } from "~/client/components/Page";
import { Title } from "~/client/components/Title";

export default function Contact() {
  return (
    <Page>
      <Title>Contact</Title>
      <ContactFooter />
    </Page>
  );
}
