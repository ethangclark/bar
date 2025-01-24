import { Fragment } from "react";

type AvProps = {
  extended: boolean;
  extendedHeader: React.ReactNode;
  header: React.ReactNode;
  rows: Array<{
    left?: React.ReactNode;
    main: React.ReactNode;
    right?: React.ReactNode;
  }>;
  footer: React.ReactNode;
  extendedFooter: React.ReactNode;
};

const Spacer = () => <div />;

export function ActivityFrame({
  extended,
  extendedHeader,
  header,
  rows,
  footer,
  extendedFooter,
}: AvProps) {
  return (
    <div className="grid grid-cols-3">
      <Spacer />
      {extended ? <div>{extendedHeader}</div> : <Spacer />}
      <Spacer />

      <Spacer />
      <div>{header}</div>
      <Spacer />

      {rows.map(({ left, main, right }, idx) => (
        <Fragment key={idx}>
          {left ? <div>{left}</div> : <Spacer />}
          <div>{main}</div>
          {right ? <div>{right}</div> : <Spacer />}
        </Fragment>
      ))}

      <Spacer />
      <div>{footer}</div>
      <Spacer />

      <Spacer />
      {extended ? <div>{extendedFooter}</div> : <Spacer />}
      <Spacer />
    </div>
  );
}
