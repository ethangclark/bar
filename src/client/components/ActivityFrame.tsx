import { Fragment } from "react";

type AvProps = {
  privileged: boolean;
  privilegedHeader: React.ReactNode;
  baseHeader: React.ReactNode;
  rows: Array<{
    studentView: React.ReactNode;
    teacherView: React.ReactNode;
  }>;
  baseFooter: React.ReactNode;
  privilegedFooter: React.ReactNode;
};

const Spacer = () => <div />;

export function ActivityFrame({
  privileged,
  privilegedHeader,
  baseHeader,
  rows,
  baseFooter,
  privilegedFooter,
}: AvProps) {
  return (
    <div className="grid grid-cols-2">
      {privileged ? <div>{privilegedHeader}</div> : <Spacer />}
      <Spacer />
      <div>{baseHeader}</div>
      <Spacer />
      {rows.map(({ studentView, teacherView }, idx) => (
        <Fragment key={idx}>
          <div>{studentView}</div>
          {privileged ? <div>{teacherView}</div> : <Spacer />}
        </Fragment>
      ))}
      <div>{baseFooter}</div>
      <Spacer />
      {privileged ? <div>{privilegedFooter}</div> : <Spacer />}
      <Spacer />
    </div>
  );
}
