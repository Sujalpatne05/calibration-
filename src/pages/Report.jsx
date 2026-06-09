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
    const wrapper = printRef.current
    if (!wrapper) return
    // The actual certificate article is the first child
    const element = wrapper.firstElementChild || wrapper
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])

      const filename =
        tab === 'calibration'
          ? `calibration-certificate-${calibrationCertificateData.certificate_no}.pdf`
          : `test-certificate-${testCertificateData.tc_number}.pdf`

      const SCALE = 2
      const A4_W = 210  // mm
      const A4_H = 297  // mm

      // Capture the full certificate at 2× for sharpness
      const fullCanvas = await html2canvas(element, {
        scale: SCALE,
        useCORS: true,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        width: element.scrollWidth,
        height: element.scrollHeight,
      })

      // ------------------------------------------------------------------
      // Find the bottom edge of the header block so we can keep it at full
      // size and scale only the body content below it.
      // Selector covers both certificate types.
      // ------------------------------------------------------------------
      const headerEndEl = element.querySelector(
        '.cc-title-block, .tc-cert-title'
      )
      const parentRect = element.getBoundingClientRect()
      let splitPx = 0 // pixels from top of element (at 1×) where body starts
      if (headerEndEl) {
        const r = headerEndEl.getBoundingClientRect()
        splitPx = r.bottom - parentRect.top + 8 // +8px breathing room
      }

      const canvasW = fullCanvas.width        // pixels at SCALE×
      const canvasH = fullCanvas.height
      const splitCanvas = Math.round(splitPx * SCALE)  // split in canvas coords

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

      if (splitPx <= 0 || splitCanvas >= canvasH) {
        // Fallback: scale whole certificate to fit A4
        const aspect = canvasH / canvasW
        let w = A4_W, h = A4_W * aspect
        if (h > A4_H) { h = A4_H; w = A4_H / aspect }
        pdf.addImage(
          fullCanvas.toDataURL('image/jpeg', 0.98),
          'JPEG', (A4_W - w) / 2, 0, w, h
        )
      } else {
        // ---- Header portion: placed at full A4 width ----
        const headerCanvas = document.createElement('canvas')
        headerCanvas.width = canvasW
        headerCanvas.height = splitCanvas
        headerCanvas.getContext('2d').drawImage(
          fullCanvas, 0, 0, canvasW, splitCanvas, 0, 0, canvasW, splitCanvas
        )
        // height in mm proportional to A4 width
        const headerH_mm = (splitCanvas / canvasW) * A4_W
        pdf.addImage(
          headerCanvas.toDataURL('image/jpeg', 0.98),
          'JPEG', 0, 0, A4_W, headerH_mm
        )

        // ---- Body portion: scale to fill remaining A4 space ----
        const bodyCanvasH = canvasH - splitCanvas
        const bodyCanvas = document.createElement('canvas')
        bodyCanvas.width = canvasW
        bodyCanvas.height = bodyCanvasH
        bodyCanvas.getContext('2d').drawImage(
          fullCanvas, 0, splitCanvas, canvasW, bodyCanvasH, 0, 0, canvasW, bodyCanvasH
        )
        const bodyAvailH_mm = A4_H - headerH_mm
        const bodyNaturalH_mm = (bodyCanvasH / canvasW) * A4_W
        // Scale body to fit available space (never upscale)
        const bodyScale = bodyNaturalH_mm > bodyAvailH_mm
          ? bodyAvailH_mm / bodyNaturalH_mm
          : 1
        const bodyW_mm = A4_W * bodyScale
        const bodyH_mm = bodyNaturalH_mm * bodyScale
        const bodyX = (A4_W - bodyW_mm) / 2
        pdf.addImage(
          bodyCanvas.toDataURL('image/jpeg', 0.98),
          'JPEG', bodyX, headerH_mm, bodyW_mm, bodyH_mm
        )
      }

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
