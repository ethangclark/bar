import { Switch } from "antd";
import { Fragment } from "react";

type ActivityFrameProps = {
  teacherModeAvailable: boolean;
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  header: React.ReactNode;
  rows: Array<{
    leftControl?: React.ReactNode;
    main: React.ReactNode;
    rightControl?: React.ReactNode;
  }>;
  footer: React.ReactNode;
  footerControls?: React.ReactNode;
};

const Spacer = () => <div />;

const ControlsSection = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`h-full w-full ${className ?? ""}`}>
    <div
      className={`rounded-lg border-2 border-dotted border-blue-500 p-1 ${className ?? ""}`}
    >
      {children}
    </div>
  </div>
);

export function ActivityFrame({
  teacherModeAvailable,
  showControls: showControlsRaw,
  setShowControls,
  header,
  rows,
  footer,
  footerControls,
}: ActivityFrameProps) {
  const showControls = teacherModeAvailable && showControlsRaw;
  const wrapControlCn = (cn: string) =>
    `${cn} ${showControls ? "" : "invisible"}`;
  return (
    <div className="grid grid-cols-[repeat(3,_auto)]">
      <Spacer />
      {teacherModeAvailable ? (
        <ControlsSection className="mb-2 flex justify-center">
          <div className="my-[-4px] ml-1 mr-2 flex items-center justify-center">
            <Switch
              className="mr-2"
              size="small"
              checked={!showControls}
              onChange={(checked) => setShowControls(!checked)}
            />{" "}
            Hide teacher controls
          </div>
        </ControlsSection>
      ) : (
        <Spacer />
      )}
      <Spacer />

      <Spacer />
      <div className="flex flex-col items-center">{header}</div>
      <Spacer />

      {rows.map(({ leftControl: left, main, rightControl: right }, idx) => (
        <Fragment key={idx}>
          {left ? (
            <ControlsSection
              className={wrapControlCn(
                "mr-4 flex flex-col items-end justify-center",
              )}
            >
              {left}
            </ControlsSection>
          ) : (
            <Spacer />
          )}
          <div>{main}</div>
          {right ? (
            <ControlsSection
              className={wrapControlCn(
                "ml-4 flex flex-col items-start justify-center",
              )}
            >
              {right}
            </ControlsSection>
          ) : (
            <Spacer />
          )}
        </Fragment>
      ))}

      <Spacer />
      <div className="flex flex-col items-center">{footer}</div>
      <Spacer />

      <Spacer />
      {footerControls ? (
        <ControlsSection
          className={wrapControlCn("mt-2 flex flex-col items-center")}
        >
          {footerControls}
        </ControlsSection>
      ) : (
        <Spacer />
      )}
      <Spacer />
    </div>
  );
}
