import {
  type InfoImage,
  type InfoText,
  type Question,
  type Item as ItemType,
} from "~/server/db/schema";
import { WysiwygEditor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { storeObserver } from "../utils/storeObserver";
import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import { ImageUploadLink } from "../components/ImageUploader";
import { FullFramedTeacherSection } from "../components/TeacherSection";
import {
  type EnrollmentType,
  isGraderOrDeveloper,
} from "~/common/enrollmentTypeUtils";

export const Item = storeObserver<{
  item: ItemType;
  deleted: boolean;
  enrolledAs: EnrollmentType[];
  showControls: boolean;
  infoImage: InfoImage | null;
  infoText: InfoText | null;
  question: Question | null;
}>(function Item({
  deleted,
  enrolledAs,
  showControls,
  activityEditorStore,
  infoImage,
  infoText,
  question,
  questionStore,
}) {
  const igod = isGraderOrDeveloper(enrolledAs);
  const evalKey = question && questionStore.getEvalKey(question.id);

  return (
    <div
      className={`flex flex-col items-center px-4 pb-8 ${deleted ? "opacity-30" : ""}`}
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
            <div className={showControls ? "" : "invisible"}>
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
          <WysiwygEditor
            value={infoImage.textAlternative}
            disabled={!igod}
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
          <WysiwygEditor
            value={infoText.content}
            disabled={!igod}
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
            <WysiwygEditor
              placeholder="Insert question here..."
              value={question.content}
              disabled={!igod}
              setValue={(v) => {
                activityEditorStore.updateDraft("questions", {
                  id: question.id,
                  content: v,
                });
              }}
              className={question.content ? "" : "placeholder-red-500"}
            />
          </div>
          {evalKey && showControls ? (
            <div className="ml-[-8px]">
              <FullFramedTeacherSection>
                <div className="mb-[-4px] mr-[-4px] pl-1">
                  <WysiwygEditor
                    placeholder="Insert answer here..."
                    value={evalKey.key}
                    disabled={!igod}
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
              </FullFramedTeacherSection>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
});
