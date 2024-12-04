"use client";
import { Tree as AntdTree, Spin } from "antd";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { api } from "~/trpc/react";
import { Topic } from "./topic";
import { useCourseTreeData } from "./useCourseTreeData";
import { useTreeProps } from "./useTreeProps";

type Props = {
  params: {
    id: string;
  };
};

export default function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);

  const enrollment = api.course.enrollment.useQuery({ enrollmentId });
  const activities = api.activity.enrollmentActivities.useQuery({
    enrollmentId,
  });

  const isLoading = enrollment.isLoading || activities.isLoading;

  const { treeData, setSelectedTopicId, selectedTopicContext } =
    useCourseTreeData({
      course: enrollment.data?.course ?? null,
      activities: activities.data ?? [],
      isLoading,
    });

  const treeProps = useTreeProps({
    treeData,
    setSelectedId: setSelectedTopicId,
  });

  if (isLoading) {
    return <Spin />;
  }

  return (
    <Page>
      <ClientOnly>
        <div className="flex flex-grow flex-wrap justify-start">
          <div style={{ width: 500 }} className="mb-10">
            <AntdTree {...treeProps} />
          </div>
          <div className="flex flex-grow justify-center">
            {selectedTopicContext && (
              <Topic topicContext={selectedTopicContext} />
            )}
          </div>
        </div>
      </ClientOnly>
    </Page>
  );
}
