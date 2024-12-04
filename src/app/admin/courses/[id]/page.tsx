"use client";
import { Button, Spin, Tree } from "antd";
import { z } from "zod";
import { useCourseTreeData } from "~/app/enrollment/[id]/useCourseTreeData";
import { useTreeProps } from "~/app/enrollment/[id]/useTreeProps";
import { api } from "~/trpc/react";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { Title } from "~/app/_components/Title";

type Props = {
  params: {
    id: string;
  };
};

export default function AdminCoursePage({ params }: Props) {
  const courseId = z.string().parse(params.id);

  const course = api.course.courseDetail.useQuery({ courseId });

  const isLoading = course.isLoading;

  const { treeData, setSelectedTopicId, selectedTopicContext } =
    useCourseTreeData({
      course: course.data ?? null,
      activities: [],
      isLoading,
    });

  const treeProps = useTreeProps({
    treeData,
    setSelectedId: setSelectedTopicId,
  });

  if (course.isLoading) {
    return <Spin />;
  }
  return (
    <Page>
      <Title>Admin - course</Title>
      <ClientOnly>
        <div className="flex">
          <Tree {...treeProps} />
          <div className="border p-10">
            <div>selected topic:</div>
            <div className="mb-5 text-2xl">
              {selectedTopicContext?.topic.name}
            </div>
            <Button className="mb-5">(Re)generate criteria</Button>
            <div>understanding criteria:</div>
            <div>
              {selectedTopicContext?.understandingCriteria.map((criterion) => {
                return (
                  <div key={criterion.id}>
                    <div className="text-xl">{criterion.name}</div>
                    <div>{criterion.description}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ClientOnly>
    </Page>
  );
}
