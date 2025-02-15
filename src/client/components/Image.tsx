import { type DetailedHTMLProps, type ImgHTMLAttributes } from "react";

export function Image({
  alt,
  url,
  ...props
}: { alt: string; url: string } & Omit<
  DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>,
  "src"
>) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} {...props} />
  );
}
