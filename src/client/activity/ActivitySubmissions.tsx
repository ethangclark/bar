import { Fragment } from "react";
import { LinkStyle } from "../components/Link";
import { LoadingCentered } from "../components/Loading";
import { LogoutButton } from "../components/LogoutButton";
import { Status } from "../utils/status";
import { storeObserver } from "../utils/storeObserver";

export const ActivitySubmissions = storeObserver(function ActivitySubmissions({
  viewModeStore,
  submissionStore,
  descendentStore,
  userStore,
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
      <div className="flex justify-between">
        <LinkStyle onClick={() => viewModeStore.setViewMode("editor")}>
          ← Back to design
        </LinkStyle>
        <LogoutButton />
      </div>
      <div className="mb-4 text-3xl">Submissions</div>
      <div className="grid grid-cols-5 gap-x-4">
        <div>Email</div>
        <div>Items complete</div>
        <div>Questions complete</div>
        <div>Flags</div>
        <div>View</div>
        {submissions.length === 0 && <div>(No submissions yet)</div>}
        {submissions.map((submission) => {
          const activityId = submission.completions[0]?.activityId ?? null;
          const flagCount = submission.flags.filter(
            (flag) => !flag.unflagged,
          ).length;
          return (
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
              <div className={flagCount > 0 ? "text-red-500" : ""}>
                {flagCount}
              </div>
              <div>
                <LinkStyle
                  disabled={activityId === null}
                  onClick={() => {
                    userStore.impersonateUser(submission.user);
                    viewModeStore.setViewMode("doer");
                  }}
                >
                  View
                </LinkStyle>
              </div>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
});
