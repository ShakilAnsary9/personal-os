export interface CalcResult {
  hero: [string, number, string, string];
  rows: [string, string][];
  note?: string;
  extra?: string;
}

export interface BuySellInput {
  buyRate: number;
  quantity: number;
  sellRate: number;
  feePct: number;
}

export function calcBuySell(i: BuySellInput): CalcResult {
  const cost = i.buyRate * i.quantity;
  const gross = i.sellRate * i.quantity;
  const fee = i.feePct / 100;
  const buyFee = cost * fee;
  const sellFee = gross * fee;
  const net = gross - cost - buyFee - sellFee;
  const pct = cost ? (net / cost) * 100 : 0;
  const perUnit = i.quantity ? net / i.quantity : 0;
  return {
    hero: ["Net profit / loss", net, net >= 0 ? "pos" : "neg", fmt(net)],
    rows: [
      ["Invested", fmt(cost)],
      ["Gross on sale", fmt(gross)],
      ["Buy + sell fees", fmt(buyFee + sellFee)],
      ["Return %", `${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%`],
      ["Per-unit margin", fmt(perUnit)],
    ],
    note: "Fees applied on both buy and sell. Adjust the % to match your broker.",
  };
}

export interface StorageInput {
  buyPrice: number;
  quantity: number;
  sellPrice: number;
  storageCostPerUnit: number;
  monthsStored: number;
  wastagePct: number;
  transport: number;
}

export function calcStorage(i: StorageInput): CalcResult {
  const invest = i.buyPrice * i.quantity;
  const storeCost = i.storageCostPerUnit * i.quantity * i.monthsStored;
  const waste = i.wastagePct / 100;
  const sellQty = i.quantity * (1 - waste);
  const gross = i.sellPrice * sellQty;
  const wasteLoss = invest * waste;
  const net = gross - invest - storeCost - i.transport;
  const pct = invest ? (net / invest) * 100 : 0;
  const monthlyPct = i.monthsStored ? pct / i.monthsStored : 0;
  const bePrice = sellQty ? (invest + storeCost + i.transport) / sellQty : 0;
  return {
    hero: ["Net profit / loss", net, net >= 0 ? "pos" : "neg", fmt(net)],
    rows: [
      ["Invested", fmt(invest)],
      [`Storage (${i.monthsStored} mo)`, fmt(storeCost)],
      [`Wastage loss (~${(waste * 100).toFixed(0)}%)`, fmt(wasteLoss)],
      ["Sellable qty", `${sellQty.toFixed(1)} units`],
      ["Gross on sale", fmt(gross)],
      ["Total return %", `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`],
      ["Return / month", `${monthlyPct >= 0 ? "+" : ""}${monthlyPct.toFixed(2)}%`],
      ["Break-even sell price", `${fmt(bePrice)} / unit`],
    ],
    note: "Carrying costs (storage + spoilage + transport) are what most people forget. Break-even price is what you must clear per unit just to cover everything.",
  };
}

export interface SipInput {
  monthly: number;
  annualStepUpPct: number;
  annualReturnPct: number;
  years: number;
}

export interface SipYearRow {
  year: number;
  monthlyAmt: number;
  invested: number;
  balance: number;
}

export function calcSip(i: SipInput): CalcResult & { yearly: SipYearRow[] } {
  const step = i.annualStepUpPct / 100;
  const ret = i.annualReturnPct / 100;
  const yr = Math.min(60, Math.max(0, Math.round(i.years)));
  const rM = ret / 12;
  let amt = i.monthly;
  let bal = 0;
  let invested = 0;
  const yearly: SipYearRow[] = [];
  for (let y = 0; y < yr; y++) {
    for (let m = 0; m < 12; m++) {
      bal = bal * (1 + rM) + amt;
      invested += amt;
    }
    yearly.push({
      year: y + 1,
      monthlyAmt: Math.round(amt),
      invested: Math.round(invested),
      balance: Math.round(bal),
    });
    amt = amt * (1 + step);
  }
  const gains = bal - invested;
  const finalMonthly = amt / (1 + step);
  return {
    hero: ["Future value", bal, "pos", fmt(bal)],
    rows: [
      ["Total invested", fmt(invested)],
      ["Wealth gained", fmt(gains)],
      ["Growth multiple", invested ? `${(bal / invested).toFixed(2)}×` : "—"],
      ["Final monthly SIP", fmt(finalMonthly)],
    ],
    note: "Compounded monthly. Step-up raises your monthly amount at the start of each year — a realistic way to invest as income grows.",
    yearly,
  };
}

export interface LumpsumInput {
  amount: number;
  annualReturnPct: number;
  years: number;
  compoundsPerYear: number;
}

