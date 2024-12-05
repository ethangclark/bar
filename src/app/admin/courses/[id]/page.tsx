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

  const regenerateForTopic =
    api.understandingCriteria.regenerateForTopic.useMutation();
  console.log("mutation data:", regenerateForTopic.data);

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
            <div className="mb-5">(select a topic to make this pane work)</div>
            <div>selected topic:</div>
            <div className="mb-5 text-2xl">
              {selectedTopicContext?.topic.name}
            </div>
            <Button
              className="mb-5"
              disabled={!selectedTopicContext}
              onClick={() =>
                selectedTopicContext &&
                regenerateForTopic.mutate(selectedTopicContext)
              }
            >
              (Re)generate criteria
            </Button>
            <div>understanding criteria:</div>
            <div>(removed -- not a thing anymore)</div>
          </div>
        </div>
      </ClientOnly>
    </Page>
  );
}
