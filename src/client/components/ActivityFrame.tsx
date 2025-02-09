import { Fragment } from "react";
import { storeObserver } from "../utils/storeObserver";
import { TeacherSection } from "./TeacherSection";

const Spacer = () => <div />;

export const ControlSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`flex h-full w-full flex-col ${className ?? ""}`}>
    <TeacherSection>{children}</TeacherSection>
  </div>
);

type ActivityFrameProps = {
  header?: React.ReactNode;
  rows: Array<{
    leftControl?: React.ReactNode;
    main: React.ReactNode;
    rightControl?: React.ReactNode;
  }>;
  footer?: React.ReactNode;
};

export const ActivityFrame = storeObserver<ActivityFrameProps>(
  function ActivityFrame({ header, rows, footer }) {
    return (
      <div className="grid h-full auto-rows-min grid-cols-[repeat(3,_auto)] overflow-y-auto">
        <Spacer />
        <div className="flex flex-col items-center">{header}</div>
        <Spacer />

        {rows.map(({ leftControl: left, main, rightControl: right }, idx) => (
          <Fragment key={idx}>
            {left ? (
              <ControlSection className="mr-4 items-end">{left}</ControlSection>
            ) : (
              <Spacer />
            )}
            <div>{main}</div>
            {right ? (
              <ControlSection className="ml-4 items-start">
                {right}
              </ControlSection>
            ) : (
              <Spacer />
            )}
          </Fragment>
        ))}

        <Spacer />
        <div className="flex flex-col items-center">{footer}</div>
        <Spacer />
      </div>
    );
  },
);
