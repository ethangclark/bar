"use client";

import { useSearchParams } from "next/navigation";
import { ClientOnly } from "~/app/_components/ClientOnly";
import {
  columnWidth,
  pageLoadedClassname,
  rowHeight,
} from "~/common/utils/constants";

import { ZoomedCircleComponent } from "~/app/_components/ZoomedCircleComponent";

const PageWithAnnotationBase = ({ imageDataUrl }: { imageDataUrl: string }) => {
  const searchParams = useSearchParams();
  const rowIdx = parseInt(searchParams.get("rowIdx") ?? "NaN");
  const columnIdx = parseInt(searchParams.get("columnIdx") ?? "NaN");
  if (isNaN(rowIdx) || isNaN(columnIdx)) {
    return <div>Invalid row or column idx</div>;
  }

  return (
    <div className={`${pageLoadedClassname}`}>
      <ZoomedCircleComponent
        imageDataUrl={imageDataUrl}
        n={3}
        x0={columnIdx * columnWidth}
        x1={(columnIdx + 1) * columnWidth}
        y0={rowIdx * rowHeight}
        y1={(rowIdx + 1) * rowHeight}
        lineWidth={2}
        lineColor="rgba(55,55,55,0.7)"
      />
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
