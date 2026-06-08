import SancLogo from '../components/SancLogo'

export default function Report() {
  async function exportPdf() {
    try {
      const mod = await import('html2pdf.js')
      const html2pdf = mod.default || mod
      const element = document.getElementById('report-content')
      if (!element) return
      const opt = {
        margin: 0.5,
        filename: 'calibration-report.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      }
      html2pdf().set(opt).from(element).save()
    } catch (err) {
      // fallback to print if html2pdf fails
      // eslint-disable-next-line no-console
      console.error('PDF export failed', err)
      window.print()
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <SancLogo size={64} />
          <div>
            <h1 className="font-display text-3xl font-bold">Calibration Report</h1>
            <p className="text-sm text-ink-faint">A sample calibration report for printing/export</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={exportPdf}
            className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-white"
          >
            Export PDF
          </button>
        </div>
      </div>

      <article id="report-content" className="prose max-w-none bg-white p-6 rounded-md shadow-sm">
        <h2>Instrument: AC-1234</h2>
        <p>
          This is an example calibration report. Replace this content with real report data,
          attachments, charts, and measured values.
        </p>

        <h3>Summary</h3>
        <ul>
          <li>Customer: Acme Labs</li>
          <li>Calibration date: 2026-06-08</li>
          <li>Next due: 2027-06-08</li>
        </ul>

        <h3>Measurements</h3>
        <table className="w-full table-auto border-collapse">
          <thead>
            <tr>
              <th className="border px-2 py-1 text-left">Point</th>
              <th className="border px-2 py-1 text-left">Nominal</th>
              <th className="border px-2 py-1 text-left">Observed</th>
              <th className="border px-2 py-1 text-left">Uncertainty</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border px-2 py-1">1</td>
              <td className="border px-2 py-1">10.000</td>
              <td className="border px-2 py-1">9.996</td>
              <td className="border px-2 py-1">0.005</td>
            </tr>
          </tbody>
        </table>

        <h3>Notes</h3>
        <p>No adjustments were required. Certificate is issued subject to the terms and conditions.</p>
      </article>
    </div>
  )
}
