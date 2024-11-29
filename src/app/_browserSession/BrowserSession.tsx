import { Button, Input } from "antd";
import { useState } from "react";
import { api } from "~/trpc/react";
import { CommandExecution } from "./CommandExecution";

export function BrowserSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  const startSession = api.browserSession.start.useMutation({
    onSuccess: ({ id }) => {
      setSessionId(id);
    },
  });
  const endSession = api.browserSession.end.useMutation();
  const [url, setUrl] = useState("https://google.com");

  return (
    <div className="flex flex-col items-center">
      <Input
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        className="mb-4"
        disabled={startSession.isPending || !!sessionId}
      />
      <div className="mb-8">
        <Button
          type="primary"
          disabled={startSession.isPending || !!sessionId}
          onClick={() => startSession.mutate({ url })}
        >
          Start session
        </Button>
        <Button
          type="primary"
          disabled={endSession.isPending || !sessionId}
          onClick={() => {
            if (sessionId !== null) {
              setSessionId(null);
              endSession.mutate({ id: sessionId });
            }
          }}
        >
          End session
        </Button>
      </div>
      <CommandExecution
        sessionId={sessionId}
        startSession={() => startSession.mutateAsync({ url }).then((r) => r.id)}
        sessionLoading={startSession.isPending}
      />
    </div>
  );
}
