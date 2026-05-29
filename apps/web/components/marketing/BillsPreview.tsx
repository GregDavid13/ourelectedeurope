// BillsPreview — a preview of the core product surface: recent bills
// with their vote breakdown. Server component.
//
// NOTE: the data below is ILLUSTRATIVE sample data. There is no bills/
// votes schema yet (see migrations 0002–0008 — users/orgs/admin only).
// When the bills data model lands, replace SAMPLE_BILLS with a query
// through lib/supabase-server.ts. Kept inline + clearly labelled so it
// is obvious this is a mock, not a live feed.
const SAMPLE_BILLS = [
  {
    ref: 'A9-0123/2026',
    title: 'EU-wide right-to-repair for consumer electronics',
    status: 'Adopted',
    forVotes: 412,
    against: 198,
    abstain: 95,
  },
  {
    ref: 'A9-0098/2026',
    title: 'Cross-border AI transparency and labelling rules',
    status: 'In committee',
    forVotes: 0,
    against: 0,
    abstain: 0,
  },
  {
    ref: 'A9-0071/2026',
    title: 'Common charger and battery standards, phase II',
    status: 'Adopted',
    forVotes: 587,
    against: 61,
    abstain: 57,
  },
]

function VoteBar({ forVotes, against, abstain }: { forVotes: number; against: number; abstain: number }) {
  const total = forVotes + against + abstain
  if (total === 0) {
    return <div className="h-2 w-full rounded-full bg-eu-blue-100" />
  }
  const pct = (n: number) => `${(n / total) * 100}%`
  return (
    <div className="flex h-2 w-full overflow-hidden rounded-full bg-eu-blue-100">
      <div className="bg-eu-blue-700" style={{ width: pct(forVotes) }} title={`For: ${forVotes}`} />
      <div className="bg-eu-gold-400" style={{ width: pct(abstain) }} title={`Abstain: ${abstain}`} />
      <div className="bg-eu-blue-300" style={{ width: pct(against) }} title={`Against: ${against}`} />
    </div>
  )
}

export function BillsPreview() {
  return (
    <section id="bills" className="scroll-mt-16 bg-eu-blue-50/60 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-eu-blue-900 sm:text-4xl">
              Recent bills &amp; how they went
            </h2>
            <p className="mt-3 max-w-xl text-eu-blue-700/80">
              A snapshot of legislation moving through the European Parliament.
            </p>
          </div>
          <span className="rounded-full bg-eu-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-eu-gold-800">
            Sample preview
          </span>
        </div>

        <div className="mt-10 space-y-4">
          {SAMPLE_BILLS.map((bill) => (
            <article
              key={bill.ref}
              className="rounded-2xl border border-eu-blue-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-eu-blue-500">{bill.ref}</span>
                  <span
                    className={
                      bill.status === 'Adopted'
                        ? 'rounded-full bg-eu-blue-700 px-2.5 py-0.5 text-xs font-medium text-white'
                        : 'rounded-full bg-eu-gold-200 px-2.5 py-0.5 text-xs font-medium text-eu-gold-900'
                    }
                  >
                    {bill.status}
                  </span>
                </div>
                {bill.forVotes + bill.against + bill.abstain > 0 && (
                  <span className="text-sm text-eu-blue-700/70">
                    {bill.forVotes} for · {bill.against} against · {bill.abstain} abstain
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-lg font-semibold text-eu-blue-900">{bill.title}</h3>
              <div className="mt-4">
                <VoteBar forVotes={bill.forVotes} against={bill.against} abstain={bill.abstain} />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-6 text-sm text-eu-blue-700/80">
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-eu-blue-700" /> For</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-eu-gold-400" /> Abstain</span>
          <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-eu-blue-300" /> Against</span>
        </div>
      </div>
    </section>
  )
}
