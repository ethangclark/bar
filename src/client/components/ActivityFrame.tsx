import { Fragment } from "react";

type AvProps = {
  extended: boolean;
  extendedHeader?: React.ReactNode;
  header: React.ReactNode;
  rows: Array<{
    left?: React.ReactNode;
    main: React.ReactNode;
    right?: React.ReactNode;
  }>;
  footer: React.ReactNode;
  extendedFooter?: React.ReactNode;
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
    <div className="grid grid-cols-[repeat(3,_auto)]">
      <Spacer />
      {extended ? (
        <div className="flex flex-col items-center">{extendedHeader}</div>
      ) : (
        <Spacer />
      )}
      <Spacer />

      <Spacer />
      <div className="flex flex-col items-center">{header}</div>
      <Spacer />

      {rows.map(({ left, main, right }, idx) => (
        <Fragment key={idx}>
          {left ? (
            <div className="flex flex-col items-end">{left}</div>
          ) : (
            <Spacer />
          )}
          <div>{main}</div>
          {right ? (
            <div className="flex flex-col items-start">{right}</div>
          ) : (
            <Spacer />
          )}
        </Fragment>
      ))}

      <Spacer />
      <div className="flex flex-col items-center">{footer}</div>
      <Spacer />

      <Spacer />
      {extended ? (
        <div className="flex flex-col items-center">{extendedFooter}</div>
      ) : (
        <Spacer />
      )}
      <Spacer />
    </div>
  );
}
