import SancLogo from '../components/SancLogo'
import mockReports from '../data/mockReports'
import { buildPdfContainerHtml, combinePagesHtml, fillTemplate } from '../utils/certificateGenerator'
import calibrationTemplate from '../templates/calibration.html?raw'
import testConformanceTemplate from '../templates/testConformance.html?raw'

export default function Report() {
  async function exportPdf() {
    try {
      const mod = await import('html2pdf.js')
      const html2pdf = mod.default || mod

      const calibrationHtml = fillTemplate(calibrationTemplate, mockReports.calibration)
      const testConformanceHtml = fillTemplate(testConformanceTemplate, mockReports.testConformance)
      const combinedHtml = buildPdfContainerHtml(combinePagesHtml([calibrationHtml, testConformanceHtml]))

      const wrapper = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-99999px'
      wrapper.style.top = '0'
      wrapper.innerHTML = combinedHtml
      document.body.appendChild(wrapper)

      const opt = {
        margin: 0,
        filename: 'sanc-reports.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      await html2pdf().set(opt).from(wrapper).save()
      wrapper.remove()
    } catch (err) {
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
            <h1 className="font-display text-3xl font-bold">Calibration Reports</h1>
            <p className="text-sm text-ink-faint">Mock data preview. Exports two certificates into one PDF.</p>
          </div>
        </div>
        <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-white">
          Export Combined PDF
        </button>
      </div>

      <article id="report-content" className="prose max-w-none bg-white p-6 rounded-md shadow-sm">
        <h2>Preview</h2>
        <p>The PDF uses the two provided HTML formats and mock values for now.</p>
        <ul>
          <li>Calibration template</li>
          <li>Test &amp; Conformance template</li>
        </ul>
      </article>
    </div>
  )
}
