import type { Settings, Holding, MoneyEntry, Loan, MonthNet, PortfolioTotals, LoanTotals, HoldingCalc, RecurringTemplate } from '@/types';

export function fmtMoney(n: number, cur: string): string {
  const v = Math.round(Math.abs(n)).toLocaleString('en-US');
  return (n < 0 ? '\u2212' : '') + (cur === 'USD' ? '$' : '\u20A8') + v;
}

export function toPKR(amt: number, cur: string, usdRate: number): number {
  return cur === 'USD' ? amt * usdRate : amt;
}

export function holdingCalc(h: Holding): HoldingCalc {
  const inv = h.units * h.buyRate;
  const cur = h.curRate != null ? h.units * h.curRate : inv;
  const div = h.dividends || 0;
  const realized = (h.sales || []).reduce(
    (s, x) => s + (x.rate - h.buyRate) * x.qty,
    0,
  );
  const unrealized = cur - inv;
  return {
    inv,
    cur,
    pl: unrealized,
    plpct: inv ? (unrealized / inv) * 100 : 0,
    div,
    realized,
    totalReturn: unrealized + div + realized,
  };
}

export function portfolioTotals(holdings: Holding[]): PortfolioTotals {
  let inv = 0,
    cur = 0,
    div = 0,
    realized = 0;
  holdings.forEach((h) => {
    const c = holdingCalc(h);
    inv += c.inv;
    cur += c.cur;
    div += c.div;
    realized += c.realized;
  });
  return { inv, cur, pl: cur - inv, div, realized };
}

export function loanTotals(loans: Loan[]): LoanTotals {
  let recv = 0,
    pay = 0;
  loans.forEach((l) => {
    if (l.status === 'settled') return;
    const bal = l.amount - (l.repaid || 0);
    if (l.direction === 'given') recv += bal;
    else pay += bal;
  });
  return { recv, pay };
}

export function monthNet(mk: string, money: MoneyEntry[]): MonthNet {
  let inc = 0,
    exp = 0;
  money.forEach((m) => {
    if (m.date.slice(0, 7) !== mk) return;
    if (m.type === 'income') inc += m.amount;
    else exp += m.amount;
  });
  return { inc, exp, net: inc - exp };
}

export function templateMonthly(
  templates: RecurringTemplate[],
): { inc: number; exp: number; net: number } {
  let inc = 0,
    exp = 0;
  (templates || []).forEach((t) => {
    const p = t.amount * (t.freq === 'yearly' ? 1 / 12 : 1);
    if (t.type === 'income') inc += p;
    else exp += p;
  });
  return { inc, exp, net: inc - exp };
}
