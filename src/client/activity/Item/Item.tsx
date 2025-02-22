import { Tooltip, Typography } from "antd";
import { CircleHelp } from "lucide-react";
import { assertTypesExhausted } from "~/common/assertions";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { objectKeys } from "~/common/objectUtils";
import { ItemWithChildren } from "~/server/db/schema";
import { Editor } from "../../components/Editor";
import { Image } from "../../components/Image";
import { ImageUploadLink } from "../../components/ImageUploader";
import { storeObserver } from "../../utils/storeObserver";
import { InfoVideoUpload } from "./InfoVideoUpload";

type CustomProps = {
  item: ItemWithChildren;
  itemNumber: number;
  deleted: boolean;
  enrolledAs: EnrollmentType[];
};

function getItemTitle(item: ItemWithChildren): string {
  for (const propKey of objectKeys(item)) {
    switch (propKey) {
      case "id":
      case "activityId":
      case "orderFracIdx":
        continue;
      case "infoVideo": {
        if (item.infoVideo) {
          return "Video";
        }
        continue;
      }
      case "infoImage": {
        if (item.infoImage) {
          return "Image";
        }
        continue;
      }
      case "infoText": {
        if (item.infoText) {
          return "Text";
        }
        continue;
      }
      case "question": {
        if (item.question) {
          return "Question";
        }
        continue;
      }
      default:
        assertTypesExhausted(propKey);
    }
  }
  return "";
}

const TypeTitle = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-sm text-gray-500">{children}</div>;
};

export const Item = storeObserver<CustomProps>(function Item(props) {
  const { item, itemNumber, deleted, activityEditorStore, questionStore } =
    props;

  return (
    <div className="mb-12 flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <div className="mb-1 flex items-center gap-2">
          <div className="text-lg font-bold">Item {itemNumber}</div>
          <TypeTitle>{getItemTitle(item)}</TypeTitle>
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
        {objectKeys(item).map((itemKey) => {
          switch (itemKey) {
            case "id":
            case "activityId":
            case "orderFracIdx":
              return null;
            case "infoImage": {
              const { infoImage } = item;
              if (!infoImage) return null;
              return (
                <div key={infoImage.id} className="w-full">
                  <Image
                    alt={
                      infoImage.url
                        ? infoImage.textAlternative
                        : "Missing image"
                    }
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
              );
            }
            case "infoText": {
              const { infoText } = item;
              if (!infoText) return null;
              return (
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
              );
            }
            case "infoVideo": {
              const { infoVideo } = item;
              if (!infoVideo) return null;
              return (
                <div key={infoVideo.id} className="w-full">
                  <InfoVideoUpload />
                </div>
              );
            }
            case "question": {
              const { question } = item;
              if (!question) return null;
              const evalKey = questionStore.getEvalKey(question.id);
              return (
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
                    <div className="ml-7">
                      <div className="text-sm font-bold">Answer</div>
                      <Editor
                        placeholder="Insert answer here..."
                        value={evalKey.key}
                        setValue={(v) => {
                          activityEditorStore.updateDraft("evalKeys", {
                            id: evalKey.id,
                            key: v,
                          });
                        }}
                        className={
                          question.content && !evalKey.key
                            ? "placeholder-red-500"
                            : ""
                        }
                      />
                    </div>
                  ) : null}
                </div>
              );
            }
            default:
              assertTypesExhausted(itemKey);
          }
        })}
      </div>
    </div>
  );
});
