'use client';

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { Appbar } from '@/components/Appbar';
import { EmptyState } from '@/components/EmptyState';
import { Hash, ChevronLeft, BarChart3, Wheat, Repeat, CircleDollarSign, TrendingUp, Scale, Square, Building2, Landmark, type LucideIcon } from 'lucide-react';
import {
  calcBuySell,
  calcStorage,
  calcSip,
  calcLumpsum,
  calcCagr,
  calcBreakeven,
  calcProject,
  calcEmi,
  calcZakat,
  fmt,
  type CalcResult,
} from '@/lib/calculators';
import { portfolioTotals, loanTotals } from '@/lib/money';

interface CalcDef {
  id: string;
  cat: string;
  icon: string;
  name: string;
  desc: string;
}

const CALC_ICONS: Record<string, LucideIcon> = {
  buysell: BarChart3,
  storage: Wheat,
  sip: Repeat,
  lumpsum: CircleDollarSign,
  cagr: TrendingUp,
  breakeven: Scale,
  project: Square,
  emi: Building2,
  zakat: Landmark,
};

const CALCS: CalcDef[] = [
  { id: 'buysell', cat: 'Investing & trading', icon: 'buysell', name: 'Buy / Sell profit', desc: 'Profit or loss on a trade after commission.' },
  { id: 'storage', cat: 'Investing & trading', icon: 'storage', name: 'Commodity storage P/L', desc: 'Wheat, rice etc — profit after storage, wastage & transport.' },
  { id: 'sip', cat: 'Investing & trading', icon: 'sip', name: 'SIP with step-up', desc: 'Monthly SIP that grows a % every year.' },
  { id: 'lumpsum', cat: 'Investing & trading', icon: 'lumpsum', name: 'Lump-sum future value', desc: 'One-time investment compounded over time.' },
  { id: 'cagr', cat: 'Investing & trading', icon: 'cagr', name: 'CAGR', desc: 'Annualized return between two values.' },
  { id: 'breakeven', cat: 'Investing & trading', icon: 'breakeven', name: 'Break-even price', desc: 'Sell price needed to cover cost + fees.' },
  { id: 'project', cat: 'Freelance & business', icon: 'project', name: 'Project margin', desc: 'Take-home after outsourcing & platform fees.' },
  { id: 'emi', cat: 'Money basics', icon: 'emi', name: 'Loan / EMI', desc: 'Monthly installment and total interest.' },
  { id: 'zakat', cat: 'Money basics', icon: 'zakat', name: 'Zakat', desc: '2.5% on net zakatable wealth — pulls your live data.' },
];

interface Field {
  label: string;
  id: string;
  ph: string;
  step?: string;
}

