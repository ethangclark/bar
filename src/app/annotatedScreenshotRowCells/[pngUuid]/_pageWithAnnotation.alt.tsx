"use client";

import { useSearchParams } from "next/navigation";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { ImageFromDataUrl } from "~/app/_components/ImageFromDataUrl";
import {
  annotationCols,
  annotationRows,
  browsyBrowserHeight,
  columnWidth,
  pageLoadedClassname,
} from "~/common/utils/constants";
import { excelFmtUtils } from "~/common/utils/excelFmtUtils";

const spacing = 65;

function Column({ idx }: { idx: number }) {
  const numberLabel = excelFmtUtils.rowIdxToExcelRow(idx).toString();
  return (
    <div
      style={{
        width: columnWidth,
        height: browsyBrowserHeight,
        color: idx % 2 ? "rgba(94,182,199,1)" : undefined,
        backgroundColor: idx % 2 ? "rgba(0,214,255,0.09)" : undefined,
        opacity: 0.4,
        borderLeft: `1px solid black`,
        borderRight: `1px solid white`,
        position: "relative",
      }}
    >
      {Array(Math.floor(browsyBrowserHeight / spacing))
        .fill(null)
        .map((_, i) => (
          <div
            key={i}
            className="absolute flex items-center justify-center text-xs"
            style={{ top: i * spacing, width: columnWidth }}
          >
            {numberLabel}
          </div>
        ))}
    </div>
  );
}

const PageWithAnnotationBase = ({ imageDataUrl }: { imageDataUrl: string }) => {
  const searchParams = useSearchParams();
  const rowIdx = parseInt(searchParams.get("rowIdx") ?? "NaN");
  if (isNaN(rowIdx) || rowIdx < 0 || rowIdx >= annotationRows) {
    return <div>Invalid rowIdx</div>;
  }
  return (
    <div className={`${pageLoadedClassname}`}>
      <ImageFromDataUrl imageDataUrl={imageDataUrl} alt={"png image"} />
      <div className="absolute left-0 top-0 flex">
        {Array(annotationCols)
          .fill(null)
          .map((_, idx) => (
            <Column key={idx} idx={idx} />
          ))}
      </div>
    </div>
  );
};

export const PageWithAnnotation: typeof PageWithAnnotationBase = (props) => {
  return (
    <ClientOnly>
      <PageWithAnnotationBase {...props} />
    </ClientOnly>
  );
};
