/**
 * CalibrationCertificate — A4 print-ready calibration certificate
 * matching the SANC letterhead format. All layout and styles are
 * self-contained so the component can be rendered in isolation for
 * PDF export.
 */
import SancLogo from './SancLogo'

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

const formatDate = (value) => {
  if (!value) return ''
  if (typeof value === 'string' && !value.includes('T')) return value

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB')
}

const standardText = (standard, ...keys) => {
  if (!standard) return ''
  if (typeof standard !== 'object') return String(standard)

  for (const key of keys) {
    if (standard[key]) return standard[key]
  }

  return ''
}

const numberValue = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(numeric) ? numeric : null
}

const firstPresent = (...values) =>
  values.find((value) => value !== undefined && value !== null && value !== '')

const formatNumber = (value, digits = 2) => {
  const numeric = numberValue(value)
  if (numeric === null) return value ?? ''
  return numeric.toFixed(digits).replace(/\.?0+$/, '')
}

const parseRangeEnd = (range) => {
  if (!range) return null
  const matches = String(range)
    .replace(/(\d)\s*-\s*(\d)/g, '$1 $2')
    .match(/-?\d+(?:\.\d+)?/g)
  if (!matches?.length) return null
  return Math.max(...matches.map(Number))
}

const parseRangeStart = (range) => {
  if (!range) return null
  const matches = String(range)
    .replace(/(\d)\s*-\s*(\d)/g, '$1 $2')
    .match(/-?\d+(?:\.\d+)?/g)
  if (!matches?.length) return null
  return Number(matches[0])
}

const displayRangeFallback = (type) =>
  type === 'transmitter'
    ? 750
    : type === 'humidityTemperature' || type === 'humidityHumidity'
      ? 100
      : type === 'switch'
        ? 20
        : 60

const isConvertedReadingType = (type) =>
  type === 'transmitter' ||
  type === 'humidityTemperature' ||
  type === 'humidityHumidity'

const defaultPointCount = (type) => {
  if (type === 'gauge' || type === 'generic') return 7
  if (type === 'switch') return 3
  return 5
}

const buildWorkbookPoints = (type, start, end) => {
  if (type === 'transmitter' && start === 0 && end === 750) {
    return [0, 175, 375, 550, 750]
  }

  const count = defaultPointCount(type)
  const divisor = count - 1
  const step = divisor > 0 ? (end - start) / divisor : 0

  return Array.from({ length: count }, (_, index) => start + step * index)
}

const buildDisplayRows = (rows, type, payload, source) => {
  const start =
    numberValue(payload?.rangeStart) ??
    parseRangeStart(source.instrumentRange) ??
    numberValue(rows[0]?.set) ??
    0
  const payloadEnd = numberValue(payload?.highestRange)
  const sourceEnd = parseRangeEnd(source.instrumentRange)
  const end =
    (sourceEnd && sourceEnd > start ? sourceEnd : null) ??
    (payloadEnd && payloadEnd > start ? payloadEnd : null) ??
    displayRangeFallback(type)
  const resolvedEnd = end > start ? end : displayRangeFallback(type)
  const hasRealReadings = rows.some(
    (row) =>
      numberValue(row.up ?? row.standardUp ?? row.switchingUp) !== null ||
      numberValue(row.down ?? row.standardDown ?? row.switchingDown) !== null
  )
  const rowHighestRange = Math.max(
    0,
    ...rows
      .map((row) => numberValue(row.master ?? row.set ?? row.calibrationPoint))
      .filter((value) => value !== null)
  )
  const staleSampleRows =
    sourceEnd &&
    sourceEnd > start &&
    rowHighestRange > 0 &&
    Math.abs(rowHighestRange - sourceEnd) > 0.0001

  if (rows.length > 1 && hasRealReadings && !staleSampleRows) return rows

  const baseRow = rows[0] ?? {}
  const points = buildWorkbookPoints(type, start, resolvedEnd)

  return points.map((point, index) => ({
    ...baseRow,
    set: formatNumber(point),
    master: formatNumber(point),
    up: index === 0 ? firstPresent(baseRow.up, '') : '',
    down: index === 0 ? firstPresent(baseRow.down, '') : '',
    mean: '',
    error: '',
  }))
}

const readingTypeLabel = {
  gauge: 'Gauge',
  transmitter: 'Transmitter',
  switch: 'Switch',
  humidityTemperature: 'Humidity Transmitter - Temperature',
  humidityHumidity: 'Humidity Transmitter - Humidity',
}

