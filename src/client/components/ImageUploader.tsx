import { FileImageOutlined } from "@ant-design/icons";
import { identity } from "@trpc/server/unstable-core-do-not-import";
import type { UploadProps } from "antd";
import { Typography, Upload } from "antd";
import { useMemo } from "react";
import { isImageDataUrl } from "~/common/pngUtils";
import { type Notify, useNotify } from "../hooks/useNotify";

type OnFileSelect = (params: { imageDataUrl: string }) => void;

function useProps({
  notify,
  onFileSelect,
}: {
  notify: Notify;
  onFileSelect: OnFileSelect;
}) {
  return useMemo(
    () =>
      identity<UploadProps>({
        name: "file",
        multiple: false,
        maxCount: 1,
        showUploadList: false,
        beforeUpload(file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const asDataUrl = event.target?.result;
            if (asDataUrl && typeof asDataUrl === "string") {
              if (isImageDataUrl(asDataUrl)) {
                onFileSelect({ imageDataUrl: asDataUrl });
              } else {
                notify({
                  title: "Unsupported image file",
                  description:
                    "Please upload a supported image file type (png, jpeg, etc.)",
                });
              }
            }
          };
          reader.readAsDataURL(file);
          return false;
        },
      }),
    [notify, onFileSelect],
  );
}

export function ImageUploader({
  onFileSelect,
  label = <p className="text-sm">Click or drag image files to upload</p>,
}: {
  onFileSelect: OnFileSelect;
  label?: React.ReactNode;
}) {
  const [notify, contextHolder] = useNotify();
  const props = useProps({ notify, onFileSelect });
  return (
    <Upload.Dragger {...props}>
      {contextHolder}
      <div className="flex w-full items-center">
        <FileImageOutlined className="mr-2" />
        {label}
      </div>
    </Upload.Dragger>
  );
}

export function ImageUploadLink({
  onFileSelect,
  children,
  label,
  className,
}: {
  onFileSelect: OnFileSelect;
} & (
  | { children?: undefined; label?: React.ReactNode; className?: string }
  | { children: React.ReactNode; label?: undefined; className?: undefined }
)) {
  const [notify, contextHolder] = useNotify();
  const props = useProps({ notify, onFileSelect });
  return (
    <Upload {...props}>
      {contextHolder}
      {children ?? (
        <Typography.Link className={className}>
          <FileImageOutlined className="mr-1" />
          {label}
        </Typography.Link>
      )}
    </Upload>
  );
}
