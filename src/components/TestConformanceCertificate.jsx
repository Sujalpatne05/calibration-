/**
 * TestConformanceCertificate — A4 print-ready test & conformance
 * certificate matching the SANC letterhead format.
 */
import { Fragment } from 'react'

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

export default T
