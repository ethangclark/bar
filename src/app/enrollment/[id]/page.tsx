"use client";
import { Tree as AntdTree, Button, Modal, Spin } from "antd";
import { z } from "zod";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { Page } from "~/app/_components/Page";
import { api } from "~/trpc/react";
import { Topic } from "./topic";
import { useCourseTreeData } from "./useCourseTreeData";
import { useTreeProps } from "./useTreeProps";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Logo, LogoText } from "~/app/_components/Logo";
import { Slideout } from "./slideout";
import { MenuOutlined } from "@ant-design/icons";
import Link from "next/link";

type Props = {
  params: {
    id: string;
  };
};

export default function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);

  const {
    isLoading,
    data: enrollment,
    refetch,
  } = api.courses.enrollment.useQuery({
    enrollmentId,
  });
  const tutoringSessions = enrollment?.tutoringSessions;

  const {
    treeData,
    selectedTopicId,
    setSelectedTopicId,
    selectedTopicContext,
    selectNextTopic,
  } = useCourseTreeData({
    course: enrollment?.course ?? null,
    tutoringSessions: tutoringSessions ?? [],
    isLoading,
  });

  const treeProps = useTreeProps({
    treeData,
    selectedId: selectedTopicId,
    setSelectedId: setSelectedTopicId,
    courseId: enrollment?.course.id ?? null,
  });

  const topicTutoringSessions = useMemo(
    () =>
      (tutoringSessions ?? []).filter(
        (s) => s.topicId === selectedTopicContext?.topic.id,
      ),
    [selectedTopicContext?.topic.id, tutoringSessions],
  );

  const refetchTutoringSessions = useCallback(async () => {
    const r = await refetch();
    if (!r.data) {
      throw new Error("Failed to refetch sessions");
    }
    return r.data.tutoringSessions;
  }, [refetch]);

  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const newUserModalShownRef = useRef(false);
  useEffect(() => {
    if (tutoringSessions && tutoringSessions.length === 0) {
      newUserModalShownRef.current = true;
      setNewUserModalOpen(true);
    }
  }, [tutoringSessions]);

  const PanelContent = useCallback(
    ({ width }: { width?: number }) => (
      <div style={{ marginBottom: -20, width }}>
        <div className="mb-2 flex justify-between">
          <div className="mb-2 flex items-center">
            <Logo height={20} />
            <LogoText className="text-2xl" />
          </div>
          <Link href={"/api/auth/signout"}>
            <Button>{"Sign out"}</Button>
          </Link>
        </div>
        <AntdTree {...treeProps} height={700} />
      </div>
    ),
    [treeProps],
  );

  if (isLoading) {
    return <Spin />;
  }

  return (
    <Page>
      <ClientOnly>
        <Modal
          title="Welcome"
          onCancel={() => setNewUserModalOpen(false)}
          onOk={() => setNewUserModalOpen(false)}
          open={newUserModalOpen}
        >
          <div className="flex flex-col gap-2">
            <p>
              Summit is a chat-based tutor that will guide you through an
              extensive course of bar exam preparation study.
            </p>
            <p>
              If you prefer speaking over typing, tap the microphone to start
              and stop dictating a message.
            </p>
            <p>
              Skip ahead or go back to any topic you like using the navigation
              menu.
            </p>
            <p>
              If you have any questions, comments, or issues, reach out to us at
              hello@summited.ai.
            </p>
            <p>Happy studying, and good luck on the exam!</p>
          </div>
        </Modal>
        <div className="flex flex-grow flex-col flex-wrap justify-start sm:flex-row">
          <div className="mr-6 hidden xl:block">
            {<PanelContent width={400} />}
          </div>
          <div className="flex flex-grow justify-center">
            {selectedTopicContext && (
              <Topic
                key={selectedTopicContext.topic.id}
                enrollmentId={enrollmentId}
                topicContext={selectedTopicContext}
                topicTutoringSessions={topicTutoringSessions}
                refetchTutoringSessions={refetchTutoringSessions}
                onTopicComplete={selectNextTopic}
                topLeftCorner={
                  <div className="xl:hidden">
                    <Slideout
                      trigger={<MenuOutlined className="mr-4 text-2xl" />}
                    >
                      {/* can't specify width prompt -- gotta let it do its own width styling in mobile mode */}
                      {/* (this is hidden in desktop mode) */}
                      <PanelContent />
                    </Slideout>
                  </div>
                }
              />
            )}
          </div>
          <div className="hidden xl:block" style={{ width: 120 }} />
        </div>
      </ClientOnly>
    </Page>
  );
}
