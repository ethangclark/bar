"use client";
import { Tree as AntdTree, Spin } from "antd";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { api } from "~/trpc/react";
import { Topic } from "./topic";
import { useCourseTreeData } from "./useCourseTreeData";
import { useTreeProps } from "./useTreeProps";
import { useCallback, useMemo } from "react";

type Props = {
  params: {
    id: string;
  };
};

export default function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);

  const { isLoading: isEnrollmentLoading, data: enrollment } =
    api.course.enrollment.useQuery({ enrollmentId });
  const {
    refetch: refetchSessions,
    isLoading: areSessionsLoading,
    data: tutoringSessions,
  } = api.tutoringSession.enrollmentTutoringSessions.useQuery({
    enrollmentId,
  });

  const isLoading = isEnrollmentLoading || areSessionsLoading;

  const { treeData, setSelectedTopicId, selectedTopicContext } =
    useCourseTreeData({
      course: enrollment?.course ?? null,
      tutoringSessions: tutoringSessions ?? [],
      isLoading,
    });

  const treeProps = useTreeProps({
    treeData,
    setSelectedId: setSelectedTopicId,
  });

  const topicTutoringSessions = useMemo(
    () =>
      (tutoringSessions ?? []).filter(
        (s) => s.topicId === selectedTopicContext?.topic.id,
      ),
    [selectedTopicContext?.topic.id, tutoringSessions],
  );

  const noOptionRefetchSessions = useCallback(async () => {
    await refetchSessions();
  }, [refetchSessions]);

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
              <Topic
                key={selectedTopicContext.topic.id}
                enrollmentId={enrollmentId}
                topicContext={selectedTopicContext}
                topicTutoringSessions={topicTutoringSessions}
                refetchTutoringSessions={noOptionRefetchSessions}
              />
            )}
          </div>
        </div>
      </ClientOnly>
    </Page>
  );
}
