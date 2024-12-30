import { type ReactNode } from "react";

interface TopicHeaderProps {
  courseTypeName: string;
  unitName: string;
  moduleName: string;
  topicName: string;
  topLeftCorner: ReactNode;
}

export function TopicHeader({
  courseTypeName,
  unitName,
  moduleName,
  topicName,
  topLeftCorner,
}: TopicHeaderProps) {
  return (
    <div className="md:text-md w-full self-start text-sm">
      <div>
        <div className="flex w-full">
          <div>{topLeftCorner}</div>
          <div className="md:text-md flex-wrap items-center text-xs">
            {courseTypeName} &gt; {unitName} &gt; {moduleName}
          </div>
        </div>
        <div className="mb-2 text-lg md:text-2xl">{topicName}</div>
      </div>
    </div>
  );
}
