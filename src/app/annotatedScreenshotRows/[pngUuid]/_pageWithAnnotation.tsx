"use client";

import { ImageFromDataUrl } from "~/app/_components/ImageFromDataUrl";
import {
  pageLoadedClassname,
  browsyBrowserHeight,
  annotationRows,
  rowHeight,
  browsyBrowserWidth,
} from "~/common/utils/constants";
import { excelFmtUtils } from "~/common/utils/excelFmtUtils";

// const r = () => Math.floor(Math.random() * 256).toString();
// const colorGetter = () => {
//   const values = [r(), r(), r()];
//   return (opacity: number) => `rgba(${values.join(", ")}, ${opacity})`;
// };

const spacing = 65;

function ImageRow({
  idx,
  numberLabel,
  x0,
  y0,
}: {
  idx: number;
  numberLabel: number;
  x0: number;
  y0: number;
}) {
  // const getColor = colorGetter();
  return (
    <div
      className="absolute flex items-center"
      style={{
        left: x0,
        top: y0,
        width: browsyBrowserWidth,
        height: rowHeight,
        borderTop: `1px solid black`,
        borderBottom: `1px solid white`,
        // backgroundColor: getColor(0.08),
        // color: getColor(0.7),
        color: idx % 2 ? "rgba(94,182,199,1)" : undefined,
        backgroundColor: idx % 2 ? "rgba(0,214,255,0.09)" : undefined,
        opacity: 0.4,
      }}
    >
      {Array(Math.floor(browsyBrowserWidth / spacing))
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center text-xs"
            style={{ left: i * spacing }}
          >
            {numberLabel}
          </div>
        ))}
    </div>
  );
}

export const PageWithAnnotation = ({
  imageDataUrl,
}: {
  imageDataUrl: string;
}) => {
  const rowHeight = browsyBrowserHeight / annotationRows;

  return (
    <div className={`${pageLoadedClassname}`}>
      {Array(annotationRows)
        .fill(null)
        .map((_, idx) => (
          <ImageRow
            key={idx}
            idx={idx}
            numberLabel={excelFmtUtils.rowIdxToExcelRow(idx)}
            x0={0}
            y0={rowHeight * idx}
          />
        ))}
      <ImageFromDataUrl imageDataUrl={imageDataUrl} alt={"png image"} />
    </div>
  );
};
