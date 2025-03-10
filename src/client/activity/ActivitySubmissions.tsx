import { Typography } from "antd";
import { Fragment } from "react";
import { LoadingCentered } from "../components/Loading";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const ActivitySubmissions = storeObserver(function ActivitySubmissions({
  viewModeStore,
  submissionStore,
  descendentStore,
}) {
  const { submissions } = submissionStore;
  const items = descendentStore.get("items");
  const questions = descendentStore.get("questions");
  if (
    submissions instanceof Status ||
    items instanceof Status ||
    questions instanceof Status
  ) {
    return <LoadingCentered />;
  }

  const questionItemIds = new Set(questions.map((question) => question.itemId));

  return (
    <div>
      <div className="">
        <Typography.Link onClick={() => viewModeStore.setViewMode("editor")}>
          ← Back to design
        </Typography.Link>
      </div>
      <div className="mb-4 text-3xl">Submissions</div>
      <div className="grid grid-cols-3 gap-x-4">
        <div>Email</div>
        <div>Items complete</div>
        <div>Questions complete</div>
        {submissions.map((submission) => (
          <Fragment key={submission.user.id}>
            <div>{submission.user.email ?? "<no email on record>"}</div>
            <div>
              {submission.completions.length} / {items.length}
            </div>
            <div>
              {
                submission.completions.filter((completion) =>
                  questionItemIds.has(completion.itemId),
                ).length
              }{" "}
              / {questionItemIds.size}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
});
