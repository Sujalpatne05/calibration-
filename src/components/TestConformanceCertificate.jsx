/**
 * TestConformanceCertificate — A4 print-ready test & conformance
 * certificate matching the SANC letterhead format.
 */
import { Fragment } from 'react'
import SancLogo from './SancLogo'

const GearLogo = () => (
  <svg
    className="tc-logo-svg"
    viewBox="0 0 100 100"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="SANC logo"
  >
    <g fill="#1b2a63">
      {Array.from({ length: 12 }, (_, i) => (
        <rect
          key={i}
          x="45.5"
          y="1"
          width="9"
          height="14"
          rx="2"
          transform={`rotate(${i * 30} 50 50)`}
        />
      ))}
    </g>
    <circle cx="50" cy="50" r="41" fill="#1b2a63" />
    <circle cx="50" cy="50" r="33" fill="#ffffff" />
    <g stroke="#1b2a63" strokeWidth="1.4" strokeLinecap="round">
      <line x1="24" y1="50" x2="28" y2="50" />
      <line x1="72" y1="50" x2="76" y2="50" />
      <line x1="29.5" y1="32" x2="32.7" y2="35" />
      <line x1="70.5" y1="32" x2="67.3" y2="35" />
      <line x1="50" y1="20" x2="50" y2="24" />
    </g>
    <line x1="50" y1="50" x2="63" y2="33" stroke="#d6262c" strokeWidth="2.4" strokeLinecap="round" />
    <circle cx="50" cy="50" r="3.2" fill="#1b2a63" />
    <rect x="17" y="55" width="66" height="16" rx="3.5" fill="#d6262c" />
    <text x="50" y="66.8" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="12" letterSpacing="2" fill="#ffffff">SANC</text>
    <text x="84" y="16" fontFamily="Arial, sans-serif" fontSize="7" fill="#1b2a63">®</text>
  </svg>
)

const T = ({
  customer_name = '',
  po_number = '',
  tc_number = '',
  tc_date = '',
  items = [],
  note = '',
  legal = '',
}) => (
  <article className="tc-page" role="document" aria-label="Test & Conformance Certificate">
    {/* Blue corner accent */}
    <div className="tc-corner-accent" />

    {/* Watermark */}
    <div className="tc-watermark" aria-hidden="true">
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <g fill="#1b2a63">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x="45.5" y="1" width="9" height="14" rx="2" transform={`rotate(${i * 30} 50 50)`} />
          ))}
        </g>
        <circle cx="50" cy="50" r="41" fill="#1b2a63" />
        <circle cx="50" cy="50" r="33" fill="#ffffff" />
        <g stroke="#1b2a63" strokeWidth="1.4" strokeLinecap="round">
          <line x1="24" y1="50" x2="28" y2="50" />
          <line x1="72" y1="50" x2="76" y2="50" />
          <line x1="29.5" y1="32" x2="32.7" y2="35" />
          <line x1="70.5" y1="32" x2="67.3" y2="35" />
          <line x1="50" y1="20" x2="50" y2="24" />
        </g>
        <line x1="50" y1="50" x2="63" y2="33" stroke="#d6262c" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="50" cy="50" r="3.2" fill="#1b2a63" />
        <rect x="17" y="55" width="66" height="16" rx="3.5" fill="#d6262c" />
        <text x="50" y="66.8" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="12" letterSpacing="2" fill="#ffffff">SANC</text>
      </svg>
      <span className="tc-wm-text">SANC</span>
    </div>

    {/* Letterhead */}
    <header className="tc-letterhead">
      <GearLogo />
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
            <b>Date:</b>{tc_date}
          </span>
        </div>

        <div className="tc-cell" style={{ padding: 0 }}>
          <div className="tc-table-head">
            <div>Sr.<br />No</div>
            <div>Item Description</div>
            <div>Quantity</div>
          </div>
          {items.map((item) => (
            <div className="tc-item" key={item.sr}>
              <div className="tc-sr">{item.sr}</div>
              <div className="tc-desc">
                <div className="tc-item-name">{item.name}</div>
                <div className="tc-specs">
                  {item.specs.map((s, i) => (
                    <Fragment key={i}>
                      <span className="tc-k">{s.key}</span>
                      <span className="tc-sep">:</span>
                      <span className="tc-v">{s.value}</span>
                    </Fragment>
                  ))}
                </div>
              </div>
              <div className="tc-qty">{item.qty}</div>
            </div>
          ))}
        </div>

        <div className="tc-cell tc-note">{note}</div>

        <div className="tc-cell tc-legal">{legal}</div>

        <div className="tc-cell tc-sign">
          For SHRIRANG AUTOMATION AND CONTROLS
          <div className="tc-stamp">
            SHRIRANG
            <br />
            AUTOMATION
            <br />
            &amp; CONTROLS
          </div>
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

export default T
