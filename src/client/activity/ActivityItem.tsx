import {
  type InfoImage,
  type ActivityItemWithChildren,
} from "~/server/db/schema";
import { storeObserver } from "../utils/storeObserver";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { ImageUploader } from "../components/ImageUploader";
import {
  ArrowDown,
  ArrowUp,
  CircleHelp,
  GripVertical,
  Trash2,
} from "lucide-react";
import { Tooltip } from "antd";

const maxImgWidth = 400;

function RowBox({
  children,
  headerContent,
  helpContent,
}: {
  children: React.ReactNode;
  headerContent: React.ReactNode;
  helpContent?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center" style={{ width: maxImgWidth }}>
      <div className="mb-1 flex items-center text-sm text-gray-600">
        <div className="mr-1">{headerContent}</div>
        {helpContent && (
          <Tooltip title={helpContent}>
            <CircleHelp size={16} />
          </Tooltip>
        )}
      </div>
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center ">
      <div className="flex flex-col items-center text-gray-500">
        <ArrowUp size={20} />
        <GripVertical className="my-1" />
        <ArrowDown size={20} />
      </div>
      <div className="mx-2 flex rounded-xl border p-4 shadow">{children}</div>
      <div className="text-gray-400">
        <Trash2 />
      </div>
    </div>
  );
}

const InfoImageView = storeObserver<{
  item: ActivityItemWithChildren;
  infoImage: InfoImage;
}>(function InfoImageView({ activityEditorStore, item, infoImage }) {
  return (
    <Row>
      <RowBox headerContent="Image">
        <ImageFromDataUrl
          alt={infoImage.textAlternative}
          src={infoImage.url}
          style={{
            maxWidth: maxImgWidth,
            marginBottom: 16,
          }}
        />
        <ImageUploader
          onFileSelect={({ imageDataUrl }) => {
            console.log({ imageDataUrl });
            activityEditorStore.setItemInfoImageDraftUrl({
              itemId: item.id,
              url: imageDataUrl,
            });
          }}
        />
      </RowBox>
      <RowBox
        headerContent="What Summit sees"
        helpContent="Summit can't yet understand images, so this is the material it will use for teaching and evaluating"
      >
        <Editor
          value={infoImage.textAlternative}
          setValue={(v) => {
            activityEditorStore.setItemInfoImageDraftTextAlternative({
              itemId: item.id,
              textAlternative: v,
            });
          }}
        />
      </RowBox>
    </Row>
  );
});

export const ActivityItem = storeObserver<{
  item: ActivityItemWithChildren;
}>(function ActivityItem({ item, activityEditorStore }) {
  return (
    <div>
      {item.infoImages.map((infoImage) => (
        <InfoImageView key={infoImage.id} item={item} infoImage={infoImage} />
      ))}
      {item.infoTexts.map((infoText) => (
        <div key={infoText.id}>
          <Editor
            value={infoText.content}
            setValue={(v) => {
              activityEditorStore.setItemInfoTextDraftContent({
                itemId: item.id,
                content: v,
              });
            }}
          />
        </div>
      ))}
      {item.questions.map((question) => (
        <div key={question.id}>
          <Editor
            value={question.content}
            setValue={(v) => {
              activityEditorStore.setItemQuestionDraftContent({
                itemId: item.id,
                content: v,
              });
            }}
          />
        </div>
      ))}
    </div>
  );
});
