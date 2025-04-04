import { LinkStyle } from "~/client/components/Link";
import { assertTypesExhausted } from "~/common/assertions";
import { type EnrollmentType } from "~/common/enrollmentTypeUtils";
import { noop } from "~/common/fnUtils";
import { objectKeys } from "~/common/objectUtils";
import { type ItemWithDescendents } from "~/server/db/schema";
import { storeObserver } from "../../utils/storeObserver";
import { InfoImageItem } from "./InfoImageItem";
import { InfoTextItem } from "./InfoTextItem/InfoTextItem";
import { InfoVideoItem } from "./InfoVideoItem";
import { TypeTitle } from "./Layout";
import { QuestionItem } from "./QuestionItem";

type CustomProps = {
  item: ItemWithDescendents;
  itemNumber: number;
  deleted: boolean;
  enrolledAs: EnrollmentType[];
  moveItemUp: (() => void) | null;
  moveItemDown: (() => void) | null;
};

function getItemTitle(item: ItemWithDescendents): string {
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
  const { item, itemNumber, deleted, draftStore, moveItemUp, moveItemDown } =
    props;

  return (
    <div className="mb-12 flex w-full flex-col items-center">
      <div className="flex w-full items-center justify-between">
        <div className="mb-1 flex items-center gap-2">
          <div className="flex flex-col">
            <LinkStyle
              className="mb-[-2px] text-xs"
              onClick={moveItemUp ?? noop}
              disabled={!moveItemUp}
              title={moveItemUp ? "Move up" : "No item above"}
            >
              ↑
            </LinkStyle>
            <LinkStyle
              className="mt-[-2px] text-xs"
              onClick={moveItemDown ?? noop}
              disabled={!moveItemDown}
              title={moveItemDown ? "Move down" : "No item below"}
            >
              ↓
            </LinkStyle>
          </div>
          <div className="text-lg font-bold">Item {itemNumber}</div>
          <TypeTitle>{getItemTitle(item)}</TypeTitle>
        </div>
        <LinkStyle
          onClick={() => draftStore.toggleDeletion(item.id)}
          className="text-xs"
        >
          {draftStore.isDeletedDraft(item.id) ? (
            "Restore"
          ) : (
            <span className="text-gray-500 hover:text-red-500">Delete</span>
          )}
        </LinkStyle>
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
              return <InfoImageItem key={infoImage.id} infoImage={infoImage} />;
            }
            case "infoText": {
              const { infoText } = item;
              if (!infoText) return null;
              return <InfoTextItem key={infoText.id} infoText={infoText} />;
            }
            case "infoVideo": {
              const { infoVideo } = item;
              if (!infoVideo) return null;
              return (
                <InfoVideoItem key={infoVideo.id} infoVideoDraft={infoVideo} />
              );
            }
            case "question": {
              const { question } = item;
              if (!question) return null;
              return <QuestionItem key={question.id} question={question} />;
            }
            default:
              assertTypesExhausted(itemKey);
          }
        })}
      </div>
    </div>
  );
});
