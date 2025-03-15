import { Button, Collapse, Form, Input, Modal } from "antd";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Assignment } from "~/client/components/Assignment";
import { LoadingPage } from "~/client/components/Loading";
import { LogoutButton } from "~/client/components/LogoutButton";
import { Page } from "~/client/components/Page";
import { assertTypesExhausted } from "~/common/assertions";
import { allIntegrationTypes, type RichActivity } from "~/common/types";
import { trpc } from "~/trpc/proxy";
import { api } from "~/trpc/react";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";
import { AdHocActivityItem } from "./AdHocActivityItem";
import { ConnectToCanvas } from "./ConnectToCanvas";

const yourActivities = "your-activities";

export const Overview = storeObserver(function Overview({
  activitesStore,
  userStore,
}) {
  const { data: courses, isLoading: isLoadingCourses } =
    api.courses.all.useQuery();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  useEffect(() => {
    void activitesStore.fetch();
  }, [activitesStore]);

  const { user } = userStore;

  const activities = activitesStore.data;

  const router = useRouter();

  const onCreate = useCallback(async () => {
    const { activity, adHocActivity, enrolledAs } =
      await trpc.activity.create.mutate({
        title,
      });
    const richActivity: RichActivity = {
      type: "adHoc" as const,
      ...activity,
      adHocActivity,
      enrolledAs,
    };
    activitesStore.setCache((activities) => {
      if (activities instanceof Status) {
        return activities;
      }
      return [...activities, richActivity];
    });
    router.push(`/activity/${activity.id}`);
    setTitle("");
    setCreating(false);
  }, [activitesStore, title, router]);

  console.log({
    isLoadingCourses,
    activities,
    user,
  });

  if (
    isLoadingCourses ||
    activities instanceof Status ||
    user instanceof Status
  ) {
    return <LoadingPage />;
  }

  return (
    <Page>
      <div style={{ minWidth: 500 }}>
        <div className="mb-8 flex w-full justify-end">
          <LogoutButton />
        </div>
        <Collapse
          accordion
          defaultActiveKey={
            activities?.length > 0 ? [yourActivities] : undefined
          }
          items={[
            {
              key: yourActivities,
              label: "Your activities",
              extra: (
                <Button
                  size="small"
                  disabled={creating}
                  onClick={() => {
                    setCreating(true);
                  }}
                >
                  Create activity
                </Button>
              ),
              children: (
                <div className="flex flex-col gap-2">
                  <Modal
                    title="Create activity"
                    open={creating}
                    onCancel={() => setCreating(false)}
                    onOk={onCreate}
                    okText="Create"
                    okButtonProps={{ disabled: title.length === 0 }}
                  >
                    <Form onFinish={onCreate}>
                      <Input
                        placeholder="Activity title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </Form>
                  </Modal>
                  {activities?.map((activity) => {
                    if (activity.type !== "adHoc") {
                      return null;
                    }
                    return (
                      <AdHocActivityItem
                        key={activity.id}
                        activity={activity}
                        adHocActivity={activity.adHocActivity}
                      />
                    );
                  })}
                </div>
              ),
            },
            {
              key: "course-activities",
              label: "Course activities",
              children: (
                <>
                  <div className="mb-4 text-sm text-gray-500">
                    To create activities for course assignments, connect to your
                    LMS.
                  </div>
                  {courses?.map((c, idx) => (
                    <div key={idx}>
                      <div className="mb-4 text-4xl">{c.title}</div>
                      <div>
                        {c.assignments.map((a, idx) => {
                          return (
                            <Assignment key={idx} assignment={a} course={c} />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex w-full justify-center gap-4">
                    {courses?.length === 0 &&
                      allIntegrationTypes.map((it) => {
                        switch (it) {
                          case "canvas":
                            return <ConnectToCanvas key={it} />;
                          default:
                            assertTypesExhausted(it);
                        }
                      })}
                  </div>
                </>
              ),
            },
          ]}
        />
      </div>
    </Page>
  );
});
