// FeatureGrid — three-up "how it works" section. Server component.
const features = [
  {
    icon: '📜',
    title: 'Track every bill',
    body:
      'Follow legislation through each stage — from first proposal to the final roll-call vote — with plain-language summaries of what each one actually does.',
  },
  {
    icon: '🗳️',
    title: 'Follow your representatives',
    body:
      'Pick the politicians who represent you and see their complete voting record: how often they show up, and which way they vote when they do.',
  },
  {
    icon: '⚖️',
    title: 'Compare and hold to account',
    body:
      'Compare votes across parties and countries, spot where representatives broke from their group, and judge them on the record — not the rhetoric.',
  },
]

export function FeatureGrid() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-eu-blue-900 sm:text-4xl">
            Politics you can actually follow
          </h2>
          <p className="mt-4 text-lg text-eu-blue-700/80">
            No jargon, no spin — just the bills and the votes, laid out clearly.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-eu-blue-100 bg-eu-blue-50/40 p-8 transition-shadow hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-eu-gold-400 text-2xl">
                <span aria-hidden>{f.icon}</span>
              </div>
              <h3 className="mt-5 text-xl font-semibold text-eu-blue-900">{f.title}</h3>
              <p className="mt-3 text-eu-blue-700/80">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
