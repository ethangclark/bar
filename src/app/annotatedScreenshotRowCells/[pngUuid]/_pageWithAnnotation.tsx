"use client";

import { useSearchParams } from "next/navigation";
import { ClientOnly } from "~/app/_components/ClientOnly";
import { ImageFromDataUrl } from "~/app/_components/ImageFromDataUrl";
import {
  annotationCols,
  annotationRows,
  columnWidth,
  pageLoadedClassname,
  rowHeight,
} from "~/common/utils/constants";
import { excelFmtUtils } from "~/common/utils/excelFmtUtils";

const EllipticalOutline = ({
  // idx,
  width: rawWidth,
  height: rawHeight,
  color,
}: {
  idx: number;
  width: number;
  height: number;
  color: string;
}) => {
  const width = rawWidth;
  const height = rawHeight + Math.random() * 10 - 5;

  const strokeWidth = 3; // Stroke width of the ellipse
  const adjustedWidth = width - strokeWidth;
  const adjustedHeight = height - strokeWidth;

  const cx = width / 2;
  const cy = height / 2;
  const rx = adjustedWidth / 2;
  const ry = adjustedHeight / 2;

  const rotation = Math.random() * 20 - 10;

  return (
    <svg width={width} height={height}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        transform={`rotate(${rotation}, ${cx}, ${cy})`}
        opacity={0.6}
        // strokeDasharray={idx % 2 ? "8, 6" : "5, 2"}
      />
    </svg>
  );
};

// this doesn't seem to be working on it's own -- we should probably wrap it to generate a whole array at once
let lastColor = [0, 0, 0];
const getValue = () => Math.floor(Math.random() * 256);
function getColor() {
  const color = [getValue(), getValue(), getValue()];
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  if (!color.some((value, idx) => Math.abs(lastColor[idx]! - value) > 100)) {
    return getColor();
  }
  lastColor = color;
  return `rgb(${color.join(", ")})`;
}

const colors = Array(100)
  .fill(null)
  .map(() => getColor());

// const r = () => Math.floor(Math.random() * 256).toString();
// const colorGetter = () => {
//   const values = [r(), r(), r()];
//   return (opacity: number) => `rgba(${values.join(", ")}, ${opacity})`;
// };

function Cell({
  idx,
  label,
  x0,
  y0,
}: {
  idx: number;
  label: string;
  x0: number;
  y0: number;
}) {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  // const color = colors[props.columnIdx % colors.length]!;
  // const color = getColor();
  const color = colors[idx] ?? getColor();
  return (
    <div
      style={{
        position: "absolute",
        left: x0,
        right: x0 + columnWidth,
        top: y0,
        bottom: y0 + rowHeight,
        width: columnWidth,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "relative",
          marginTop: "-5px",
          color,
        }}
      >
        {label}
      </div>
      <div
        className="absolute"
        style={{
          // left: `${Math.random() * 8 - 4}px`,
          left: 0,
          top: -10 + (Math.random() - 0.5) * 7,
          zIndex: 1,
        }}
      >
        <EllipticalOutline
          idx={idx}
          width={columnWidth}
          height={rowHeight * 1.2 + 30}
          color={color}
        />
      </div>
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
      {Array(annotationCols)
        .fill(null)
        .map((_, idx) => (
          <Cell
            key={idx}
            idx={idx}
            label={excelFmtUtils.rowIdxToExcelRow(idx).toString()}
            x0={idx * columnWidth}
            y0={rowHeight * rowIdx}
          />
        ))}
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
