import { useMemo } from "react";
import { Assignment } from "~/client/components/Assignment";
import { api } from "~/trpc/react";
import { notLoaded } from "../utils/status";
import { ConnectIntegrationButtons } from "./ConnectIntegrationButtons";

export const courseActivitiesKey = "course-activities";

export function useCourseActivities() {
  const { data: courses, isLoading } = api.courses.all.useQuery();

  const item = useMemo(
    () =>
      isLoading
        ? notLoaded
        : !courses || courses.length === 0
          ? null
          : {
              key: courseActivitiesKey,
              label: "Course activities",
              children: (
                <>
                  {courses.length === 0 && (
                    <div className="mb-4 w-full text-center text-sm text-gray-500">
                      To create activities for course assignments, connect to
                      your LMS.
                    </div>
                  )}
                  {courses.map((c, idx) => (
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
                  <ConnectIntegrationButtons />
                </>
              ),
            },
    [courses, isLoading],
  );

  return { item, courses };
}
