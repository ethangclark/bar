import { Button, Switch } from "antd";
import { Fragment } from "react";
import { invoke } from "~/common/fnUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { storeObserver } from "../utils/storeObserver";
import {
  type EnrollmentType,
  isGraderOrDeveloper,
} from "~/common/enrollmentTypeUtils";

const Spacer = () => <div />;

export const ControlsSection = ({
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

type ActivityFrameProps = {
  activityStatus: ActivityStatus;
  enrolledAs: EnrollmentType[];
  showControls: boolean;
  setShowControls: (show: boolean) => void;
  header: React.ReactNode;
  rows: Array<{
    leftControl?: React.ReactNode;
    main: React.ReactNode;
    rightControl?: React.ReactNode;
  }>;
  footer?: React.ReactNode;
  footerControls?: React.ReactNode;
};

export const ActivityFrame = storeObserver<ActivityFrameProps>(
  function ActivityFrame({
    activityStatus,
    enrolledAs,
    showControls: showControlsRaw,
    setShowControls,
    header,
    rows,
    footer,
    footerControls,
    activityEditorStore,
  }) {
    const igod = isGraderOrDeveloper(enrolledAs);
    const showControls = igod && showControlsRaw;
    const wrapControlCn = (cn: string) =>
      `${cn} ${showControls ? "" : "invisible"}`;
    return (
      <div className="grid grid-cols-[repeat(3,_auto)]">
        <Spacer />
        {igod ? (
          <ControlsSection className="mb-2 flex items-center justify-center px-3 py-2">
            <div className="my-[-4px] flex items-center">
              <Switch
                className="mr-2"
                size="small"
                checked={!showControls}
                onChange={(checked) => setShowControls(!checked)}
              />{" "}
              Show student content only
            </div>
            <span className="mx-3 mt-[-3px] text-2xl text-gray-200">|</span>
            <Button
              className="m-1"
              type="primary"
              disabled={activityEditorStore.canSave === false}
              onClick={() => activityEditorStore.save()}
            >
              {invoke((): string => {
                switch (activityStatus) {
                  case "draft":
                    return "Save";
                  case "published":
                    return "Publish";
                }
              })}
            </Button>
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
                className={wrapControlCn("mr-4 flex flex-col items-end")}
              >
                {left}
              </ControlsSection>
            ) : (
              <Spacer />
            )}
            <div>{main}</div>
            {right ? (
              <ControlsSection
                className={wrapControlCn("ml-4 flex flex-col items-start")}
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
  },
);
