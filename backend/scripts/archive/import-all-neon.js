import XLSX from 'xlsx'
import pkg from '@prisma/client'

const { PrismaClient } = pkg
const prisma = new PrismaClient()

const workbookPath = '../Instrument Data-Final.xlsx'
const sheetNames = ['Merged', 'Sheet2']
const batchSize = 250

const text = (value) => (value === undefined || value === null ? '' : String(value).trim())
const compact = (value) => (value === '' ? null : value)

const chunks = (items, size) => {
  const out = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const rangeText = (row) => {
  const start = text(row['Range start '])
  const end = text(row['Range End'])
  const unit = text(row.Unit)

  if (start && end) return `${start}-${end}${unit ? ` ${unit}` : ''}`
  if (start) return `${start}${unit ? ` ${unit}` : ''}`
  if (end) return `${end}${unit ? ` ${unit}` : ''}`
  return ''
}

const numberValue = (value) => {
  if (value === undefined || value === null || value === '') return null
  const numeric = Number(String(value).replace(/,/g, '').trim())
  return Number.isFinite(numeric) ? numeric : null
}

const formatNumber = (value) => {
  const numeric = numberValue(value)
  if (numeric === null) return text(value)
  return numeric.toFixed(4).replace(/\.?0+$/, '')
}

const tableTypeForRow = (row) => {
  const value = `${text(row['Category '])} ${text(row.Category)} ${text(row['Instrument Name'])}`.toLowerCase()

  if (value.includes('humidity')) return 'humidity'
  if (value.includes('switch')) return 'switch'
  if (value.includes('transmitter')) return 'transmitter'
  if (value.includes('gauge')) return 'gauge'
  return 'gauge'
}

const generatedPoints = (row) => {
  const start = numberValue(row['Range start '])
  const end = numberValue(row['Range End'])

  if (start === null || end === null || start === end) {
    return start !== null ? [formatNumber(start)] : []
  }

  const step = (end - start) / 5
  return Array.from({ length: 6 }, (_, index) => formatNumber(start + step * index))
}

const calibrationPoints = (row) =>
  [
    row['Calibration Points'],
    row.__EMPTY,
    row.__EMPTY_1,
    row.__EMPTY_2,
    row.__EMPTY_3,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map(text)

const buildReadings = (row) => {
  const points = calibrationPoints(row)
  const resolvedPoints = points.length ? points : generatedPoints(row)
  const unit = text(row.Unit)
  const uncertainty = text(row['Reading Accuracy ']) || text(row.Accuracy)
  const highestRange = numberValue(row['Range End']) ?? numberValue(row['Range start '])
  const tableType = tableTypeForRow(row)

  const rows = resolvedPoints.map((point) => ({
    set: point,
    master: point,
    unit,
    up: '',
    down: '',
    mean: '',
    error: '',
    unc: uncertainty,
  }))

  if (tableType === 'humidity') {
    return {
      tableType,
      highestRange,
      unit,
      uncertainty,
      sections: [
        {
          tableType: 'humidityTemperature',
          title: 'Humidity Transmitter - Temperature',
          unit: '\u00b0C',
          highestRange: highestRange ?? 100,
          rows,
        },
        {
          tableType: 'humidityHumidity',
          title: 'Humidity Transmitter - Humidity',
          unit: '%RH',
          highestRange: highestRange ?? 100,
          rows,
        },
      ],
    }
  }

  return {
    tableType,
    highestRange,
    unit,
    uncertainty,
    rows,
  }
}

const expectedOutput = (tableType, point, highestRange, unit) => {
  const pointNumber = numberValue(point)

  if (tableType === 'transmitter' && highestRange && pointNumber !== null) {
    return `${formatNumber(4 + (16 / highestRange) * pointNumber)} mA`
  }

  if (tableType === 'humidity' && highestRange && pointNumber !== null) {
    return `${formatNumber(4 + (16 / highestRange) * pointNumber)} mA / ${formatNumber(pointNumber)} ${unit || '%RH'}`
  }

  return `${formatNumber(point)}${unit ? ` ${unit}` : ''}`
}

const buildConformanceChecks = (row) => {
  const tableType = tableTypeForRow(row)
  const highestRange = numberValue(row['Range End']) ?? numberValue(row['Range start '])
  const points = calibrationPoints(row)
  const resolvedPoints = points.length ? points : generatedPoints(row)
  const unit = text(row.Unit)
  const accuracy = text(row['Reading Accuracy ']) || text(row.Accuracy) || 'As specified'

  return [
    { test: 'Visual inspection', reference: 'No physical damage', observed: 'Accepted', result: 'Conforms' },
    { test: 'Dimensional inspection', reference: 'As per model/specification', observed: 'Accepted', result: 'Conforms' },
    ...resolvedPoints.map((point) => ({
      test:
        tableType === 'switch'
          ? 'Switching point'
          : tableType === 'transmitter'
            ? 'Output signal'
            : tableType === 'humidity'
              ? 'Temperature / humidity output'
              : 'Performance reading',
      reference: `${formatNumber(point)}${unit ? ` ${unit}` : ''}`,
      observed: expectedOutput(tableType, point, highestRange, unit),
      result: `Within ${accuracy}`,
    })),
  ]
}

const buildTestItems = (row, instrument, range) => [
  {
    sr: 1,
    name: instrument.name,
    qty: 1,
    specs: [
      { key: 'MAKE', value: instrument.make || 'N/A' },
      { key: 'MODEL', value: instrument.model || 'N/A' },
      { key: 'SERIES', value: text(row.Series) || 'N/A' },
      { key: 'CATEGORY', value: text(row['Category ']) || text(row.Category) || 'N/A' },
      { key: 'SERIAL NO', value: instrument.serial || 'N/A' },
      { key: 'RANGE', value: range || 'N/A' },
      { key: 'RESOLUTION', value: text(row.Resolution) || 'N/A' },
      { key: 'ACCURACY', value: text(row.Accuracy) || 'N/A' },
      { key: 'DESCRIPTION', value: text(row.Description) || 'N/A' },
    ],
    conformanceChecks: buildConformanceChecks(row),
  },
]

const keyForRow = (row, sheetName, sheetIndex) =>
  [
    sheetName,
    sheetIndex,
    text(row.Make) || 'Unknown Customer',
    text(row['Instrument Name']) || 'Unknown',
    text(row['Sr.No. ']) || `${sheetName}-${sheetIndex}`,
  ].join('|')

async function createInBatches(label, model, data) {
  let total = 0
  for (const batch of chunks(data, batchSize)) {
    const result = await model.createMany({ data: batch })
    total += result.count
    console.log(`  ${label}: ${total}/${data.length}`)
  }
  return total
}

async function main() {
  console.log('Loading Instrument Data-Final.xlsx into Neon...')

  const workbook = XLSX.readFile(workbookPath)
  const sourceRows = sheetNames.flatMap((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName] || [])
    return rows.map((row, index) => ({ row, sheetName, sheetIndex: index + 1 }))
  })

  console.log(`Found ${sourceRows.length} rows across ${sheetNames.join(', ')}.`)

  console.log('Clearing imported business tables...')
  await prisma.report.deleteMany({})
  await prisma.invoice.deleteMany({})
  await prisma.standard.deleteMany({})
  await prisma.instrument.deleteMany({})
  await prisma.customer.deleteMany({})

  const customerNames = [...new Set(sourceRows.map(({ row }) => text(row.Make) || 'Unknown Customer'))]
  await createInBatches(
    'customers',
    prisma.customer,
    customerNames.map((name) => ({ name, phone: '', address: '' }))
  )

  const customers = await prisma.customer.findMany()
  const customerIdByName = new Map(customers.map((customer) => [customer.name, customer.id]))

  const instrumentRows = sourceRows.map(({ row, sheetName, sheetIndex }) => ({
    name: text(row['Instrument Name']) || 'Unknown',
    serial: text(row['Sr.No. ']) || `${sheetName}-${sheetIndex}`,
    make: text(row.Make) || 'Unknown Customer',
    model: text(row.Model),
    category: text(row['Category ']) || text(row.Category),
    dueDate: null,
    customerId: customerIdByName.get(text(row.Make) || 'Unknown Customer'),
  }))

  await createInBatches('instruments', prisma.instrument, instrumentRows)

  const instruments = await prisma.instrument.findMany({ orderBy: { id: 'asc' } })
  if (instruments.length !== sourceRows.length) {
    throw new Error(`Expected ${sourceRows.length} instruments, found ${instruments.length}`)
  }

  const standards = []
  const invoices = []
  const reports = []
  const now = new Date()
  const invoiceDueDate = new Date(now)
  invoiceDueDate.setDate(invoiceDueDate.getDate() + 30)

  sourceRows.forEach(({ row, sheetName, sheetIndex }, index) => {
    const instrument = instruments[index]
    const sequence = index + 1
    const padded = String(sequence).padStart(4, '0')
    const range = rangeText(row)
    const standardValues = [text(row['Standard 1']), text(row['Standard 2']), text(row['Standard 3'])].filter(Boolean)

    standards.push(
      ...standardValues.map((certificateNo) => ({
        instrumentId: instrument.id,
        instrument: instrument.name,
        calibrationDate: now,
        reportNo: certificateNo,
        certificateNo,
        certExpiry: null,
        make: instrument.make,
        serial: instrument.serial,
        range: compact(range),
        accuracy: compact(text(row.Accuracy)),
      }))
    )

    invoices.push({
      invoiceNumber: `INV-${padded}`,
      customerId: instrument.customerId,
      calibrationDate: now,
      issueDate: now,
      dueDate: invoiceDueDate,
      amount: 0,
      status: 'pending',
    })

    reports.push({
      type: 'calibration',
      certificateNo: `CERT-${sequence}`,
      customerId: instrument.customerId,
      instrumentId: instrument.id,
      issueDate: now,
      status: 'draft',
      calibrationDate: now,
      dueDate: null,
      location: '',
      procedureRef: '',
      srfNo: '',
      instrumentName: instrument.name,
      instrumentMake: instrument.make,
      instrumentModel: instrument.model,
      instrumentSerial: instrument.serial,
      instrumentRange: range,
      instrumentResolution: text(row.Resolution),
      instrumentAccuracy: text(row.Accuracy),
      conditionOnReceipt: '',
      envTemperature: '',
      envHumidity: '',
      envPressure: '',
      readings: JSON.stringify(buildReadings(row)),
      refStandards: JSON.stringify(
        standardValues.map((certificateNo) => ({
          name: 'Reference Standard',
          make: '',
          serial: '',
          range,
          cert: certificateNo,
          valid: '',
        }))
      ),
      customRemark: text(row.Description),
    })

    reports.push({
      type: 'test',
      certificateNo: `TCC-${sequence}`,
      tcNumber: `TC-${padded}`,
      customerId: instrument.customerId,
      instrumentId: instrument.id,
      issueDate: now,
      status: 'approved',
      instrumentName: instrument.name,
      instrumentMake: instrument.make,
      instrumentModel: instrument.model,
      instrumentSerial: instrument.serial,
      poNumber: `PO-${padded}`,
      tcDate: now,
      items: JSON.stringify(buildTestItems(row, instrument, range)),
      legalDisclaimer:
        'This is to certify that the listed item has been checked for visual, dimensional and performance requirements and found conforming.',
      notes: text(row.Description),
    })
  })

  await createInBatches('standards', prisma.standard, standards)
  await createInBatches('invoices', prisma.invoice, invoices)
  await createInBatches('reports', prisma.report, reports)

  const [customerCount, instrumentCount, standardCount, invoiceCount, calibrationCount, testCount] =
    await Promise.all([
      prisma.customer.count(),
      prisma.instrument.count(),
      prisma.standard.count(),
      prisma.invoice.count(),
      prisma.report.count({ where: { type: 'calibration' } }),
      prisma.report.count({ where: { type: 'test' } }),
    ])

  console.log('\nFinal Neon counts:')
  console.log(`Customers: ${customerCount}`)
  console.log(`Instruments: ${instrumentCount}`)
  console.log(`Standards: ${standardCount}`)
  console.log(`Invoices: ${invoiceCount}`)
  console.log(`Calibration reports: ${calibrationCount}`)
  console.log(`Test & conformance reports: ${testCount}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
