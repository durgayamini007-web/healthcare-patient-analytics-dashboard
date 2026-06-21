export const fmtNum = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n));
export const fmtMoney = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(1)}K`
      : `$${Math.round(n)}`;
export const fmtPct = (n: number, digits = 1) => `${n.toFixed(digits)}%`;