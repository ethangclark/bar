const maxPct = 100;
const toPct = (numerator: number, denominator: number) => {
  const raw = numerator / denominator;
  if (raw === 0) {
    return "0";
  }
  if (raw < 1 / maxPct) {
    return (Math.floor((numerator / denominator) * maxPct * 10) / 10).toFixed(
      1,
    );
  }
  return Math.floor((numerator / denominator) * maxPct).toFixed(0);
};
const completePct = toPct(1, 1);
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
      {title} - {pct}% {pct === completePct ? "✅" : ""}
    </>
  );
}
