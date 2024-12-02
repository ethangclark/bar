"use client";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { Title } from "~/app/_components/Title";

type Props = {
  params: {
    courseEnrollmentUuid: string;
  };
};

export default function CoursePage({ params }: Props) {
  const courseEnrollmentUuid = z.string().parse(params.courseEnrollmentUuid);

  return (
    <Page>
      <Title>Course enrollment: {courseEnrollmentUuid}</Title>
      <ClientOnly>
        <div>Yo</div>
      </ClientOnly>
    </Page>
  );
}