const FIELDS: Record<string, Field[]> = {
  buysell: [
    { label: 'Buy rate / unit', id: 'c_br', ph: '150' },
    { label: 'Quantity', id: 'c_qty', ph: '100' },
    { label: 'Sell rate / unit', id: 'c_sr', ph: '175' },
    { label: 'Commission / fees % (each side)', id: 'c_fee', ph: '0.15' },
  ],
  storage: [
    { label: 'Buy price / unit', id: 's_bp', ph: 'per 40kg / bag' },
    { label: 'Quantity (units)', id: 's_qty', ph: '100' },
    { label: 'Sell price / unit', id: 's_sp', ph: '' },
    { label: 'Storage cost / unit / month', id: 's_store', ph: 'e.g. 15' },
    { label: 'Months stored', id: 's_mo', ph: '6' },
    { label: 'Wastage / spoilage %', id: 's_waste', ph: '2' },
    { label: 'Transport / handling (total)', id: 's_trans', ph: 'optional' },
  ],
  sip: [
    { label: 'Monthly investment', id: 'sip_amt', ph: '5000' },
    { label: 'Annual step-up %', id: 'sip_step', ph: '10' },
    { label: 'Expected annual return %', id: 'sip_ret', ph: '15' },
    { label: 'Years', id: 'sip_yr', ph: '10' },
  ],
  lumpsum: [
    { label: 'Amount invested', id: 'ls_amt', ph: '100000' },
    { label: 'Expected annual return %', id: 'ls_ret', ph: '15' },
    { label: 'Years', id: 'ls_yr', ph: '10' },
    { label: 'Compounds / year', id: 'ls_comp', ph: '1' },
  ],
  cagr: [
    { label: 'Starting value', id: 'cg_s', ph: '100000' },
    { label: 'Ending value', id: 'cg_e', ph: '180000' },
    { label: 'Years held', id: 'cg_y', ph: '3' },
  ],
  breakeven: [
    { label: 'Buy rate / unit', id: 'be_br', ph: '150' },
    { label: 'Quantity', id: 'be_qty', ph: '100' },
    { label: 'Total fees / costs', id: 'be_fee', ph: 'commission, tax…' },
  ],
  project: [
    { label: 'Project price', id: 'pj_price', ph: '50000' },
    { label: 'Outsource / contractor cost', id: 'pj_out', ph: '0' },
    { label: 'Platform fee % (Upwork 10)', id: 'pj_fee', ph: '10' },
    { label: 'Other costs', id: 'pj_other', ph: 'tools, etc' },
  ],
  emi: [
    { label: 'Loan amount (principal)', id: 'em_p', ph: '150000' },
    { label: 'Annual interest rate %', id: 'em_r', ph: '20' },
    { label: 'Tenure (months)', id: 'em_n', ph: '12' },
  ],
  zakat: [
    { label: 'Cash & bank', id: 'zk_cash', ph: '' },
    { label: 'Gold / silver value', id: 'zk_gold', ph: '' },
    { label: 'Investments (portfolio value)', id: 'zk_inv', ph: '' },
    { label: 'Money owed to you (receivable)', id: 'zk_recv', ph: '' },
    { label: 'Business stock / inventory', id: 'zk_stock', ph: '' },
    { label: 'Debts you owe (payable)', id: 'zk_debt', ph: '' },
  ],
};

const SIP_SCHED_EXTRA = (yearly: Array<{ year: number; monthlyAmt: number; invested: number; balance: number }>) =>
  '<div class="calc-schedule"><table><thead><tr><th>Year</th><th>Monthly</th><th>Invested</th><th>Value</th></tr></thead><tbody>' +
  yearly.map((r) => `<tr><td>${r.year}</td><td>${fmt(r.monthlyAmt)}</td><td>${fmt(r.invested)}</td><td>${fmt(r.balance)}</td></tr>`).join('') +
  '</tbody></table></div>';

