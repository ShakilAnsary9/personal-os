import Link from "next/link";

const FEATURES = [
  {
    pro: false,
    name: "Today",
    desc: "Your day on one screen — clock, greeting, task list and habit stamps, with a progress bar that fills as you clear things.",
    status: "free",
  },
  {
    pro: false,
    name: "Tasks",
    desc: "List or calendar view, recurring tasks on any schedule, due dates and direct links to the project they belong to.",
    status: "free",
  },
  {
    pro: false,
    name: "Habits",
    desc: "Daily stamp tiles and streaks — built to feel like marking off a paper habit tracker, not a checkbox in a form.",
    status: "free",
  },
  {
    pro: true,
    name: "Content",
    desc: "A pipeline board for what you're making — platform tags, Idea → Published stages, and a thumbnail brief generator.",
    status: "pro",
  },
  {
    pro: true,
    name: "Projects",
    desc: "Track freelance and build work — price, outsourced cost, who's assigned, status, and profit calculated as you go.",
    status: "pro",
  },
  {
    pro: true,
    name: "Money",
    desc: "An income and expense ledger with recurring templates, multi-currency, and holdings, SIPs and Zakat for your portfolio.",
    status: "pro",
  },
  {
    pro: true,
    name: "Notes",
    desc: "Color-coded, pinnable, searchable — for the things that don't belong in a task or a ledger row.",
    status: "pro",
  },
  {
    pro: true,
    name: "Reminders",
    desc: "Repeatable reminders on a daily, weekly, monthly or yearly cadence, so nothing depends on you remembering.",
    status: "pro",
  },
  {
    pro: false,
    name: "Calculators",
    desc: "Nine calculators for the decisions that come up constantly — from EMI and CAGR to project margin and Zakat.",
    status: "free",
  },
  {
    pro: false,
    name: "Review & Archive",
    desc: "A weekly review you actually fill in, and an archive for finished projects instead of a graveyard in your task list.",
    status: "free",
  },
];

