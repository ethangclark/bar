import { scrollbarWidth } from "~/client/utils/scrollbarWidth";
import { useIsClientSide } from "~/client/utils/isClientSide";

export function Page({ children }: { children: React.ReactNode }) {
  const isClientSide = useIsClientSide();
  const marginX = isClientSide ? scrollbarWidth : 0;
  return (
    // handles scrollbar width
    <div
      className="absolute bottom-0 top-0 flex flex-col items-center"
      style={{ left: marginX, right: marginX }}
    >
      {/* handles aesthetic margin */}
      <div
        className="flex flex-grow flex-col items-center"
        style={{
          margin: "16px 8px",
          // maxWidth: 1280,
        }}
      >
        {children}
      </div>
    </div>
  );
}