export default function CalcPage() {
  const holdings = useStore((s) => s.holdings);
  const money = useStore((s) => s.money);
  const loans = useStore((s) => s.loans);

  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});

  const filtered = search
    ? CALCS.filter((c) =>
        [c.name, c.desc, c.cat].some((f) =>
          f.toLowerCase().includes(search.toLowerCase()),
        ),
      )
    : CALCS;

  const cats = [...new Set(filtered.map((c) => c.cat))];

  function setVal(id: string, v: string) {
    setInputs((prev) => ({ ...prev, [id]: v }));
  }

  function num(id: string): number {
    return parseFloat(inputs[id] || '0') || 0;
  }

  function openCalc(id: string) {
    if (id === 'zakat') {
      const pf = portfolioTotals(holdings);
      const lt = loanTotals(loans);
      let cashGuess = 0;
      money.forEach((m) => {
        cashGuess += m.type === 'income' ? m.amount : -m.amount;
      });
      setInputs({
        zk_cash: String(Math.max(0, Math.round(cashGuess))),
        zk_inv: String(Math.round(pf.cur)),
        zk_recv: String(Math.round(lt.recv)),
        zk_debt: String(Math.round(lt.pay)),
        zk_gold: '',
        zk_stock: '',
      });
    } else {
      setInputs({});
    }
    setOpenId(id);
  }

  const res = useMemo((): CalcResult | null => {
    if (!openId) return null;
    switch (openId) {
      case 'buysell':
        return calcBuySell({ buyRate: num('c_br'), quantity: num('c_qty'), sellRate: num('c_sr'), feePct: num('c_fee') });
      case 'storage':
        return calcStorage({ buyPrice: num('s_bp'), quantity: num('s_qty'), sellPrice: num('s_sp'), storageCostPerUnit: num('s_store'), monthsStored: num('s_mo'), wastagePct: num('s_waste'), transport: num('s_trans') });
      case 'sip': {
        const r = calcSip({ monthly: num('sip_amt'), annualStepUpPct: num('sip_step'), annualReturnPct: num('sip_ret'), years: num('sip_yr') });
        return { ...r, extra: SIP_SCHED_EXTRA(r.yearly) };
      }
      case 'lumpsum':
        return calcLumpsum({ amount: num('ls_amt'), annualReturnPct: num('ls_ret'), years: num('ls_yr'), compoundsPerYear: num('ls_comp') || 1 });
      case 'cagr':
        return calcCagr({ start: num('cg_s'), end: num('cg_e'), years: num('cg_y') });
      case 'breakeven':
        return calcBreakeven({ buyRate: num('be_br'), quantity: num('be_qty'), fees: num('be_fee') });
      case 'project':
        return calcProject({ price: num('pj_price'), outsourceCost: num('pj_out'), platformFeePct: num('pj_fee'), otherCosts: num('pj_other') });
      case 'emi':
        return calcEmi({ principal: num('em_p'), annualRatePct: num('em_r'), tenureMonths: num('em_n') });
      case 'zakat':
        return calcZakat({
          cash: num('zk_cash'),
          goldSilver: num('zk_gold'),
          investments: num('zk_inv'),
          receivable: num('zk_recv'),
          stock: num('zk_stock'),
          debts: num('zk_debt'),
        });
      default:
        return null;
    }
  }, [openId, inputs, holdings, money, loans]);

  if (openId) {
    const calc = CALCS.find((c) => c.id === openId)!;
    const fields = FIELDS[openId] || [];
    return (
      <>
        <Appbar />
        <section className="view on" style={{ display: 'block' }}>
          <button className="calc-back" onClick={() => setOpenId(null)}>
            <ChevronLeft size={16} /> All calculators
          </button>
          <div className="calc-wrap">
            <div className="calc-inputs">
              <h3>
                {(() => { const Ic = CALC_ICONS[calc.icon]; return Ic ? <Ic size={18} strokeWidth={1.8} /> : null; })()} {calc.name}
              </h3>
              <p className="sub">{calc.desc}</p>
              {fields.map((f) => (
                <div className="fld" key={f.id}>
                  <label>{f.label}</label>
                  <input
                    type="number"
                    step={f.step || 'any'}
                    value={inputs[f.id] || ''}
                    placeholder={f.ph}
                    onChange={(e) => setVal(f.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
            <div>
              {res && (
                <div className="calc-out">
                  <h4>Result</h4>
                  <div className="calc-hero">
                    <div className="chl">{res.hero[0]}</div>
                    <div className={`chv${res.hero[2] ? ' ' + res.hero[2] : ''}`}>
                      {res.hero[3]}
                    </div>
                  </div>
                  <div className="calc-rows">
                    {res.rows.map((r, i) => (
                      <div className="calc-r" key={i}>
                        <span className="k">{r[0]}</span>
                        <span className="v">{r[1]}</span>
                      </div>
                    ))}
                  </div>
                  {res.note && <div className="calc-note">{res.note}</div>}
                </div>
              )}
              {res?.extra && (
                <div dangerouslySetInnerHTML={{ __html: res.extra }} />
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Appbar />
      <section className="view on" style={{ display: 'block' }}>
        <div className="view-head">
          <div>
            <span className="eyebrow">Utilities</span>
            <h1 className="h-view">Calculators</h1>
            <p className="sub">Quick math for money, trades and projects</p>
          </div>
        </div>

        <div className="proj-controls">
          <input
            type="text"
            className="searchbar"
            placeholder="Search calculators…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={Hash} label="no match" message="No calculator matches your search." />
        ) : (
          cats.map((cat) => (
            <div key={cat}>
              <div className="calc-cat">{cat}</div>
              <div className="calc-grid">
                {filtered
                  .filter((c) => c.cat === cat)
                  .map((c) => (
                    <button
                      key={c.id}
                      className="calc-tile"
                      onClick={() => openCalc(c.id)}
                    >
                      <div className="ci">{(() => { const Ic = CALC_ICONS[c.icon]; return Ic ? <Ic size={20} strokeWidth={1.8} /> : null; })()}</div>
                      <div className="cn">{c.name}</div>
                      <div className="cdesc">{c.desc}</div>
                    </button>
                  ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
