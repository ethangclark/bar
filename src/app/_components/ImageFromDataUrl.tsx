import { type ImgHTMLAttributes, type DetailedHTMLProps } from "react";

export function ImageFromDataUrl({
  alt,
  imageDataUrl,
  ...props
}: { alt: string; imageDataUrl?: string } & DetailedHTMLProps<
  ImgHTMLAttributes<HTMLImageElement>,
  HTMLImageElement
>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageDataUrl} alt={alt} {...props} />
  );
}
