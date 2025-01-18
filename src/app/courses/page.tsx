"use client";

import { Button } from "antd";
import { formatDateTime } from "~/common/utils/timeUtils";
import { api } from "~/trpc/react";

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
              {c.assignments.map((a, idx) => (
                <div key={idx} className="border-y pb-4 pt-2">
                  <div className="mb-2">
                    <div className="text-2xl">{a.title}</div>
                    {a.dueAt && (
                      <div className="text-sm text-gray-500">
                        Due {formatDateTime(a.dueAt)}
                      </div>
                    )}
                  </div>
                  {a.activity ? (
                    <div>View activity</div>
                  ) : (
                    <div>
                      <Button type="primary" size="small">
                        Create activity
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
