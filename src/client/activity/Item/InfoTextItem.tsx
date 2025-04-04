import { type InfoText } from "~/server/db/schema";
import { Editor } from "../../components/Editor";
import { storeObserver } from "../../utils/storeObserver";
import { joinSegments, parseTextWithLatex } from "./infoTextItemUtils";
import { isInfoTextDraftReady } from "./itemValidator";

export const InfoTextItem = storeObserver<{
  infoText: InfoText;
}>(function InfoText({ infoText, draftStore }) {
  const isOk = isInfoTextDraftReady(infoText);

  const segments = parseTextWithLatex(infoText.content);
  console.log({ segments, infoTextContent: infoText.content });

  return (
    <div key={infoText.id} className="w-full">
      {segments.map((segment, index) => {
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
                className={isOk || !isLastSegment ? "" : "placeholder-red-500"}
                placeholder="Insert text here..."
              />
            );
          }
          case "latex": {
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
                className={isOk || !isLastSegment ? "" : "placeholder-red-500"}
                placeholder="Insert text here..."
              />
            );
          }
        }
      })}
    </div>
  );
});
