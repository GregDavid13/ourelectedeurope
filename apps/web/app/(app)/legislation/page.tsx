// Legislation — authed screen. Will list bills and their voting records
// once the bills/votes data model exists (migrations currently cover
// users/orgs/admin only). Placeholder + illustrative rows for now.
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Legislation · OurElected Europe' }

const SAMPLE = [
  { ref: 'A9-0123/2026', title: 'EU-wide right-to-repair for consumer electronics', status: 'Adopted' },
  { ref: 'A9-0098/2026', title: 'Cross-border AI transparency and labelling rules', status: 'In committee' },
  { ref: 'A9-0071/2026', title: 'Common charger and battery standards, phase II', status: 'Adopted' },
]

export default function Page() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-eu-blue-900">Legislation</h1>
        <span className="rounded-full bg-eu-gold-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-eu-gold-800">
          Sample data
        </span>
      </div>
      <p className="mt-2 text-eu-blue-700/70">
        Browse bills moving through the European Parliament and how they were voted on.
      </p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-eu-blue-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-eu-blue-50 text-xs uppercase tracking-wide text-eu-blue-600">
            <tr>
              <th className="px-5 py-3 font-semibold">Reference</th>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-eu-blue-50">
            {SAMPLE.map((bill) => (
              <tr key={bill.ref} className="hover:bg-eu-blue-50/40">
                <td className="px-5 py-4 font-mono text-xs text-eu-blue-500">{bill.ref}</td>
                <td className="px-5 py-4 font-medium text-eu-blue-900">{bill.title}</td>
                <td className="px-5 py-4">
                  <span
                    className={
                      bill.status === 'Adopted'
                        ? 'rounded-full bg-eu-blue-700 px-2.5 py-0.5 text-xs font-medium text-white'
                        : 'rounded-full bg-eu-gold-200 px-2.5 py-0.5 text-xs font-medium text-eu-gold-900'
                    }
                  >
                    {bill.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-sm text-eu-blue-700/60">
        This is placeholder content. Real bills and per-representative votes arrive with the legislation data model.
      </p>
    </div>
  )
}
