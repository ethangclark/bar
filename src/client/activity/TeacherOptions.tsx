import { message, Tooltip, Typography } from "antd";
import { CircleHelp, Copy } from "lucide-react";
import { LinkStyle } from "../components/Link";
import { storeObserver } from "../utils/storeObserver";

function CopyableEmail({
  email,
  ifNoEmail,
  className,
}: {
  email: string | null;
  ifNoEmail: string;
  className?: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <Typography.Text
        className={`rounded border border-gray-300 px-1 font-bold ${className}`}
      >
        {email ?? ifNoEmail}
      </Typography.Text>
      {email && (
        <Tooltip title="Copy email">
          <LinkStyle
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(email);
                void message.success("Email copied to clipboard!");
              } catch (err) {
                void message.error("Failed to copy email");
              }
            }}
          >
            <Copy size={16} />
          </LinkStyle>
        </Tooltip>
      )}
    </div>
  );
}

export const TeacherOptions = storeObserver(function TeacherOptions({
  threadStore,
  viewModeStore,
  userStore,
}) {
  const { impersonating } = userStore;
  return (
    <div
      className={`flex items-center justify-center gap-4 rounded-lg border-2 border-dotted border-blue-500 px-4 py-1`}
    >
      {impersonating ? (
        <div className="flex items-center gap-6">
          <LinkStyle
            onClick={() => {
              userStore.stopImpersonating();
              viewModeStore.setViewMode("submissions");
            }}
          >
            Return to submissions
          </LinkStyle>
          <span className="flex flex-wrap items-center gap-1">
            <Typography.Text className="text-red-500">
              Viewing submission for
            </Typography.Text>
            <CopyableEmail
              className="text-red-500"
              email={impersonating.email}
              ifNoEmail={impersonating.name ?? "Anonymous"}
            />
          </span>
        </div>
      ) : (
        <>
          <LinkStyle onClick={() => viewModeStore.setViewMode("editor")}>
            Return to design
          </LinkStyle>
          <Tooltip
            title="These options only visible to teachers and developers."
            className="text-gray-500"
          >
            <CircleHelp size={16} />
          </Tooltip>
          <LinkStyle
            onClick={async () => {
              await Promise.all([
                threadStore.removeCompletions(),
                threadStore.createThread(),
              ]);
            }}
          >
            Reset + new chat
          </LinkStyle>
        </>
      )}
    </div>
  );
});
