import { Tooltip } from "antd";
import { CircleHelp } from "lucide-react";
import {
  type ActivityItemWithChildren,
  type InfoImage,
} from "~/server/db/schema";
import { Centered } from "../components/Centered";
import { Editor } from "../components/Editor";
import { ImageFromDataUrl } from "../components/ImageFromDataUrl";
import { ImageUploader } from "../components/ImageUploader";
import { storeObserver } from "../utils/storeObserver";

const boxWidth = 400;

function RowBox({
  children,
  header,
}: {
  children: React.ReactNode;
  header?: {
    content: React.ReactNode;
    help?: React.ReactNode;
  };
}) {
  return (
    <div
      className="flex flex-col items-center rounded border p-4 shadow"
      style={{ width: boxWidth }}
    >
      {header && (
        <div className="mb-3 flex items-center text-sm text-gray-700">
          <div className="mr-1">{header.content}</div>
          {header.help && (
            <Tooltip title={header.help} className="text-gray-500">
              <CircleHelp size={16} />
            </Tooltip>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center space-x-2">
      <div className="flex space-x-4">{children}</div>
    </div>
  );
}

const InfoImageView = storeObserver<{
  item: ActivityItemWithChildren;
  infoImage: InfoImage;
}>(function InfoImageView({ activityEditorStore, item, infoImage }) {
  return (
    <Row>
      <RowBox>
        <Centered>
          <div className="flex flex-col items-center">
            {infoImage.url && (
              <ImageFromDataUrl
                alt={infoImage.textAlternative}
                src={infoImage.url}
                style={{
                  maxWidth: "100%",
                  marginBottom: 16,
                }}
              />
            )}
            <ImageUploader
              onFileSelect={({ imageDataUrl }) => {
                console.log({ imageDataUrl });
                activityEditorStore.setItemInfoImageDraftUrl({
                  itemId: item.id,
                  url: imageDataUrl,
                });
              }}
            />
          </div>
        </Centered>
      </RowBox>
      <RowBox
        header={{
          content: "What Summit sees",
          help: "Summit can't yet understand images, so this is the material it will use for teaching and evaluating",
        }}
      >
        <Editor
          value={infoImage.textAlternative}
          setValue={(v) => {
            activityEditorStore.setItemInfoImageDraftTextAlternative({
              itemId: item.id,
              textAlternative: v,
            });
          }}
          flexGrow={1}
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
