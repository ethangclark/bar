import { Button, Switch } from "antd";
import { Fragment } from "react";
import {
  type EnrollmentType,
  isGraderOrDeveloper,
} from "~/common/enrollmentTypeUtils";
import { invoke } from "~/common/fnUtils";
import { type ActivityStatus } from "~/server/db/schema";
import { storeObserver } from "../utils/storeObserver";
import { FullFramedTeacherSection } from "./TeacherSection";

const Spacer = () => <div />;

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

const Separator = () => (
  <span className="mx-3 mt-[-3px] text-2xl text-gray-200">|</span>
);

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
    studentModeStore,
  }) {
    const igod = isGraderOrDeveloper(enrolledAs);
    const showControls = igod && showControlsRaw;
    const wrapControlCn = (cn: string) =>
      `${cn} ${showControls ? "" : "invisible"}`;
    return (
      <div className="grid grid-cols-[repeat(3,_auto)]">
        <Spacer />
        {igod ? (
          <FullFramedTeacherSection innerClassName="mb-4 flex items-center justify-center py-2">
            <Button
              className="m-1"
              type="primary"
              onClick={() => studentModeStore.setIsStudentMode(true)}
              disabled={activityEditorStore.canSave}
            >
              See demo
            </Button>
            <Separator />
            <div className="my-[-4px] flex items-center">
              <Switch
                className="mr-2"
                size="small"
                checked={!showControls}
                onChange={(checked) => setShowControls(!checked)}
              />{" "}
              Show student content only
            </div>
            <Separator />
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
          </FullFramedTeacherSection>
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
              <FullFramedTeacherSection
                className={wrapControlCn("mr-4 flex flex-col items-end")}
              >
                {left}
              </FullFramedTeacherSection>
            ) : (
              <Spacer />
            )}
            <div>{main}</div>
            {right ? (
              <FullFramedTeacherSection
                className={wrapControlCn("ml-4 flex flex-col items-start")}
              >
                {right}
              </FullFramedTeacherSection>
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
          <FullFramedTeacherSection
            className={wrapControlCn("mt-2 flex flex-col items-center")}
          >
            {footerControls}
          </FullFramedTeacherSection>
        ) : (
          <Spacer />
        )}
        <Spacer />
      </div>
    );
  },
);
