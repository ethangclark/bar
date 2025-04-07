import { useMemo } from "react";
import { assertTypesExhausted } from "~/common/assertions";
import { LatexEditor } from "./LatexEditor";
import { parseTextWithLatex } from "./utils";

function PreformattedText({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <pre className={`text-wrap font-serif ${className}`}>{children}</pre>;
}

export function RichText({ value }: { value: string }) {
  const segments = useMemo(() => {
    const parsed = parseTextWithLatex(value);
    return parsed
      .filter((item) => {
        switch (item.type) {
          case "latex":
            return item.content !== "";
          case "text":
            return item.content !== "";
          default:
            assertTypesExhausted(item);
        }
      })
      .map((item) => ({
        ...item,
        content: item.content.trim(),
      }));
  }, [value]);
  return (
    <div className="flex w-full flex-col">
      {segments.map((segment, index) => {
        switch (segment.type) {
          case "text": {
            return (
              <PreformattedText key={index}>{segment.content}</PreformattedText>
            );
          }
          case "latex": {
            return (
              <div className="my-3" key={index}>
                <LatexEditor
                  className="grow"
                  value={segment.content}
                  disabled
                  readOnly
                />
              </div>
            );
          }
          default:
            assertTypesExhausted(segment);
        }
      })}
    </div>
  );
}