export default function LandingPage() {
  return (
    <div className="lp">
      <nav className="lp-nav">
        <div className="lp-wrap">
          <div className="lp-brand">
            <div className="lp-brand-mark">P</div>
            <div className="lp-brand-name">
              Personal OS<span className="lp-sub">daily cockpit</span>
            </div>
          </div>
          <div className="lp-nav-links">
            <a href="#ledger">Everything inside</a>
            <a href="#spotlights">How it works</a>
            <a href="#pricing">Pricing</a>
          </div>
          <div className="lp-nav-cta">
            <Link className="lp-nav-login" href="/login">
              Log in
            </Link>
            <Link className="lp-btn lp-btn-primary" href="/signup">
              Start free
            </Link>
          </div>
        </div>
      </nav>

      <header className="lp-hero">
        <div className="lp-wrap">
          <div className="lp-hero-copy">
            <div className="lp-hero-tag">
              <span className="lp-dot" /> offline-first, syncs when
              you&apos;re ready
            </div>
            <h1>
              One page for tasks, habits, money and everything you&apos;re
              building.
            </h1>
            <p className="lp-lede">
              Personal OS replaces the six apps you check every morning with
              one. Your day, your ledger and your pipeline, laid out like a
              page you actually want to open.
            </p>
            <div className="lp-hero-actions">
              <Link className="lp-btn lp-btn-primary" href="/signup">
                Start free
              </Link>
              <Link
                className="lp-btn lp-btn-ghost"
                href="#spotlights"
                style={{ borderColor: "var(--lp-rule)" }}
              >
                See how it works
              </Link>
            </div>
            <div className="lp-hero-note" style={{ marginTop: 18 }}>
              No card required · 8 tools unlocked on the free plan
            </div>
          </div>

          <div className="lp-mock">
            <div className="lp-mock-pin">today, 7:41am</div>
            <div className="lp-mock-card">
              <div className="lp-mock-top">
                <div className="lp-mock-greet">Good morning, Ahsan</div>
                <div className="lp-mock-clock lp-mono">07:41</div>
              </div>
              <div className="lp-mock-progress">
                <i />
              </div>
              <div className="lp-mock-tasks">
                <div className="lp-mock-task lp-strike">
                  <div className="lp-mock-check lp-done" /> Ship client
                  thumbnail set
                </div>
                <div className="lp-mock-task lp-strike">
                  <div className="lp-mock-check lp-done" /> Reconcile October
                  ledger
                </div>
                <div className="lp-mock-task">
                  <div className="lp-mock-check" /> Record voiceover — Ep. 14
                </div>
                <div className="lp-mock-task">
                  <div className="lp-mock-check" /> Review SIP contribution
                </div>
              </div>
              <div className="lp-mock-habits">
                <div className="lp-mock-stamp lp-on">✓</div>
                <div className="lp-mock-stamp lp-on">✓</div>
                <div className="lp-mock-stamp">·</div>
                <div className="lp-mock-stamp">·</div>
                <div className="lp-mock-stamp lp-on">✓</div>
              </div>
              <div className="lp-mock-kpis">
                <div className="lp-mock-kpi">
                  <div className="lp-label">MONTHLY NET</div>
                  <div className="lp-value lp-pos lp-mono">+$320</div>
                </div>
                <div className="lp-mock-kpi">
                  <div className="lp-label">PORTFOLIO</div>
                  <div className="lp-value lp-mono">$4,460</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="lp-section" id="ledger">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2>
              Twelve tools. One store. Everything talks to everything.
            </h2>
            <p>
              Each panel writes to the same store, so a task linked to a
              project shows up in your money ledger without you touching a
              spreadsheet.
            </p>
          </div>

          <div className="lp-ledger">
            {FEATURES.map((f) => (
              <div
                key={f.name}
                className={`lp-ledger-row${f.pro ? " lp-pro" : ""}`}
              >
                <div className="lp-ledger-mark" />
                <div className="lp-ledger-name">{f.name}</div>
                <div className="lp-ledger-desc">{f.desc}</div>
                <div className="lp-ledger-status">{f.status}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section" id="spotlights">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2>
              Built around the three things that actually run your week.
            </h2>
            <p>
              Not another card grid — real panels, doing real arithmetic, the
              way you&apos;d keep them on paper.
            </p>
          </div>

          <div className="lp-spot-grid">
            <div className="lp-spot">
              <div className="lp-spot-icon lp-mono">$</div>
              <h3>Money, in full</h3>
              <p>
                Log income and expenses as they happen, set up recurring
                entries for rent and subscriptions, and track your portfolio,
                loans and Zakat in one place.
              </p>
              <div className="lp-spot-preview">
                <div className="lp-money-row">
                  <span>Client payment</span>
                  <span className="lp-pos">+$164</span>
                </div>
                <div className="lp-money-row">
                  <span>Adobe CC (recurring)</span>
                  <span className="lp-neg">−$54.99</span>
                </div>
                <div className="lp-money-row">
                  <span>SIP — index fund</span>
                  <span className="lp-neg">−$43</span>
                </div>
              </div>
            </div>

            <div className="lp-spot">
              <div className="lp-spot-icon lp-mono">▤</div>
              <h3>A pipeline for what you publish</h3>
              <p>
                Every video, post or edit moves through the same stages,
                tagged by platform, so you always know what&apos;s actually
                shipping this week.
              </p>
              <div className="lp-spot-preview">
                <div className="lp-pipe-track">
                  <div className="lp-pipe-stage">
                    <span>💡</span>Idea
                  </div>
                  <div className="lp-pipe-stage lp-active">
                    <span>✎</span>Draft
                  </div>
                  <div className="lp-pipe-stage">
                    <span>▶</span>Live
                  </div>
                </div>
              </div>
            </div>

            <div className="lp-spot">
              <div className="lp-spot-icon lp-mono">÷</div>
              <h3>Nine calculators, one place</h3>
              <p>
                The math you&apos;d otherwise reopen a spreadsheet for —
                buy/sell spreads, SIP growth, breakeven, EMI and Zakat — built
                into the app itself.
              </p>
              <div className="lp-spot-preview lp-calc-tags">
                <span>EMI</span>
                <span>CAGR</span>
                <span>Zakat</span>
                <span>SIP</span>
                <span>Breakeven</span>
                <span>Lump sum</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section" id="pricing">
        <div className="lp-wrap">
          <div className="lp-section-head">
            <h2>Start with the essentials. Upgrade when work does.</h2>
            <p>
              Pro is one price, no tiers to compare — it unlocks the tools
              that track money and client work.
            </p>
          </div>

          <div className="lp-pricing-grid">
            <div className="lp-plan">
              <div className="lp-plan-name lp-mono">FREE</div>
              <div className="lp-plan-price">
                $0<span>/month</span>
              </div>
              <div className="lp-plan-desc">
                For running your day and your calendar.
              </div>
              <ul className="lp-plan-list">
                <li>Dashboard &amp; Today</li>
                <li>Tasks, with recurring schedules</li>
                <li>Habits &amp; streaks</li>
                <li>All nine calculators</li>
                <li>Weekly review &amp; archive</li>
                <li>Secure account sync</li>
              </ul>
              <Link
                className="lp-btn lp-btn-ghost"
                href="/signup"
                style={{ borderColor: "var(--lp-ink)" }}
              >
                Create free account
              </Link>
            </div>

            <div className="lp-plan lp-pro">
              <div className="lp-plan-name lp-mono">PRO</div>
              <div className="lp-plan-price">
                $5<span>/month</span>
              </div>
              <div className="lp-plan-desc">
                For anyone tracking money, clients or content.
              </div>
              <ul className="lp-plan-list">
                <li>Everything in Free</li>
                <li>Money — ledger, multi-currency, recurring</li>
                <li>Investments, loans &amp; Zakat</li>
                <li>Content pipeline &amp; thumbnail briefs</li>
                <li>Projects with profit tracking</li>
                <li>Notes &amp; reminders</li>
              </ul>
              <Link className="lp-btn lp-btn-primary" href="/signup">
                Start 14-day free trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-cta-band">
        <div className="lp-wrap">
          <h2>
            Your day is scattered across six apps. It doesn&apos;t have to be.
          </h2>
          <p>Set it up in a few minutes and start free.</p>
          <Link className="lp-btn lp-btn-primary" href="/signup">
            Start free
          </Link>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-sig">
            Personal OS — built by Ahsan Danish
          </div>
          <div className="lp-footer-links">
            <a href="#ledger">Everything inside</a>
            <a href="#pricing">Pricing</a>
            <Link href="/login">Log in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
