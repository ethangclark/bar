import {
  type InfoImage,
  type InfoText,
  type Question,
  type Item as ItemType,
} from "~/server/db/schema";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { storeObserver } from "../utils/storeObserver";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { ImageUploadLink } from "../components/ImageUploader";
import {
  FullFramedTeacherSection,
  TeacherSection,
} from "../components/TeacherSection";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";

export const Item = storeObserver<{
  item: ItemType;
  deleted: boolean;
  enrolledAs: EnrollmentType[];
  infoImage: InfoImage | null;
  infoText: InfoText | null;
  question: Question | null;
}>(function Item({
  deleted,
  activityEditorStore,
  infoImage,
  infoText,
  question,
  questionStore,
}) {
  const evalKey = question && questionStore.getEvalKey(question.id);

  return (
    <div
      className={`flex flex-col items-center px-4 pb-4 ${deleted ? "opacity-30" : ""}`}
      style={{ width: 500 }}
    >
      {infoImage ? (
        <div key={infoImage.id} className="w-full">
          <ImageFromDataUrl
            alt={infoImage.url ? infoImage.textAlternative : "Missing image"}
            src={infoImage.url}
            style={{
              maxWidth: "100%",
              marginBottom: 4,
            }}
          />
          <div className="flex items-center">
            <div className="flex items-center text-sm text-gray-700">
              <div className="mr-1">Description</div>
              <Tooltip
                title="Summit can't understand images yet. This text describes the image to Summit so it knows what's being seen."
                className="text-gray-500"
              >
                <CircleHelp size={16} />
              </Tooltip>
            </div>
            <div>
              <span className="mx-2 text-gray-300">|</span>
              <ImageUploadLink
                label="Replace image"
                onFileSelect={({ imageDataUrl }) => {
                  activityEditorStore.updateDraft("infoImages", {
                    id: infoImage.id,
                    url: imageDataUrl,
                  });
                }}
              />
            </div>
          </div>
          <Editor
            value={infoImage.textAlternative}
            setValue={(v) => {
              activityEditorStore.updateDraft("infoImages", {
                id: infoImage.id,
                textAlternative: v,
              });
            }}
          />
        </div>
      ) : null}
      {infoText ? (
        <div key={infoText.id} className="w-full">
          <Editor
            value={infoText.content}
            setValue={(v) => {
              activityEditorStore.updateDraft("infoTexts", {
                id: infoText.id,
                content: v,
              });
            }}
            className={infoText.content ? "" : "placeholder-red-500"}
            placeholder="Insert text here..."
          />
        </div>
      ) : null}
      {question ? (
        <div key={question.id} className="flex w-full flex-col">
          <div className="mb-1">
            <Editor
              placeholder="Insert question here..."
              value={question.content}
              setValue={(v) => {
                activityEditorStore.updateDraft("questions", {
                  id: question.id,
                  content: v,
                });
              }}
              className={question.content ? "" : "placeholder-red-500"}
            />
          </div>
          {evalKey ? (
            <div className="h-full w-full">
              <TeacherSection>
                <div className="mb-[-4px] mr-[-4px] pl-1">
                  <Editor
                    placeholder="Insert answer here..."
                    value={evalKey.key}
                    setValue={(v) => {
                      activityEditorStore.updateDraft("evalKeys", {
                        id: evalKey.id,
                        key: v,
                      });
                    }}
                    outlineCn={"outline-none"}
                    className={
                      question.content && !evalKey.key
                        ? "placeholder-red-500"
                        : ""
                    }
                  />
                </div>
              </TeacherSection>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
