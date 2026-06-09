import { useState } from 'react'
import SancLogo from '../components/SancLogo'
import mockReports from '../data/mockReports'
import { buildPdfContainerHtml, combinePagesHtml, fillTemplate } from '../utils/certificateGenerator'
import calibrationTemplate from '../templates/calibration.html?raw'
import testConformanceTemplate from '../templates/testConformance.html?raw'
import { Printer, Download } from 'lucide-react'

export default function Report() {
  const [activeTab, setActiveTab] = useState('calibration')

  async function exportPdf() {
    try {
      const mod = await import('html2pdf.js')
      const html2pdf = mod.default || mod

      const calibrationHtml = fillTemplate(calibrationTemplate, mockReports.calibration)
      const testConformanceHtml = fillTemplate(testConformanceTemplate, mockReports.testConformance)
      const fullHtml = calibrationHtml + testConformanceHtml

      const wrapper = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-99999px'
      wrapper.style.top = '0'
      wrapper.style.width = '210mm'
      wrapper.innerHTML = fullHtml
      document.body.appendChild(wrapper)

      // Give it time to render
      await new Promise(resolve => setTimeout(resolve, 500))

      const opt = {
        margin: 0,
        filename: 'sanc-reports.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
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

  function handlePrint() {
    window.print()
  }

  const getPreviewHtml = () => {
    if (activeTab === 'calibration') {
      return fillTemplate(calibrationTemplate, mockReports.calibration)
    }
    return fillTemplate(testConformanceTemplate, mockReports.testConformance)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <SancLogo size={64} />
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-600">Calibration Report</h1>
            <p className="text-sm text-ink-faint">SANC Calibration and Validation Services</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-md border border-ink-lighter px-4 py-2 text-ink hover:bg-ink-faintest">
            <Printer size={18} />
            Print
          </button>
          <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-md bg-brand-600 px-4 py-2 text-white hover:bg-brand-700">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-ink flex items-center gap-3">
              <SancLogo size={32} />
              Certificates
            </h2>
            <p className="text-sm text-ink-faint mt-1">Generate & export calibration and test certificates</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-ink-lighter mb-6">
          <button
            onClick={() => setActiveTab('calibration')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'calibration'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            Calibration Certificate
          </button>
          <button
            onClick={() => setActiveTab('testConformance')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'testConformance'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-ink-faint hover:text-ink'
            }`}
          >
            Test & Conformance
          </button>
        </div>

        {/* Certificate Preview */}
        <div className="bg-ink-faintest rounded-lg p-4 min-h-96 overflow-auto">
          <div
            dangerouslySetInnerHTML={{ __html: getPreviewHtml() }}
            className="bg-white shadow-md"
            style={{
              zoom: 0.75,
              transformOrigin: 'top left',
              width: '133.333%',
            }}
          />
        </div>
      </div>
    </div>
  )
}
