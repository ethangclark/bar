import { useState, useEffect } from "react";

interface ZoomedCircleComponentProps {
  imageDataUrl: string;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  n: number;
  lineWidth?: number; // Added lineWidth as an optional prop
  lineColor?: string;
}

export const ZoomedCircleComponent: React.FC<ZoomedCircleComponentProps> = ({
  imageDataUrl,
  x0,
  y0,
  x1,
  y1,
  n,
  lineWidth = 1, // Default lineWidth to 1 if not provided
  lineColor = "black", // Default lineColor to "black" if not provided
}) => {
  const [imageDimensions, setImageDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageDataUrl;
    img.onload = () => {
      setImageDimensions({ width: img.width, height: img.height });
    };
  }, [imageDataUrl]);

  if (!imageDimensions) {
    return <div>Loading image...</div>;
  }

  const { width: imgWidth, height: imgHeight } = imageDimensions;

  // Compute first circle center and radius
  const xc = (x0 + x1) / 2;
  const yc = (y0 + y1) / 2;
  const r = Math.hypot(x1 - x0, y1 - y0) / 2;

  // Compute second circle position
  const padding = imgWidth * 0.1;
  const r1 = r;
  const r2 = n * r;
  const offset = r1 + r2 + padding;
  let xc2 = xc + offset;
  let yc2 = yc;

  // Adjust positions if necessary
  if (xc2 + r2 > imgWidth) {
    xc2 = xc - offset;
    if (xc2 - r2 < 0) {
      xc2 = xc;
      yc2 = yc + offset;
      if (yc2 + r2 > imgHeight) {
        yc2 = yc - offset;
      }
    }
  }
  if (yc2 < imgWidth * 0.5) {
    yc2 += imgWidth * 0.1;
  } else {
    yc2 -= imgWidth * 0.1;
  }

  // Compute tangent points
  const deltaX = xc2 - xc;
  const deltaY = yc2 - yc;
  const d = Math.hypot(deltaX, deltaY);

  if (d < Math.abs(r1 - r2)) {
    return <div>Circles overlap; cannot compute tangent lines.</div>;
  }

  const angleBetweenCenters = Math.atan2(deltaY, deltaX);
  const alpha = Math.acos((r1 - r2) / d);

  const theta1 = angleBetweenCenters + alpha;
  const theta2 = angleBetweenCenters - alpha;

  // Tangent points on first circle
  const xt1_1 = xc + r1 * Math.cos(theta1);
  const yt1_1 = yc + r1 * Math.sin(theta1);

  const xt1_2 = xc + r1 * Math.cos(theta2);
  const yt1_2 = yc + r1 * Math.sin(theta2);

  // Tangent points on second circle
  const xt2_1 = xc2 + r2 * Math.cos(theta1);
  const yt2_1 = yc2 + r2 * Math.sin(theta1);

  const xt2_2 = xc2 + r2 * Math.cos(theta2);
  const yt2_2 = yc2 + r2 * Math.sin(theta2);

  // Compute transformation for zoomed image
  const tx = xc2 - n * xc;
  const ty = yc2 - n * yc;

  return (
    <svg width={imgWidth} height={imgHeight}>
      <defs>
        <clipPath id="circle2Clip">
          <circle cx={xc2} cy={yc2} r={r2} />
        </clipPath>
      </defs>
      <image
        href={imageDataUrl}
        x="0"
        y="0"
        width={imgWidth}
        height={imgHeight}
      />
      <g clipPath="url(#circle2Clip)">
        <image
          href={imageDataUrl}
          x="0"
          y="0"
          width={imgWidth}
          height={imgHeight}
          transform={`translate(${tx}, ${ty}) scale(${n})`}
        />
      </g>
      {/* Draw the circles and lines after the images */}
      <circle
        cx={xc}
        cy={yc}
        r={r1}
        fill="none"
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
      <circle
        cx={xc2}
        cy={yc2}
        r={r2}
        fill="none"
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
      <line
        x1={xt1_1}
        y1={yt1_1}
        x2={xt2_1}
        y2={yt2_1}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
      <line
        x1={xt1_2}
        y1={yt1_2}
        x2={xt2_2}
        y2={yt2_2}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
    </svg>
  );
};
