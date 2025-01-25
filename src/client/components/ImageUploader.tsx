import { FileImageOutlined } from "@ant-design/icons";
import { identity } from "@trpc/server/unstable-core-do-not-import";
import type { UploadProps } from "antd";
import { Upload } from "antd";
import { useMemo } from "react";
import { useNotify } from "../hooks/useNotify";
import { isImageDataUrl } from "~/common/utils/pngUtils";

export function ImageUploader({
  onFileSelect,
  label = <p className="text-sm">Click or drag image files to upload</p>,
}: {
  onFileSelect: (params: { imageDataUrl: string }) => void;
  label?: React.ReactNode;
}) {
  const [notify, contextHolder] = useNotify();
  const props = useMemo(
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
