// import Image from "next/image";

import { Title } from "./Title";

// export function Logo({ wh }: { wh: number }) {
//   return (
//     <Image
//       alt="summited logo"
//       src="/images/spreader-logo.png"
//       width={wh}
//       height={wh}
//     />
//   );
// }

export function LogoText({ className }: { className: string }) {
  return (
    <Title className={className} marginBottomCn="mb-0">
      SummitEd
    </Title>
  );
}

export const Logo = ({ height: h }: { height: number }) => {
  const strokeWidth = Math.log2(h) / 2;
  return (
    <div style={{ height: h, width: h * 2 }}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${h * 2} ${h}`}>
        <g>
          <path
            d={`M${h * 0.2} ${h * 0.9} L${h} ${h * 0.1} L${h * 1.8} ${h * 0.9} Z`}
            fill="#4A90E2"
            stroke="#1557A0"
            strokeWidth={strokeWidth}
          />
          <path
            d={`M${h * 0.6} ${h * 0.9 - 1} L${h} ${h * 0.49} L${h * 1.4} ${h * 0.9 - 1} Z`}
            fill="#2171CD"
            stroke="#1557A0"
            strokeWidth={strokeWidth}
          />
        </g>
      </svg>
    </div>
  );
};