export function calcLumpsum(i: LumpsumInput): CalcResult {
  const r = i.annualReturnPct / 100;
  const n = Math.max(1, i.compoundsPerYear);
  const fv = i.amount * Math.pow(1 + r / n, n * i.years);
  const g = fv - i.amount;
  return {
    hero: ["Future value", fv, "pos", fmt(fv)],
    rows: [
      ["Invested", fmt(i.amount)],
      ["Gains", fmt(g)],
      ["Multiple", i.amount ? `${(fv / i.amount).toFixed(2)}×` : "—"],
      ["Effective total return", i.amount ? `${((g / i.amount) * 100).toFixed(0)}%` : "—"],
    ],
    note: "Set compounds/year to 1 for annual (typical for PSX), 12 for monthly.",
  };
}

export interface CagrInput {
  start: number;
  end: number;
  years: number;
}

export function calcCagr(i: CagrInput): CalcResult {
  const cagr = i.start > 0 && i.years > 0 ? (Math.pow(i.end / i.start, 1 / i.years) - 1) * 100 : 0;
  const tot = i.start ? ((i.end - i.start) / i.start) * 100 : 0;
  return {
    hero: ["CAGR", cagr, cagr >= 0 ? "pos" : "neg", `${cagr >= 0 ? "+" : ""}${cagr.toFixed(2)}%`],
    rows: [
      ["Total return", `${tot >= 0 ? "+" : ""}${tot.toFixed(1)}%`],
      ["Absolute gain", fmt(i.end - i.start)],
      ["Multiple", i.start ? `${(i.end / i.start).toFixed(2)}×` : "—"],
    ],
    note: "CAGR is the smoothed yearly rate — the fair way to compare PSX vs crypto vs a stored-grain deal.",
  };
}

export interface BreakevenInput {
  buyRate: number;
  quantity: number;
  fees: number;
}

export function calcBreakeven(i: BreakevenInput): CalcResult {
  const cost = i.buyRate * i.quantity + i.fees;
  const be = i.quantity ? cost / i.quantity : 0;
  return {
    hero: ["Break-even price", be, "", `${fmt(be)} / unit`],
    rows: [
      ["Total cost", fmt(cost)],
      ["At break-even you get back", fmt(cost)],
      ["Any price above", "= profit"],
    ],
    note: "Sell above this per-unit price to be in profit after all costs.",
  };
}

export interface ProjectInput {
  price: number;
  outsourceCost: number;
  platformFeePct: number;
  otherCosts: number;
}

export function calcProject(i: ProjectInput): CalcResult {
  const fee = i.platformFeePct / 100;
  const platformFee = i.price * fee;
  const take = i.price - platformFee - i.outsourceCost - i.otherCosts;
  const margin = i.price ? (take / i.price) * 100 : 0;
  return {
    hero: ["Your take-home", take, take >= 0 ? "pos" : "neg", fmt(take)],
    rows: [
      ["Project price", fmt(i.price)],
      ["Platform fee", fmt(platformFee)],
      ["Outsource cost", fmt(i.outsourceCost)],
      ["Other costs", fmt(i.otherCosts)],
      ["Margin", `${margin.toFixed(1)}%`],
    ],
    note: "Margin is take-home ÷ price. Under ~40% on outsourced work usually means the price is too low.",
  };
}

export interface EmiInput {
  principal: number;
  annualRatePct: number;
  tenureMonths: number;
}

export function calcEmi(i: EmiInput): CalcResult {
  const r = i.annualRatePct / 100 / 12;
  const n = Math.max(1, Math.round(i.tenureMonths));
  let emi: number;
  if (r === 0) {
    emi = i.principal / n;
  } else {
    emi = (i.principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }
  const total = emi * n;
  const interest = total - i.principal;
  return {
    hero: ["Monthly installment", emi, "", fmt(emi)],
    rows: [
      ["Principal", fmt(i.principal)],
      ["Total interest", fmt(interest)],
      ["Total payable", fmt(total)],
      ["Interest as % of loan", i.principal ? `${((interest / i.principal) * 100).toFixed(1)}%` : "—"],
    ],
    note: "Standard reducing-balance EMI. Set rate to 0 for interest-free installments.",
  };
}

export interface ZakatInput {
  cash: number;
  goldSilver: number;
  investments: number;
  receivable: number;
  stock: number;
  debts: number;
}

export function calcZakat(i: ZakatInput): CalcResult {
  const assets = i.cash + i.goldSilver + i.investments + i.receivable + i.stock;
  const net = Math.max(0, assets - i.debts);
  const zakat = net * 0.025;
  return {
    hero: ["Zakat due (2.5%)", zakat, "", fmt(zakat)],
    rows: [
      ["Total assets", fmt(assets)],
      ["Less debts", fmt(i.debts)],
      ["Net zakatable wealth", fmt(net)],
      ["Rate", "2.5%"],
    ],
    note: "Pre-filled from your holdings, cash guess and loans. Adjust to your actual position, and confirm nisab & rules for your situation. Not religious advice.",
  };
}

export function fmt(v: number): string {
  return `PKR ${Math.round(v).toLocaleString("en-PK")}`;
}