const inferReadingType = (source, payload) => {
  const raw = [
    payload?.tableType,
    payload?.type,
    payload?.category,
    source.instrumentCategory,
    source.instrument?.category,
    source.instrumentName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (raw.includes('humidity') && raw.includes('temperature')) return 'humidityTemperature'
  if (raw.includes('humidity')) return 'humidityHumidity'
  if (raw.includes('switch')) return 'switch'
  if (raw.includes('transmitter')) return 'transmitter'
  if (raw.includes('gauge')) return 'gauge'
  return 'generic'
}

const calculateRows = (rows, type, payload, source) => {
  const payloadHighestRange = numberValue(payload?.highestRange)
  const sourceHighestRange = parseRangeEnd(source.instrumentRange)
  const rowHighestRange = Math.max(
    0,
    ...rows
      .map((row) => numberValue(row.master ?? row.set ?? row.calibrationPoint))
      .filter((value) => value !== null)
  )
  const highestRange =
    (payloadHighestRange && payloadHighestRange > 0 ? payloadHighestRange : null) ??
    (sourceHighestRange && sourceHighestRange > 0 ? sourceHighestRange : null) ??
    (rowHighestRange && rowHighestRange > 0 ? rowHighestRange : null) ??
    displayRangeFallback(type)

  return rows.map((row) => {
    const set = firstPresent(row.set, row.master, row.calibrationPoint, row.point, '')
    const setNumber = numberValue(set)
    const expectedMANumber =
      highestRange && setNumber !== null
        ? 4 + (16 / highestRange) * setNumber
        : setNumber === 0 &&
            (type === 'transmitter' ||
              type === 'humidityTemperature' ||
              type === 'humidityHumidity')
          ? 4
          : null
    const expectedSimpleNumber = setNumber
    const convertedReading = isConvertedReadingType(type)
    const fallbackReading = convertedReading ? expectedMANumber : expectedSimpleNumber
    const up = firstPresent(row.up, row.standardUp, row.switchingUp, fallbackReading, '')
    const down = firstPresent(row.down, row.standardDown, row.switchingDown, fallbackReading, '')
    const upNumber = numberValue(up)
    const downNumber = numberValue(down)
    const meanNumber =
      numberValue(row.mean) ??
      (upNumber !== null && downNumber !== null ? (upNumber + downNumber) / 2 : null)
    const correspondingMANumber =
      numberValue(row.correspondingMA) ??
      expectedMANumber
    const correspondingValueNumber =
      numberValue(row.correspondingValue ?? row.correspondingPressure ?? row.uucReading) ??
      (convertedReading && highestRange && meanNumber !== null
        ? (meanNumber - 4) * (highestRange / 16)
        : convertedReading && setNumber === 0 && meanNumber === 4
          ? 0
          : type === 'gauge' || type === 'switch' || type === 'generic'
            ? meanNumber
            : null)

    const simpleMean = meanNumber ?? numberValue(row.uucReading)
    const simpleError =
      numberValue(row.error) ??
      (setNumber !== null && simpleMean !== null ? setNumber - simpleMean : null)
    const convertedError =
      numberValue(row.error) ??
      (setNumber !== null && correspondingValueNumber !== null
        ? correspondingValueNumber - setNumber
        : null)

    return {
      ...row,
      set: formatNumber(set),
      unit: row.unit ?? payload?.unit ?? '',
      up: formatNumber(up),
      down: formatNumber(down),
      mean: meanNumber !== null ? formatNumber(meanNumber) : row.mean ?? '',
      error:
        type === 'transmitter' ||
        type === 'humidityTemperature' ||
        type === 'humidityHumidity'
          ? convertedError !== null
            ? formatNumber(convertedError, 4)
            : ''
          : simpleError !== null
            ? formatNumber(simpleError, 4)
            : '',
      unc: row.unc ?? row.uncertainty ?? payload?.uncertainty ?? '',
      correspondingMA:
        correspondingMANumber !== null ? formatNumber(correspondingMANumber, 2) : '',
      correspondingValue:
        correspondingValueNumber !== null ? formatNumber(correspondingValueNumber, 2) : '',
      correspondingPressure:
        type === 'gauge' || type === 'switch' || type === 'generic'
          ? setNumber !== null
            ? formatNumber(setNumber)
            : ''
          : correspondingValueNumber !== null
            ? formatNumber(correspondingValueNumber, 2)
            : '',
      uucReading:
        row.uucReading ??
        (type === 'gauge' || type === 'switch' || type === 'generic'
          ? setNumber !== null
            ? formatNumber(setNumber)
            : ''
          : correspondingValueNumber !== null
            ? formatNumber(correspondingValueNumber)
            : ''),
    }
  })
}

const normalizeReadingSections = (source) => {
  const payload = parseJsonValue(source.readings)

  if (payload?.sections && Array.isArray(payload.sections)) {
    return payload.sections.map((section) => {
      const type = inferReadingType(source, section)
      return {
        type,
        title: section.title ?? readingTypeLabel[type] ?? 'Calibration Readings',
        unit: section.unit ?? payload.unit ?? '',
        rows: calculateRows(
          buildDisplayRows(section.rows ?? [], type, section, source),
          type,
          section,
          source
        ),
      }
    })
  }

  const rows = Array.isArray(payload) ? payload : payload?.rows ?? []
  const type = inferReadingType(source, payload)
  const displayRows = buildDisplayRows(rows, type, payload ?? {}, source)
  return [
    {
      type,
      title: payload?.title ?? readingTypeLabel[type] ?? 'Calibration Readings',
      unit: payload?.unit ?? '',
      rows: calculateRows(displayRows, type, payload ?? {}, source),
    },
  ]
}

const ReadingTable = ({ section }) => {
  const rows = section.rows ?? []

  if (section.type === 'transmitter') {
    return (
      <table className="cc-tbl cc-readings">
        <thead>
          <tr>
            <th rowSpan={2}>S.No.</th>
            <th rowSpan={2}>
              Master Reading
              <small>{section.unit || 'PA'}</small>
            </th>
            <th rowSpan={2}>
              Corresponding mA
              <small>mA</small>
            </th>
            <th colSpan={2} className="cc-group-head">
              Standard Reading
            </th>
            <th rowSpan={2}>
              Mean Value
              <small>mA</small>
            </th>
            <th rowSpan={2}>
              Corresponding Pressure
              <small>{section.unit || 'Pa'}</small>
            </th>
            <th rowSpan={2}>
              Error
              <small>{section.unit || 'Pa'}</small>
            </th>
            <th rowSpan={2}>Uncertainty</th>
          </tr>
          <tr>
            <th>Up</th>
            <th>Down</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="cc-num">{i + 1}</td>
              <td className="cc-num">{r.set}</td>
              <td className="cc-num">{r.correspondingMA}</td>
              <td className="cc-num">{r.up}</td>
              <td className="cc-num">{r.down}</td>
              <td className="cc-num">{r.mean}</td>
              <td className="cc-num">{r.correspondingValue}</td>
              <td className="cc-num">{r.error}</td>
              <td className="cc-num">{r.unc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (section.type === 'humidityTemperature' || section.type === 'humidityHumidity') {
    const valueLabel =
      section.type === 'humidityTemperature'
        ? 'Corresponding Temperature'
        : 'Corresponding Humidity'
    const valueUnit =
      section.type === 'humidityTemperature'
        ? '\u00b0C'
        : '%RH'

    return (
      <table className="cc-tbl cc-readings">
        <thead>
          <tr>
            <th rowSpan={2}>S.No.</th>
            <th rowSpan={2}>
              Master Reading
              <small>{valueUnit}</small>
            </th>
            <th colSpan={2} className="cc-group-head">
              Standard Reading
            </th>
            <th rowSpan={2}>
              Mean Value
              <small>mA</small>
            </th>
            <th rowSpan={2}>
              {valueLabel}
              <small>{valueUnit}</small>
            </th>
            <th rowSpan={2}>
              Error
              <small>{valueUnit}</small>
            </th>
            <th rowSpan={2}>Uncertainty</th>
          </tr>
          <tr>
            <th>Up</th>
            <th>Down</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="cc-num">{i + 1}</td>
              <td className="cc-num">{r.set}</td>
              <td className="cc-num">{r.up}</td>
              <td className="cc-num">{r.down}</td>
              <td className="cc-num">{r.mean}</td>
              <td className="cc-num">{r.correspondingValue}</td>
              <td className="cc-num">{r.error}</td>
              <td className="cc-num">{r.unc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  if (section.type === 'switch') {
    return (
      <table className="cc-tbl cc-readings">
        <thead>
          <tr>
            <th rowSpan={2}>S.No.</th>
            <th rowSpan={2}>Master Reading<small>{section.unit}</small></th>
            <th colSpan={2} className="cc-group-head">Switching Point</th>
            <th rowSpan={2}>Mean Value</th>
            <th rowSpan={2}>Corresponding Pressure</th>
            <th rowSpan={2}>Error</th>
            <th rowSpan={2}>Uncertainty</th>
          </tr>
          <tr>
            <th>Up</th>
            <th>Down</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="cc-num">{i + 1}</td>
              <td className="cc-num">{r.set}</td>
              <td className="cc-num">{r.up}</td>
              <td className="cc-num">{r.down}</td>
              <td className="cc-num">{r.mean}</td>
              <td className="cc-num">{r.correspondingPressure}</td>
              <td className="cc-num">{r.error}</td>
              <td className="cc-num">{r.unc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <table className="cc-tbl cc-readings">
      <thead>
        <tr>
          <th rowSpan={2}>S.No.</th>
          <th rowSpan={2}>Calibration Points<small>{section.unit}</small></th>
          <th colSpan={2} className="cc-group-head">Standard Reading</th>
          <th rowSpan={2}>Mean Value</th>
          <th rowSpan={2}>Corresponding Pressure</th>
          <th rowSpan={2}>Error</th>
          <th rowSpan={2}>Uncertainty</th>
        </tr>
        <tr>
          <th>Up</th>
          <th>Down</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="cc-num">{i + 1}</td>
            <td className="cc-num">{r.set}</td>
            <td className="cc-num">{r.up}</td>
            <td className="cc-num">{r.down}</td>
            <td className="cc-num">{r.mean}</td>
            <td className="cc-num">{r.correspondingPressure}</td>
            <td className="cc-num">{r.error}</td>
            <td className="cc-num">{r.unc}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const C = (props) => {
  const source = props.data ?? props
  const parsedStandards = parseJsonList(source.standards ?? source.refStandards)
  const standardsList = parsedStandards.length
    ? parsedStandards
    : source.refStandards
      ? [{ cert: source.refStandards }]
      : []
  const readingSections = normalizeReadingSections(source)
  const normalized = {
    ...source,
    standards: standardsList,
    readingSections,
  }
  const {
    certificate_no = source.certificateNo ?? '',
    ulr_no = source.ulrNo ?? '',
    calibration_date = formatDate(source.calibrationDate),
    date_of_issue = formatDate(source.issueDate),
    due_date = formatDate(source.dueDate),
    status = source.status ?? 'Calibrated & Passed',
    customer_name = source.customer?.name ?? '',
    customer_address = source.customer?.address ?? '',
    customer_contact = source.customer?.phone ?? '',
    customer_gstin = source.customer?.gstin ?? '',
    calibration_location = source.location ?? '',
    calibration_address = source.location ?? '',
    procedure_ref = source.procedureRef ?? '',
    srf_no = source.srfNo ?? '',
    instrument_name = source.instrumentName ?? '',
    instrument_make = source.instrumentMake ?? '',
    instrument_model = source.instrumentModel ?? '',
    instrument_serial = source.instrumentSerial ?? '',
    instrument_range = source.instrumentRange ?? '',
    instrument_resolution = source.instrumentResolution ?? '',
    instrument_accuracy = source.instrumentAccuracy ?? '',
    instrument_tag = source.instrumentTag ?? '',
    condition_on_receipt = source.conditionOnReceipt ?? '',
    standards = standardsList,
    env_temperature = source.envTemperature ?? '',
    env_humidity = source.envHumidity ?? '',
    env_pressure = source.envPressure ?? '',
    readingSections: sections = readingSections,
    custom_remark = source.customRemark ?? '',
    calibrated_by_name = source.calibratedByName ?? '',
    calibrated_by_designation = source.calibratedByDesignation ?? '',
    approved_by_name = source.approvedByName ?? '',
    approved_by_designation = source.approvedByDesignation ?? '',
  } = normalized

  return (
  <article
    className={`cc-page ${sections.length > 1 ? 'cc-page-dense' : ''}`}
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
          <span className="cc-value cc-status-value">
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
              <td>{standardText(s, 'name', 'instrument')}</td>
              <td>{standardText(s, 'make', 'model')}</td>
              <td>{standardText(s, 'serial', 'serialNo', 'id')}</td>
              <td>{standardText(s, 'range')}</td>
              <td>{standardText(s, 'cert', 'certificateNo', 'reportNo')}</td>
              <td className="cc-center">
                {standardText(s, 'valid', 'certExpiry', 'validUpto')}
              </td>
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
      <div className="cc-reading-stack">
        {sections.map((section, index) => (
          <div className="cc-reading-block" key={`${section.type}-${index}`}>
            {sections.length > 1 ? (
              <div className="cc-reading-title">{section.title}</div>
            ) : null}
            <ReadingTable section={section} />
          </div>
        ))}
      </div>
      <div className="cc-note-italic">
        Mean, corresponding value, and error are calculated from the recorded
        up/down readings and the calibrated range where applicable. The
        reported expanded uncertainty is stated with coverage factor k = 2.
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
      <div className="cc-stamp-cell" aria-label="SANC stamp">
        <img
          className="cc-stamp-img"
          src="/sanc-stamp-sign.png"
          alt="SANC stamp"
        />
      </div>
      <div className="cc-sign-cell">
        <div className="cc-role">Approved By</div>
        <div className="cc-sign-space" />
        <div className="cc-sign-name">{approved_by_name}</div>
        <div className="cc-sign-desig">{approved_by_designation}</div>
      </div>
    </section>

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
}

export default C
