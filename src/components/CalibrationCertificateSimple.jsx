/**
 * CalibrationCertificateSimple — Simplified calibration certificate format
 * Based on user's reference image with SANC header, footer, and signatures
 */

const formatDate = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && !value.includes('T')) return value
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB')
}

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

const parseJsonValue = (value) => {
  if (!value || typeof value !== 'string') return value
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

export default function CalibrationCertificateSimple(props) {
  const source = props.data ?? props
  const parsedStandards = parseJsonList(source.standards ?? source.refStandards)
  const readings = parseJsonValue(source.readings)
  const rows = Array.isArray(readings) ? readings : readings?.rows ?? []

  const certificateNo = source.certificateNo ?? ''
  const issueDate = formatDate(source.issueDate)
  const calibrationDate = formatDate(source.calibrationDate)
  const dueDate = formatDate(source.dueDate)
  const customerName = source.customer?.name ?? ''
  const calibratedAt = source.location ?? 'Lab'
  const dateOfReceipt = formatDate(source.calibrationDate)
  const conditionOnReceipt = source.conditionOnReceipt ?? 'Good'
  
  const instrumentName = source.instrumentName ?? ''
  const instrumentMake = source.instrumentMake ?? ''
  const instrumentModel = source.instrumentModel ?? ''
  const instrumentSerial = source.instrumentSerial ?? ''
  const instrumentRange = source.instrumentRange ?? ''
  const instrumentResolution = source.instrumentResolution ?? ''
  const instrumentAccuracy = source.instrumentAccuracy ?? ''
  const identificationNo = source.instrumentTag ?? 'N/A'
  const location = source.location ?? 'N/A'
  
  const envTemperature = source.envTemperature ?? '25±5'
  const envHumidity = source.envHumidity ?? '40-70'

  return (
    <article className="cc-simple-page">
      {/* Header */}
      <header className="cc-simple-header">
        <div className="cc-simple-logo">
          <img src="/SANC_LOGO_-_Black.png" alt="SANC Logo" />
        </div>
        <div className="cc-simple-brand">
          <div className="cc-simple-company">SHRIRANG AUTOMATION AND CONTROLS PVT. LTD.</div>
          <div className="cc-simple-iso">An ISO 9001:2015 Certified Company</div>
        </div>
      </header>

      <h1 className="cc-simple-title">Calibration Certificate</h1>

      {/* Top Info Row */}
      <div className="cc-simple-info-row">
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Certificate No</span>
          <span>:</span>
          <span className="cc-simple-value">{certificateNo}</span>
        </div>
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Date of Issue</span>
          <span>:</span>
          <span className="cc-simple-value">{issueDate}</span>
        </div>
      </div>

      <div className="cc-simple-info-row">
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Date of Calibration</span>
          <span>:</span>
          <span className="cc-simple-value">{calibrationDate}</span>
        </div>
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Recom. Due Date</span>
          <span>:</span>
          <span className="cc-simple-value">{dueDate}</span>
        </div>
      </div>

      <div className="cc-simple-info-row">
        <div className="cc-simple-cell cc-simple-full">
          <span className="cc-simple-label">Customer Details :</span>
          <span className="cc-simple-value">{customerName}</span>
        </div>
      </div>

      <div className="cc-simple-info-row">
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Calibrated at : {calibratedAt}</span>
        </div>
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Date of Receipt : {dateOfReceipt}</span>
        </div>
        <div className="cc-simple-cell">
          <span className="cc-simple-label">Cond. On Receipt : {conditionOnReceipt}</span>
        </div>
      </div>

      {/* Instrument Details */}
      <div className="cc-simple-section-title">Details of Test Instrument</div>

      <div className="cc-simple-grid">
        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Instrument Name</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentName}</span>
        </div>
        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">MAKE</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentMake}</span>
        </div>

        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Model Number</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentModel}</span>
        </div>
        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">SERIAL NUMBER</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentSerial}</span>
        </div>

        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Range</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentRange}</span>
        </div>
        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Identification No.</span>
          <span>:</span>
          <span className="cc-simple-value">{identificationNo}</span>
        </div>

        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Resolution</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentResolution}</span>
        </div>
        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Accuracy</span>
          <span>:</span>
          <span className="cc-simple-value">{instrumentAccuracy}</span>
        </div>

        <div className="cc-simple-grid-cell">
          <span className="cc-simple-label">Location</span>
          <span>:</span>
          <span className="cc-simple-value">{location}</span>
        </div>
      </div>

      {/* Standards Used */}
      <div className="cc-simple-section-title">Details of Standard Used</div>
      
      <table className="cc-simple-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Sr.No.</th>
            <th>Valid upto</th>
            <th>Report No.</th>
          </tr>
        </thead>
        <tbody>
          {parsedStandards.map((std, i) => (
            <tr key={i}>
              <td>{std.name ?? ''}</td>
              <td>{std.serial ?? ''}</td>
              <td>{std.validUpto ?? std.certExpiry ?? ''}</td>
              <td>{std.certificateNo ?? std.reportNo ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cc-simple-env-row">
        <span className="cc-simple-label">Environmental Details</span>
        <span>:</span>
        <span>Temperature : {envTemperature}°C</span>
        <span style={{ marginLeft: '30px' }}>Relative Humidity : {envHumidity} % RH</span>
      </div>

      {/* Readings Table */}
      <div className="cc-simple-section-title">Readings</div>

      <table className="cc-simple-table cc-simple-readings">
        <thead>
          <tr>
            <th rowSpan={2}>S.No.</th>
            <th rowSpan={2}>Calibration Points<br/>{readings?.unit ?? 'inWC'}</th>
            <th rowSpan={2}>Corresponding mA<br/>mA</th>
            <th colSpan={2}>Standard Reading<br/>mA</th>
            <th rowSpan={2}>Mean Value<br/>mA</th>
            <th rowSpan={2}>UUC Reading<br/>{readings?.unit ?? 'inWC'}</th>
            <th rowSpan={2}>Error<br/>{readings?.unit ?? 'inWC'}</th>
          </tr>
          <tr>
            <th>Up</th>
            <th>Down</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{row.set ?? ''}</td>
              <td>{row.correspondingMA ?? ''}</td>
              <td>{row.up ?? ''}</td>
              <td>{row.down ?? ''}</td>
              <td>{row.mean ?? ''}</td>
              <td>{row.uucReading ?? row.correspondingValue ?? ''}</td>
              <td>{row.error ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Remarks */}
      <div className="cc-simple-remarks">
        <div className="cc-simple-remarks-title">Remarks</div>
        <ol>
          <li>This Report Refers only to the particular Item Calibrated at Lab/Site.</li>
          <li>This Certificate shall not be reproduced, except in full unless written permission for the same is obtained from SANC.</li>
          <li>Unit under testing is in accuracy</li>
        </ol>
      </div>

      {/* Signatures */}
      <div className="cc-simple-signatures">
        <div className="cc-simple-sig-cell">
          <div>Calibrated By</div>
          <img src="/rahul-signature.png" alt="Signature" />
          <div>Rahul Patel</div>
          <div>Lab Engineer</div>
        </div>
        <div className="cc-simple-sig-cell">
          <img src="/sanc-stamp-sign.png" alt="Stamp" className="cc-simple-stamp" />
        </div>
        <div className="cc-simple-sig-cell">
          <div>Approved By</div>
          <img src="/prashant-signature.png" alt="Signature" />
          <div>Prashant Patel</div>
          <div>Lab Incharge</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="cc-simple-footer">
        <div className="cc-simple-footer-left">
          PLOT NO. 733, ROAD NO. 85,<br/>
          GIDC-SACHIN, DIST. SURAT - 394 230.<br/>
          GUJARAT - INDIA.
        </div>
        <div className="cc-simple-footer-right">
          Contact : +91-6354904137, 9512500952<br/>
          Website : www.sanc.in<br/>
          E-mail : info@sanc.in
        </div>
      </footer>
    </article>
  )
}
