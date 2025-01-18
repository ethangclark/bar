"use client";

import { Typography } from "antd";
import React from "react";
import { formatDateTime } from "~/common/utils/timeUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { type NarrowedCanvasEnrollmentType } from "~/server/integrations/canvas/utils";
import {
  type LmsAssignment,
  type LmsCourse,
} from "~/server/integrations/utils/integrationApi";

const StatusWrapper = ({ children }: { children: React.ReactNode }) => (
  <span className={`rounded border-2 p-1 font-bold`}>{children}</span>
);

function StatusDisplay({
  status,
  enrolledAs,
  dueAt,
  lockedAt,
}: {
  status: ActivityStatus;
  enrolledAs: NarrowedCanvasEnrollmentType[];
  dueAt: Date | null;
  lockedAt: Date | null;
}): React.ReactNode {
  switch (status) {
    case "draft":
      if (enrolledAs.includes("teacher") || enrolledAs.includes("designer")) {
        return (
          <StatusWrapper>
            <span className="text-gray-500">Draft</span>
          </StatusWrapper>
        );
      }
      return <StatusWrapper>No activity assigned</StatusWrapper>;
    case "published":
      if (enrolledAs.includes("teacher") || enrolledAs.includes("designer")) {
        return (
          <StatusWrapper>
            <span className="text-green-500">Published</span>
          </StatusWrapper>
        );
      }
      return (
        <StatusWrapper>
          {((): string => {
            const now = new Date();
            if (!dueAt || now < dueAt) {
              return "Open";
            }
            if (lockedAt && now < lockedAt) {
              return "Late";
            }
            return "Closed";
          })()}
        </StatusWrapper>
      );
  }
}

export function Assignment({
  assignment,
  course,
}: {
  assignment: LmsAssignment;
  course: LmsCourse;
}) {
  const { enrolledAs } = course;
  const { status } = assignment.activity;
  if (!(enrolledAs.includes("teacher") || enrolledAs.includes("designer"))) {
    if (status === "draft") {
      return null;
    }
  }
  return (
    <div className="mb-4">
      <div className="mb-1 flex items-center">
        <div className="mr-2">
          <StatusDisplay
            status={assignment.activity.status}
            enrolledAs={course.enrolledAs}
            dueAt={assignment.dueAt}
            lockedAt={assignment.lockedAt}
          />
        </div>
        <Typography.Link
          className="text-2xl"
          href={`/activity/${assignment.activity.id}`}
        >
          {assignment.title}
        </Typography.Link>
      </div>
      <div className="ml-1 text-sm">
        {assignment.dueAt ? (
          <div>
            Due date:{" "}
            <span className="font-bold">
              {formatDateTime(assignment.dueAt)}
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
