"use client";
import { Spin, Tree } from "antd";
import { z } from "zod";
import { useCourseTreeData } from "~/client/topicLesson/useCourseTreeData";
import { useTreeProps } from "~/client/topicLesson/useTreeProps";
import { api } from "~/trpc/react";
import { ClientOnly } from "~/client/components/ClientOnly";
import { Page } from "~/client/components/Page";
import { Title } from "~/client/components/Title";

type Props = {
  params: {
    id: string;
  };
};

export default function AdminCoursePage({ params }: Props) {
  const courseId = z.string().parse(params.id);

  const { isLoading, data: course } = api.courses.courseDetail.useQuery({
    courseId,
  });

  const {
    treeData,
    setSelectedTopicId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedTopicContext: _,
  } = useCourseTreeData({
    course: course ?? null,
    tutoringSessions: [],
    isLoading,
  });

  const treeProps = useTreeProps({
    treeData,
    selectedId: null,
    setSelectedId: setSelectedTopicId,
    courseId,
  });

  if (isLoading) {
    return <Spin />;
  }
  return (
    <Page>
      <Title>Admin - course</Title>
      <ClientOnly>
        <div className="flex">
          <div className="mr-8">
            <Tree {...treeProps} />
          </div>
          <div className="border p-10"></div>
        </div>
      </ClientOnly>
    </Page>
  );
}
