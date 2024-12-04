const maxPct = 100;
const toPct = (numerator: number, denominator: number) =>
  Math.floor((numerator / denominator) * maxPct);
export function TitleWithPct({
  title,
  completed,
  total,
}: {
  title: string;
  completed: number;
  total: number;
}) {
  const pct = toPct(completed, total);
  return (
    <>
      {title} - {pct}% {pct === maxPct ? "✅" : ""}
    </>
  );
}
