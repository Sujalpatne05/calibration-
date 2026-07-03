/**
 * TestConformanceCertificate — A4 print-ready test & conformance
 * certificate matching the SANC letterhead format.
 */
import { Fragment } from 'react'

const parseJsonList = (value) => {
  if (Array.isArray(value)) return value
  if (!value || typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const formatDate = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && !value.includes('T')) return value

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB')
}

const asList = (value) => (Array.isArray(value) ? value : [])
const firstText = (...values) => values.find((value) => String(value ?? '').trim()) ?? ''

const normalizeItems = (items) =>
  asList(items).map((item, index) => ({
    sr: item.sr ?? index + 1,
    name: item.name ?? item.title ?? 'Instrument',
    qty: item.qty ?? item.quantity ?? 1,
    specs: asList(item.specs),
  }))

const fallbackItems = (source) => {
  const name = source.instrumentName ?? source.instrument?.name ?? ''
  const make = source.instrumentMake ?? source.instrument?.make ?? ''
  const model = source.instrumentModel ?? source.instrument?.model ?? ''
  const serial = source.instrumentSerial ?? source.instrument?.serial ?? ''
  const category = source.instrument?.category ?? ''
  const range = source.instrumentRange ?? ''
  const accuracy = source.instrumentAccuracy ?? ''

  if (!name && !make && !model && !serial && !range) return []

  return [
    {
      sr: 1,
      name: name || 'Instrument',
      qty: 1,
      specs: [
        { key: 'MAKE', value: make || 'N/A' },
        { key: 'MODEL', value: model || 'N/A' },
        { key: 'CATEGORY', value: category || 'N/A' },
        { key: 'SERIAL NO', value: serial || 'N/A' },
        { key: 'RANGE', value: range || 'N/A' },
        { key: 'ACCURACY', value: accuracy || 'N/A' },
      ],
    },
  ]
}

const T = (props) => {
  const source = props.data ?? props
  const parsedItems = normalizeItems(parseJsonList(source.items))
  const items = parsedItems.length ? parsedItems : fallbackItems(source)
  const customer_name = firstText(source.customer_name, source.customer?.name)
  const tc_number = firstText(source.tcNumber, source.tc_number, source.certificateNo)
  const po_number = firstText(source.poNumber, source.po_number, `PO-${tc_number || 'DRAFT'}`)
  // For TC Date, prioritize tcDate (which should be the invoice date), then issueDate
  const tc_date = firstText(source.tc_date, formatDate(source.tcDate), formatDate(source.issueDate))
  const note = firstText(
    source.notes,
    source.note,
    'This is to certify that the material has been checked for Visual, Dimensional and Performance tests and found within accuracy.'
  )
  const legal = firstText(
    source.legalDisclaimer,
    source.legal,
    'We confirm the specifications and performance for a period of 12 months from the date of commissioning or 18 months from the date of dispatch, whichever is earlier, for manufacturing defects only. We reserve the right of repair or to replace the defective material in parts or in full depending upon the nature of the defect & observation. Furthermore, all warranties cease to apply if the instruction manual is not followed.'
  )

  return (
  <article className="tc-page" role="document" aria-label="Test & Conformance Certificate">
    {/* Blue corner accent */}
    <div className="tc-corner-accent" />

    {/* Watermark */}
    <div className="tc-watermark" aria-hidden="true">
      <img src="/SANC_LOGO_-_Black.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
    </div>

    {/* Letterhead */}
    <header className="tc-letterhead">
      <img src="/SANC_LOGO_-_Black.png" alt="SANC" className="tc-logo-svg" style={{ objectFit: 'contain' }} />
      <div className="tc-brand-text">
        <div className="tc-company">SHRIRANG AUTOMATION AND CONTROLS PVT. LTD.</div>
        <div className="tc-iso">An ISO 9001:2015 Certified Company</div>
      </div>
    </header>

    <div className="tc-cert-title">Test &amp; Conformance Certificate</div>

    {/* Body */}
    <div className="tc-content">
      <div className="tc-doc">
        <div className="tc-cell tc-meta">
          <span className="tc-label">Customer&apos;s Name</span>
          <span className="tc-value">:&nbsp; {customer_name}</span>
        </div>
        <div className="tc-cell tc-meta">
          <span className="tc-label">Purchase Order number</span>
          <span className="tc-value">:&nbsp; {po_number}</span>
        </div>
        <div className="tc-cell tc-meta tc-meta-tc">
          <span className="tc-label">TC Number</span>
          <span className="tc-value">:&nbsp; {tc_number}</span>
          <span className="tc-date">
            <b>Date:</b>
            <span>{tc_date}</span>
          </span>
        </div>

        <div className="tc-cell" style={{ padding: 0 }}>
          <div className="tc-items-grid">
            <div className="tc-table-head">
              <div>Sr.<br />No</div>
              <div>Item Description</div>
              <div>Quantity</div>
            </div>
            {items.map((item) => (
              <Fragment key={item.sr}>
                <div className="tc-sr">{item.sr}</div>
                <div className="tc-desc">
                  <div className="tc-item-name">{item.name}</div>
                  {item.specs.length ? (
                    <div className="tc-specs">
                      {item.specs.map((s, i) => (
                        <Fragment key={i}>
                          <span className="tc-k">{s.key}</span>
                          <span className="tc-sep">:</span>
                          <span className="tc-v">{s.value}</span>
                        </Fragment>
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="tc-qty">{item.qty}</div>
              </Fragment>
            ))}
          </div>
        </div>

        <div className="tc-cell tc-note">{note}</div>

        <div className="tc-cell tc-legal">{legal}</div>

        <div className="tc-cell tc-sign">
          For SHRIRANG AUTOMATION AND CONTROLS
          <img
            className="tc-stamp-img"
            src="/sanc-stamp-sign.png"
            alt="SANC stamp"
          />
          QUALITY CONTROL
        </div>
      </div>
    </div>

    {/* Footer */}
    <footer className="tc-footer">
      <div className="tc-footer-inner">
        <div className="tc-addr">
          PLOT NO. 733, ROAD NO. 85,
          <br />
          GIDC-SACHIN, DIST. SURAT - 394 230.
          <br />
          GUJARAT - INDIA.
        </div>
        <div className="tc-contact">
          Contact : +91-6354904137, 9512500952
          <br />
          Website : www.sanc.in
          <br />
          E-mail : info@sanc.in
        </div>
      </div>
    </footer>
  </article>
  )
}

export default T
