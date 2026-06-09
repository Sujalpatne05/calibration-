import { useState, useRef } from 'react'
import { FileText, ClipboardCheck, Download, Printer } from 'lucide-react'
import SancLogo from '../components/SancLogo'
import CalibrationCertificate from '../components/CalibrationCertificate'
import TestConformanceCertificate from '../components/TestConformanceCertificate'
import { calibrationCertificateData, testCertificateData } from '../data/reports'
import Button from '../components/Button'

const TABS = [
  { id: 'calibration', label: 'Calibration Certificate', icon: ClipboardCheck },
  { id: 'test', label: 'Test & Conformance', icon: FileText },
]

export default function Report() {
  const [tab, setTab] = useState('calibration')
  const printRef = useRef(null)

  async function exportPdf() {
    try {
      const mod = await import('html2pdf.js')
      const html2pdf = mod.default || mod
      const element = printRef.current
      if (!element) return
      const filename =
        tab === 'calibration'
          ? `calibration-certificate-${calibrationCertificateData.certificate_no}.pdf`
          : `test-certificate-${testCertificateData.tc_number}.pdf`
      const opt = {
        margin: 0,
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
      }
      html2pdf().set(opt).from(element).save()
    } catch (err) {
      console.error('PDF export failed', err)
      window.print()
    }
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <SancLogo size={52} />
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Certificates</h1>
            <p className="text-sm text-ink-faint">Generate &amp; export calibration and test certificates</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer size={18} /> Print
          </Button>
          <Button onClick={exportPdf}>
            <Download size={18} /> Export PDF
          </Button>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                tab === t.id
                  ? 'bg-brand-600 text-white shadow-ring'
                  : 'bg-white text-ink-soft ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon size={18} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Certificate preview — scrollable container with grey background */}
      <div className="overflow-x-auto rounded-2xl bg-slate-200/60 p-4">
        <div ref={printRef}>
          {tab === 'calibration' ? (
            <CalibrationCertificate {...calibrationCertificateData} />
          ) : (
            <TestConformanceCertificate {...testCertificateData} />
          )}
        </div>
      </div>
    </div>
  )
}
