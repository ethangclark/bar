import { Button } from "antd";
import { Trash2 } from "lucide-react";
import { type InfoText } from "~/server/db/schema";
import { Editor } from "../../../components/Editor";
import { storeObserver } from "../../../utils/storeObserver";
import { isInfoTextDraftReady } from "../itemValidator";
import { LatexEditor } from "./LatexEditor";
import { joinSegments, parseTextWithLatex } from "./utils";

function getRoundingCn({
  isFirstSegment,
  isLastSegment,
}: {
  isFirstSegment: boolean;
  isLastSegment: boolean;
}) {
  if (isFirstSegment && isLastSegment) {
    return "rounded-md";
  }
  if (isFirstSegment) {
    return "rounded-t-md";
  }
  if (isLastSegment) {
    return "rounded-b-md";
  }
  return "";
}

function getOutlineCn({
  isFirstSegment,
  isLastSegment,
}: {
  isFirstSegment: boolean;
  isLastSegment: boolean;
}) {
  if (isFirstSegment && isLastSegment) {
    return "border border-gray-200";
  }
  if (isFirstSegment) {
    return "border-t border-x border-gray-200";
  }
  if (isLastSegment) {
    return "border-b border-x border-gray-200";
  }
  return "";
}

export const InfoTextItem = storeObserver<{
  infoText: InfoText;
}>(function InfoText({ infoText, draftStore }) {
  const isOk = isInfoTextDraftReady(infoText);

  const segments = parseTextWithLatex(infoText.content);

  return (
    <div key={infoText.id} className="flex w-full flex-col">
      {segments.map((segment, index) => {
        const isFirstSegment = index === 0;
        const isLastSegment = index === segments.length - 1;
        switch (segment.type) {
          case "text": {
            return (
              <Editor
                key={index}
                value={segment.content}
                setValue={(v) => {
                  const newSegments = segments
                    .map((s, i) => {
                      if (i === index) {
                        if (v === "") {
                          return [];
                        } else {
                          return { ...s, content: v };
                        }
                      }
                      return s;
                    })
                    .flat(1);
                  draftStore.updateDraft("infoTexts", {
                    id: infoText.id,
                    content: joinSegments(newSegments),
                  });
                }}
                roundingCn={getRoundingCn({ isFirstSegment, isLastSegment })}
                outlineCn={getOutlineCn({ isFirstSegment, isLastSegment })}
                className={isOk || !isLastSegment ? "" : "placeholder-red-500"}
                placeholder="Insert text here..."
              />
            );
          }
          case "latex": {
            return (
              <div className="flex w-full items-center border-2 border-x border-dotted border-gray-200 pl-2.5 pr-1">
                <LatexEditor
                  key={index}
                  className="grow"
                  value={segment.content}
                  onChange={(v) => {
                    const newSegments = segments
                      .map((s, i) => {
                        if (i === index) {
                          if (v === "") {
                            return [];
                          } else {
                            return { ...s, content: v };
                          }
                        }
                        return s;
                      })
                      .flat(1);
                    draftStore.updateDraft("infoTexts", {
                      id: infoText.id,
                      content: joinSegments(newSegments),
                    });
                  }}
                  // className={isOk || !isLastSegment ? "" : "placeholder-red-500"}
                  // placeholder="Insert text here..."
                />
                <Button type="text" className="px-2">
                  <Trash2 className="text-gray-500" size={16} />
                </Button>
              </div>
            );
          }
        }
      })}
    </div>
  );
});
