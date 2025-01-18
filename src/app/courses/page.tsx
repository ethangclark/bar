"use client";

import { formatDateTime } from "~/common/utils/timeUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { type NarrowedCanvasEnrollmentType } from "~/server/integrations/canvas/utils";
import { api } from "~/trpc/react";

function getStatusTextClassName(status: ActivityStatus): string {
  switch (status) {
    case "draft":
      return "text-gray-500";
    case "published":
      return "text-green-500";
  }
}

function getStatusTextDisplay(
  status: ActivityStatus,
  enrolledAs: NarrowedCanvasEnrollmentType[],
): string {
  switch (status) {
    case "draft":
      if (enrolledAs.includes("teacher") || enrolledAs.includes("designer")) {
        return "Draft";
      }
      return "None assigned";
    case "published":
      return "Published";
  }
}

export default function Courses() {
  const { data: courses } = api.courses.all.useQuery();
  console.log({ courses });
  return (
    <div>
      <div className="mb-4 text-6xl">Courses</div>
      <div>
        {courses?.map((c, idx) => (
          <div key={idx}>
            <div className="mb-4 text-4xl">{c.title}</div>
            <div>
              {c.assignments.map((a, idx): React.ReactNode => {
                return (
                  <div key={idx} className="border-y pb-4 pt-2">
                    <div className="mb-2">
                      <div className="text-2xl">{a.title}</div>
                      {a.dueAt && (
                        <div className="text-sm text-gray-500">
                          Due {formatDateTime(a.dueAt)}
                        </div>
                      )}
                    </div>
                    <div>
                      Activity status:{" "}
                      <span
                        className={`rounded border-2 p-1 font-bold ${getStatusTextClassName(a.activity.status)}`}
                      >
                        {getStatusTextDisplay(a.activity.status, c.enrolledAs)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
