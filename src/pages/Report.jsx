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
    const element = printRef.current
    if (!element) return
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const filename =
        tab === 'calibration'
          ? `calibration-certificate-${calibrationCertificateData.certificate_no}.pdf`
          : `test-certificate-${testCertificateData.tc_number}.pdf`

      // Capture at 2× resolution for sharpness
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.98)

      // A4 dimensions in mm
      const A4_W = 210
      const A4_H = 297

      // Scale image to fit A4, preserving aspect ratio (never upscale)
      const canvasAspect = canvas.height / canvas.width
      let imgW = A4_W
      let imgH = A4_W * canvasAspect
      if (imgH > A4_H) {
        imgH = A4_H
        imgW = A4_H / canvasAspect
      }
      const xOffset = (A4_W - imgW) / 2

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      pdf.addImage(imgData, 'JPEG', xOffset, 0, imgW, imgH)
      pdf.save(filename)
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
