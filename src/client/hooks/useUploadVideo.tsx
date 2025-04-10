import { useCallback } from "react";

export function useUploadVideo({
  cloudflareUploadUrl,
}: {
  cloudflareUploadUrl: string;
}) {
  return useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(cloudflareUploadUrl, {
        method: "POST",
        body: formData,
      });
      const asJson = await response.json();
      console.log("Upload response:", asJson);
    },
    [cloudflareUploadUrl],
  );
}
