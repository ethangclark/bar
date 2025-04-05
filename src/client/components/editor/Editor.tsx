import { Button, Popconfirm } from "antd";
import { Trash2 } from "lucide-react";
import { forwardRef, useMemo } from "react";
import { BasicEditor } from "./BasicEditor";
import { LatexEditor } from "./LatexEditor";
import { joinSegments, parseTextWithLatex } from "./utils";

function getRoundingCn({
  isFirstSegment,
  isLastSegment,
}: {
  isFirstSegment: boolean;
  isLastSegment: boolean;
}) {
  if (isFirstSegment && isLastSegment) {
    return "rounded-md";
  }
  if (isFirstSegment) {
    return "rounded-t-md";
  }
  if (isLastSegment) {
    return "rounded-b-md";
  }
  return "";
}

function getOutlineCn({
  isFirstSegment,
  isLastSegment,
}: {
  isFirstSegment: boolean;
  isLastSegment: boolean;
}) {
  if (isFirstSegment && isLastSegment) {
    return "border border-gray-200";
  }
  if (isFirstSegment) {
    return "border-t border-x border-gray-200";
  }
  if (isLastSegment) {
    return "border-b border-x border-gray-200";
  }
  return "";
}

type EditorProps = {
  value: string;
  onChange: (value: string) => void;
  isOk?: boolean;
  placeholder?: string;
  onKeyDown?: (e: {
    key: string;
    shiftKey: boolean;
    preventDefault: () => void;
  }) => void;
  disabled?: boolean;
  minHeight?: number;
};

export const Editor = forwardRef<HTMLTextAreaElement, EditorProps>(
  function Editor(
    {
      value,
      onChange,
      isOk = true,
      placeholder,
      onKeyDown,
      disabled,
      minHeight,
    },
    ref,
  ) {
    const segments = useMemo(() => parseTextWithLatex(value), [value]);

    return (
      <div className="flex w-full flex-col" style={{ minHeight }}>
        {segments.map((segment, index) => {
          const isFirstSegment = index === 0;
          const isLastSegment = index === segments.length - 1;
          switch (segment.type) {
            case "text": {
              return (
                <BasicEditor
                  key={index}
                  ref={isLastSegment ? ref : undefined}
                  value={segment.content}
                  onChange={(v) => {
                    const newSegments = segments
                      .map((s, i) => {
                        if (i === index) {
                          if (v === "") {
                            return [];
                          } else {
                            return { ...s, content: v };
                          }
                        }
                        return s;
                      })
                      .flat(1);
                    onChange(joinSegments(newSegments));
                  }}
                  roundingCn={getRoundingCn({ isFirstSegment, isLastSegment })}
                  outlineCn={getOutlineCn({ isFirstSegment, isLastSegment })}
                  className={
                    isOk || !isLastSegment ? "" : "placeholder-red-500"
                  }
                  placeholder={placeholder}
                  onKeyDown={onKeyDown}
                  disabled={disabled}
                  minHeight={
                    minHeight && segments.length === 1 ? minHeight : undefined
                  }
                />
              );
            }
            case "latex": {
              return (
                <div className="flex w-full items-center border-2 border-x border-dotted border-gray-200 pl-2.5 pr-1">
                  <LatexEditor
                    key={index}
                    className="grow"
                    placeholder="Tap keyboard icon or type equation here..."
                    value={segment.content}
                    onChange={(v) => {
                      const newSegments = segments
                        .map((s, i) => {
                          if (i === index) {
                            if (v === "") {
                              return [];
                            } else {
                              return { ...s, content: v };
                            }
                          }
                          return s;
                        })
                        .flat(1);
                      onChange(joinSegments(newSegments));
                    }}
                    onKeyDown={onKeyDown}
                    disabled={disabled}
                  />
                  <Popconfirm
                    title="Delete this equation?"
                    description="Are you sure you want to delete this equation?"
                    onConfirm={() => {
                      const newSegments = segments.filter(
                        (_, i) => i !== index,
                      );
                      onChange(joinSegments(newSegments));
                    }}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button type="text" className="px-2">
                      <Trash2 className="text-gray-500" size={16} />
                    </Button>
                  </Popconfirm>
                </div>
              );
            }
          }
        })}
        {disabled ? null : (
          <div className="mt-1 flex w-full justify-center">
            <Button
              size="small"
              type="text"
              className="text-xs text-gray-700"
              onClick={() => {
                onChange(
                  joinSegments([...segments, { type: "latex", content: "" }]),
                );
              }}
              onKeyDown={onKeyDown}
            >
              Add equation
            </Button>
          </div>
        )}
      </div>
    );
  },
);
