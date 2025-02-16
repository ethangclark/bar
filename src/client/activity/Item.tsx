import { Tooltip, Typography } from "antd";
import { CircleHelp } from "lucide-react";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { assertNever } from "~/common/errorUtils";
import { objectKeys } from "~/common/objectUtils";
import {
  type InfoImage,
  type InfoText,
  type Item as ItemType,
  type Question,
} from "~/server/db/schema";
import { Editor } from "../components/Editor";
import { Image } from "../components/Image";
import { ImageUploadLink } from "../components/ImageUploader";
import { TeacherSection } from "../components/TeacherSection";
import { isStoreName, type Stores } from "../utils/allStores";
import { storeObserver } from "../utils/storeObserver";

type CustomProps = {
  item: ItemType;
  itemNumber: number;
  deleted: boolean;
  enrolledAs: EnrollmentType[];
  infoImage: InfoImage | null;
  infoText: InfoText | null;
  question: Question | null;
};

function getItemTitle(props: CustomProps & Stores): string {
  for (const propKey of objectKeys(props)) {
    if (isStoreName(propKey)) {
      continue;
    }
    switch (propKey) {
      case "item":
      case "itemNumber":
      case "deleted":
      case "enrolledAs":
        continue;
      case "infoImage": {
        if (props.infoImage) {
          return "Image";
        }
        continue;
      }
      case "infoText": {
        if (props.infoText) {
          return "Text";
        }
        continue;
      }
      case "question": {
        if (props.question) {
          return "Question";
        }
        continue;
      }
      default:
        assertNever(propKey);
    }
  }
  return "";
}

const TypeTitle = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-sm text-gray-500">{children}</div>;
};

export const Item = storeObserver<CustomProps>(function Item(props) {
  const {
    item,
    itemNumber,
    deleted,
    activityEditorStore,
    infoImage,
    infoText,
    question,
    questionStore,
  } = props;
  const evalKey = question && questionStore.getEvalKey(question.id);

  return (
    <div
      className={`mb-2 flex w-[500px] flex-col items-center px-4 pb-4 lg:w-[680px]`}
    >
      <div className="flex w-full items-center justify-between">
        <div className="mb-1 flex items-center gap-2">
          <div className="text-lg font-bold">Item {itemNumber}</div>
          <TypeTitle>{getItemTitle(props)}</TypeTitle>
        </div>
        <Typography.Link
          onClick={() => activityEditorStore.toggleDeletion(item.id)}
          className="text-xs"
        >
          {activityEditorStore.isDeletedDraft(item.id) ? (
            "Restore"
          ) : (
            <span className="text-gray-500 hover:text-red-500">Delete</span>
          )}
        </Typography.Link>
      </div>
      <div className={`w-full ${deleted ? "opacity-30" : ""}`}>
        {infoImage ? (
          <div key={infoImage.id} className="w-full">
            <Image
              alt={infoImage.url ? infoImage.textAlternative : "Missing image"}
              url={infoImage.url}
              className="max-w-full"
            />
            <div className="mb-1 flex w-full justify-center">
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
            <div className="flex items-center">
              <div className="mr-1">
                <TypeTitle>Description</TypeTitle>
              </div>
              <Tooltip
                title="Summit can't understand images yet. This text describes the image to Summit so it knows what's being seen."
                className="text-gray-500"
              >
                <CircleHelp size={16} />
              </Tooltip>
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
                <TypeTitle>Answer</TypeTitle>
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
    </div>
  );
});
