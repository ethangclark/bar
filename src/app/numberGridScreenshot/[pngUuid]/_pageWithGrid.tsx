"use client";

import { ImageFromDataUrl } from "~/app/_components/ImageFromDataUrl";
import {
  browsyBrowserHeight,
  browsyBrowserWidth,
  pageLoadedClassname,
} from "~/common/utils/constants";

const numColumns = 30;
const numRows = 30;

const startingNumber = 100;

export const PageWithGrid = ({ imageDataUrl }: { imageDataUrl: string }) => {
  const translucent = "1px solid rgba(0,0,0,0.2)";

  return (
    <div className={`${pageLoadedClassname}`}>
      <ImageFromDataUrl imageDataUrl={imageDataUrl} alt={"png image"} />

      {Array.from({ length: numRows }).map((_, rowIdx) =>
        Array.from({ length: numColumns }).map((_, columnIdx) => (
          <div
            key={`${rowIdx}|${columnIdx}`}
            style={{
              position: "absolute",
              border: translucent,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              left: columnIdx * (browsyBrowserWidth / numColumns),
              top: rowIdx * (browsyBrowserHeight / numRows),
              width: browsyBrowserWidth / numColumns,
              height: browsyBrowserHeight / numRows,
              opacity: 0.1,
            }}
          >
            {rowIdx * numColumns + columnIdx + startingNumber}
          </div>
        )),
      )}
    </div>
  );
};
