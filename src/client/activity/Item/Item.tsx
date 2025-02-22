import { Typography } from "antd";
import { assertTypesExhausted } from "~/common/assertions";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { objectKeys } from "~/common/objectUtils";
import { type ItemWithChildren } from "~/server/db/schema";
import { storeObserver } from "../../utils/storeObserver";
import { InfoImageItem } from "./InfoImageItem";
import { InfoTextItem } from "./InfoTextItem";
import { InfoVideoUpload } from "./InfoVideoUpload";
import { TypeTitle } from "./Layout";
import { QuestionItem } from "./QuestionItem";

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

export const Item = storeObserver<CustomProps>(function Item(props) {
  const { item, itemNumber, deleted, descendentDraftStore } = props;

  return (
    <div className="mb-12 flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <div className="mb-1 flex items-center gap-2">
          <div className="text-lg font-bold">Item {itemNumber}</div>
          <TypeTitle>{getItemTitle(item)}</TypeTitle>
        </div>
        <Typography.Link
          onClick={() => descendentDraftStore.toggleDeletion(item.id)}
          className="text-xs"
        >
          {descendentDraftStore.isDeletedDraft(item.id) ? (
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
              return <InfoImageItem infoImage={infoImage} />;
            }
            case "infoText": {
              const { infoText } = item;
              if (!infoText) return null;
              return <InfoTextItem infoText={infoText} />;
            }
            case "infoVideo": {
              const { infoVideo } = item;
              if (!infoVideo) return null;
              return (
                <div key={infoVideo.id} className="w-full">
                  <InfoVideoUpload infoVideo={infoVideo} />
                </div>
              );
            }
            case "question": {
              const { question } = item;
              if (!question) return null;
              return <QuestionItem question={question} />;
            }
            default:
              assertTypesExhausted(itemKey);
          }
        })}
      </div>
    </div>
  );
});
