/**
 * CalibrationCertificate — A4 print-ready calibration certificate
 * matching the SANC letterhead format. All layout and styles are
 * self-contained so the component can be rendered in isolation for
 * PDF export.
 */
import SancLogo from './SancLogo'

const C = ({
  certificate_no = '',
  ulr_no = '',
  calibration_date = '',
  date_of_issue = '',
  due_date = '',
  status = 'Calibrated & Passed',
  customer_name = '',
  customer_address = '',
  customer_contact = '',
  customer_gstin = '',
  calibration_location = '',
  calibration_address = '',
  procedure_ref = '',
  srf_no = '',
  instrument_name = '',
  instrument_make = '',
  instrument_model = '',
  instrument_serial = '',
  instrument_range = '',
  instrument_resolution = '',
  instrument_accuracy = '',
  instrument_tag = '',
  condition_on_receipt = '',
  standards = [],
  env_temperature = '',
  env_humidity = '',
  env_pressure = '',
  readings = [],
  custom_remark = '',
  calibrated_by_name = '',
  calibrated_by_designation = '',
  approved_by_name = '',
  approved_by_designation = '',
}) => (
  <article
    className="cc-page"
    role="document"
    aria-label="Calibration Certificate"
  >
    {/* Header */}
    <header className="cc-letterhead">
      <div className="cc-logo">
        <SancLogo size={96} />
      </div>
      <div className="cc-brand">
        <div className="cc-co-name">
          Shrirang Automation and Controls Pvt. Ltd.
        </div>
        <div className="cc-co-sub">An ISO 9001:2015 Certified Company</div>
      </div>
      <div className="cc-head-meta">
        <div className="cc-meta-label">Certificate No.</div>
        <div className="cc-meta-value">{certificate_no}</div>
        <div className="cc-meta-label" style={{ marginTop: 4 }}>
          Page
        </div>
        <div className="cc-meta-value">1 of 1</div>
      </div>
    </header>
    <div className="cc-head-rule" />

    {/* Title */}
    <div className="cc-title-block">
      <div className="cc-eyebrow">
        Measurement &middot; Traceability &middot; Assurance
      </div>
      <h1 className="cc-title">Calibration Certificate</h1>
      <div className="cc-title-ornament">
        <span />
        <i className="cc-diamond" />
        <span />
      </div>
    </div>

    {/* 1 — Certificate Information */}
    <section className="cc-section">
      <div className="cc-section-title">Certificate Information</div>
      <div className="cc-info-grid">
        <div className="cc-info-cell">
          <span className="cc-label">Certificate Number</span>
          <span className="cc-value">{certificate_no}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">ULR / Reference No.</span>
          <span className="cc-value">{ulr_no}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Date of Calibration</span>
          <span className="cc-value">{calibration_date}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Date of Issue</span>
          <span className="cc-value">{date_of_issue}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Calibration Due Date</span>
          <span className="cc-value">{due_date}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Calibration Status</span>
          <span className="cc-value">
            <span className="cc-pill cc-pill-pass">{status}</span>
          </span>
        </div>
      </div>
    </section>

    {/* 2 — Customer & Calibration Details */}
    <section className="cc-section">
      <div className="cc-section-title">
        Customer &amp; Calibration Details
      </div>
      <div className="cc-customer-card">
        <div className="cc-block">
          <h3 className="cc-block-h3">Issued To</h3>
          <div className="cc-name">{customer_name}</div>
          <div className="cc-addr">{customer_address}</div>
          <div className="cc-meta">
            <div>
              <strong>Contact:</strong> {customer_contact}
            </div>
            <div>
              <strong>GSTIN:</strong> {customer_gstin}
            </div>
          </div>
        </div>
        <div className="cc-block">
          <h3 className="cc-block-h3">Calibration Performed</h3>
          <div className="cc-name">{calibration_location}</div>
          <div className="cc-addr">{calibration_address}</div>
          <div className="cc-meta">
            <div>
              <strong>Method / Procedure:</strong> {procedure_ref}
            </div>
            <div>
              <strong>SRF No.:</strong> {srf_no}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* 3 — Instrument (UUC) */}
    <section className="cc-section">
      <div className="cc-section-title">
        Instrument Under Calibration (UUC)
      </div>
      <div className="cc-info-grid cc-cols-3">
        <div className="cc-info-cell">
          <span className="cc-label">Instrument / Description</span>
          <span className="cc-value">{instrument_name}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Make</span>
          <span className="cc-value">{instrument_make}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Model</span>
          <span className="cc-value">{instrument_model}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Serial Number</span>
          <span className="cc-value">{instrument_serial}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Range</span>
          <span className="cc-value">{instrument_range}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Resolution / Least Count</span>
          <span className="cc-value">{instrument_resolution}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Accuracy Class</span>
          <span className="cc-value">{instrument_accuracy}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Identification / Tag No.</span>
          <span className="cc-value">{instrument_tag}</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Condition on Receipt</span>
          <span className="cc-value">{condition_on_receipt}</span>
        </div>
      </div>
    </section>

    {/* 4 — Reference Standards */}
    <section className="cc-section">
      <div className="cc-section-title">Reference Standards Used</div>
      <table className="cc-tbl cc-tbl-compact">
        <thead>
          <tr>
            <th className="cc-center">#</th>
            <th>Standard / Master Equipment</th>
            <th>Make &amp; Model</th>
            <th>Serial / ID No.</th>
            <th>Range</th>
            <th>Traceability / Cert. No.</th>
            <th>Valid Upto</th>
          </tr>
        </thead>
        <tbody>
          {standards.map((s, i) => (
            <tr key={i}>
              <td className="cc-center">{i + 1}</td>
              <td>{s.name}</td>
              <td>{s.make}</td>
              <td>{s.serial}</td>
              <td>{s.range}</td>
              <td>{s.cert}</td>
              <td className="cc-center">{s.valid}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cc-note-italic">
        All reference standards are traceable to National / International
        Standards through an accredited laboratory.
      </div>
    </section>

    {/* 5 — Environmental Conditions */}
    <section className="cc-section">
      <div className="cc-section-title">Environmental Conditions</div>
      <div className="cc-info-grid cc-cols-3">
        <div className="cc-info-cell">
          <span className="cc-label">Ambient Temperature</span>
          <span className="cc-value">
            {env_temperature} &deg;C
          </span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Relative Humidity</span>
          <span className="cc-value">{env_humidity} % RH</span>
        </div>
        <div className="cc-info-cell">
          <span className="cc-label">Atmospheric Pressure</span>
          <span className="cc-value">{env_pressure} mbar</span>
        </div>
      </div>
    </section>

    {/* 6 — Readings */}
    <section className="cc-section">
      <div className="cc-section-title">
        Calibration Readings &amp; Results
      </div>
      <table className="cc-tbl cc-readings">
        <thead>
          <tr>
            <th rowSpan={2}>Sr.</th>
            <th rowSpan={2}>
              Set Value
              <br />
              <small>(Standard)</small>
            </th>
            <th rowSpan={2}>Unit</th>
            <th colSpan={2} className="cc-group-head">
              UUC Reading
            </th>
            <th rowSpan={2}>Mean</th>
            <th rowSpan={2}>Error</th>
            <th rowSpan={2}>
              Uncertainty
              <br />
              <small>(k = 2, ~95%)</small>
            </th>
          </tr>
          <tr>
            <th>Up-scale &uarr;</th>
            <th>Down-scale &darr;</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((r, i) => (
            <tr key={i}>
              <td className="cc-num">{i + 1}</td>
              <td className="cc-num">{r.set}</td>
              <td className="cc-center">{r.unit}</td>
              <td className="cc-num">{r.up}</td>
              <td className="cc-num">{r.down}</td>
              <td className="cc-num">{r.mean}</td>
              <td className="cc-num">{r.error}</td>
              <td className="cc-num">&plusmn; {r.unc}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cc-note-italic">
        The reported expanded uncertainty is stated as the standard
        uncertainty of measurement multiplied by the coverage factor k = 2,
        providing a confidence level of approximately 95%.
      </div>
    </section>

    {/* 7 — Remarks */}
    <section className="cc-section">
      <div className="cc-section-title">Remarks &amp; Notes</div>
      <ol className="cc-remarks">
        <li>
          The results stated in this certificate relate only to the item
          calibrated as identified above.
        </li>
        <li>
          This certificate shall not be reproduced, except in full, without
          the written approval of SANC.
        </li>
        <li>
          The due date for next calibration is assigned based on usage,
          manufacturer recommendation, and customer input.
        </li>
        <li>
          All observations were taken under the environmental conditions
          reported in Section&nbsp;5.
        </li>
        <li>{custom_remark}</li>
      </ol>
    </section>

    {/* 8 — Signatures */}
    <section className="cc-sign-grid">
      <div className="cc-sign-cell">
        <div className="cc-role">Calibrated By</div>
        <div className="cc-sign-space" />
        <div className="cc-sign-name">{calibrated_by_name}</div>
        <div className="cc-sign-desig">{calibrated_by_designation}</div>
      </div>
      <div className="cc-sign-cell">
        <div className="cc-role">Approved By</div>
        <div className="cc-sign-space" />
        <div className="cc-sign-name">{approved_by_name}</div>
        <div className="cc-sign-desig">{approved_by_designation}</div>
      </div>
    </section>

    {/* Seal */}
    <div className="cc-seal" aria-hidden="true">
      <span>
        SANC
        <br />
        Authorised
        <br />
        Signatory
      </span>
    </div>

    {/* Footer */}
    <div className="cc-footer-wrap" role="contentinfo">
      <svg
        className="cc-footer-svg"
        viewBox="0 0 794 115"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <rect x="0" y="32" width="794" height="83" fill="#0d7cbc" />
        <polygon
          points="0,32 446,32 495,0 794,0 794,115 0,115"
          fill="#0d84cb"
          opacity="0.62"
        />
        <polygon
          points="0,32 438,32 498,115 0,115"
          fill="#0b6aa5"
          opacity="0.48"
        />
        <polygon
          points="530,0 794,0 794,115 618,115"
          fill="#1ea7e8"
          opacity="0.95"
        />
      </svg>
      <div className="cc-footer-content">
        <div className="cc-f-left">
          Plot No. 733, Road No. 85,
          <br />
          GIDC&ndash;Sachin, Dist. Surat &ndash; 394 230,
          <br />
          Gujarat, India.
        </div>
        <div className="cc-f-right">
          <strong>Contact :</strong> +91-6354904137, 9512500952
          <br />
          <strong>Website :</strong> www.sanc.in
          <br />
          <strong>E-mail :</strong> info@sanc.in
        </div>
      </div>
      <div className="cc-footer-band">
        <span>
          &copy; Shrirang Automation and Controls Pvt. Ltd. &mdash;
          Confidential Calibration Record
        </span>
        <span className="cc-page-num">
          Doc&nbsp;&middot;&nbsp;{certificate_no}
        </span>
      </div>
    </div>
  </article>
)

export default C
