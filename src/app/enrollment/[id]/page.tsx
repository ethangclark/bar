"use client";
import { MenuOutlined } from "@ant-design/icons";
import { Tree as AntdTree, Button, Modal, Spin } from "antd";
import { observer } from "mobx-react-lite";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";
import { ClientOnly } from "~/client/components/ClientOnly";
import { Logo, LogoText } from "~/client/components/Logo";
import { Page } from "~/client/components/Page";
import { Slideout } from "~/client/topicLesson/slideout";
import { focusedEnrollmentStore } from "~/client/topicLesson/stores/focusedEnrollmentStore";
import { selectedTopicStore } from "~/client/topicLesson/stores/selectedTopicStore";
import { TopicLesson } from "~/client/topicLesson/topicLesson";
import { Loading, Status } from "~/common/utils/status";

type Props = {
  params: {
    id: string;
  };
};

export default observer(function CoursePage({ params }: Props) {
  const enrollmentId = z.string().parse(params.id);

  useEffect(() => {
    void focusedEnrollmentStore.loadEnrollment(enrollmentId);
  }, [enrollmentId]);

  const { enrollment } = focusedEnrollmentStore;

  const { selectedTopicContext, treeProps } = selectedTopicStore;

  const [newUserModalOpen, setNewUserModalOpen] = useState(false);
  const newUserModalShownRef = useRef(false);
  useEffect(() => {
    if (
      !(enrollment instanceof Status) &&
      enrollment.tutoringSessions.length === 0
    ) {
      newUserModalShownRef.current = true;
      setNewUserModalOpen(true);
    }
  }, [enrollment]);

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

  if (enrollment instanceof Loading) {
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
              <TopicLesson
                key={selectedTopicContext.topic.id}
                topicContext={selectedTopicContext}
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
});
