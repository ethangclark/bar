import { Button, Spin } from "antd";
import { Fragment, useCallback, useEffect, useState } from "react";
import { api } from "~/trpc/react";
import { Editor } from "../_components/Editor";
import { asSuccessOrNull, isFailure } from "~/common/utils/result";
import { useNotify } from "../_hooks/useNotify";
import { ImageFromDataUrl } from "../_components/ImageFromDataUrl";

export function CommandExecution({
  sessionId,
  startSession,
  sessionLoading,
}: {
  sessionId: string | null;
  startSession: () => Promise<string>;
  sessionLoading: boolean;
}) {
  const [command, setCommand] = useState("");
  const [selector, setSelector] = useState("");

  const submitCommand = api.browserSession.submitCommand.useMutation();
  const captureTestData = api.browserSession.captureTestData.useMutation();

  const [executedCommands, setExecutedCommands] = useState<
    Array<{ commandSubmitted: string; commandExecuted: string }>
  >([]);

  const [notify, contextHolder] = useNotify();

  const onClickSubmitCommand = useCallback(async () => {
    const id = sessionId ?? (await startSession());
    const commandData = await submitCommand.mutateAsync({
      id,
      command,
    });
    setCommand("");
    if (isFailure(commandData)) {
      notify({
        title: "Command failed",
        description: commandData.problem,
      });
      return;
    }
    setExecutedCommands((prev) => [...prev, commandData]);
  }, [command, notify, sessionId, startSession, submitCommand]);

  const onClickCaptureTestData = useCallback(async () => {
    const id = sessionId ?? (await startSession());
    const captureResult = await captureTestData.mutateAsync({
      id,
      command,
      selector,
    });
    if (isFailure(captureResult)) {
      notify({
        title: "Capture test data failed",
        description: captureResult.problem,
      });
    }
  }, [captureTestData, command, notify, selector, sessionId, startSession]);

  useEffect(() => {
    if (isFailure(captureTestData.data)) {
      notify({
        title: "Capture test data failed",
        description: captureTestData.data.problem,
      });
    }
  }, [captureTestData.data, notify]);

  const captureData = asSuccessOrNull(captureTestData.data);

  return (
    <>
      <div className="grid grid-cols-2 gap-5">
        {contextHolder}
        <div className="flex flex-col items-center">
          <Editor
            value={command}
            setValue={setCommand}
            // onKeyDown={async (event) => {
            //   const ogFocus = document.activeElement;
            //   if (event.key === "Enter") {
            //     event.preventDefault();
            //     await submit();
            //     setTimeout(() => {
            //       // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
            //       (ogFocus as any)?.focus?.();
            //     });
            //   }
            // }}
            disabled={submitCommand.isPending}
            className="mx-4 mb-4"
          />
          <Editor
            className="mb-4"
            value={selector}
            setValue={setSelector}
            placeholder={`Selectors ("%"-delimited if multiple)`}
            disabled={submitCommand.isPending || captureTestData.isPending}
          />
          <div className="flex">
            <Button
              className="mr-4"
              type="primary"
              onClick={onClickCaptureTestData}
              disabled={
                !command ||
                !selector ||
                command === asSuccessOrNull(captureTestData.data)?.command ||
                selector === asSuccessOrNull(captureTestData.data)?.selector
              }
            >
              Capture test data
            </Button>
            <Button
              onClick={onClickSubmitCommand}
              disabled={sessionLoading || submitCommand.isPending}
              className="mb-4"
            >
              Execute command only
            </Button>
          </div>
          <Spin
            className={`mb-4 ${sessionLoading || submitCommand.isPending ? "" : "invisible"}`}
          />
        </div>
        <div className="grid grid-cols-2 gap-x-10 gap-y-2">
          <div className="font-bold">Command submitted</div>
          <div className="font-bold">Command executed</div>
          {executedCommands
            .slice()
            .reverse()
            .map(({ commandSubmitted, commandExecuted }, index) => (
              <Fragment key={index}>
                <span>{commandSubmitted}</span>
                <span>{commandExecuted}</span>
              </Fragment>
            ))}
        </div>
      </div>
      {captureData && (
        <div className="relative">
          <ImageFromDataUrl
            imageDataUrl={captureData.outlinedClickAreaImageDataUrl}
            alt="Annotated screenshot from captured test data"
          />
          {captureData.bboxes.map((bbox, idx) => (
            <div
              key={idx}
              style={{
                position: "absolute",
                left: bbox.x0,
                top: bbox.y0,
                width: bbox.x1 - bbox.x0,
                height: bbox.y1 - bbox.y0,
                border: "2px solid red",
              }}
            />
          ))}
          <div className="m-3 bg-green-100 p-2">^^^ {captureData.command}</div>
        </div>
      )}
    </>
  );
}
