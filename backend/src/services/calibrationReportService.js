import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const numberValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).replace(/\(-\)/g, '-').replace(/,/g, '').trim();
  const numeric = Number(normalized.match(/-?\d+(?:\.\d+)?/)?.[0]);
  return Number.isFinite(numeric) ? numeric : null;
};

const formatNumber = (value, digits = 2) => {
  const numeric = numberValue(value);
  if (numeric === null) return value ?? '';
  return numeric.toFixed(digits).replace(/\.?0+$/, '');
};

const parseJson = (value, fallback = null) => {
  if (!value || typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const parsePoints = (instrument) => {
  const parsed = parseJson(instrument.calibrationPoints);
  const rows = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed?.rows)
      ? parsed.rows
      : null;

  if (rows?.length) {
    return rows.map((row) => ({
      set: row.set ?? row.master ?? row.calibrationPoint ?? row.point,
      up: row.up ?? row.standardUp ?? row.switchingUp,
      down: row.down ?? row.standardDown ?? row.switchingDown,
      unc: row.unc ?? row.uncertainty ?? instrument.readingAccuracy ?? instrument.accuracy ?? '',
    }));
  }

  const csvPoints = String(instrument.calibrationPoints || '')
    .split(',')
    .map((point) => numberValue(point))
    .filter((point) => point !== null);

  if (csvPoints.length) {
    return csvPoints.map((point) => ({
      set: point,
      unc: instrument.readingAccuracy ?? instrument.accuracy ?? '',
    }));
  }

  const start = numberValue(instrument.rangeStart) ?? 0;
  const end = numberValue(instrument.rangeEnd) ?? 100;
  const count = inferType(instrument) === 'switch' ? 3 : inferType(instrument) === 'gauge' ? 7 : 5;
  const step = count > 1 ? (end - start) / (count - 1) : 0;

  return Array.from({ length: count }, (_, index) => ({
    set: start + step * index,
    unc: instrument.readingAccuracy ?? instrument.accuracy ?? '',
  }));
};

const inferType = (instrument) => {
  const raw = `${instrument.category || ''} ${instrument.name || ''}`.toLowerCase();
  if (raw.includes('humidity')) return 'humidity';
  if (raw.includes('switch')) return 'switch';
  if (raw.includes('transmitter')) return 'transmitter';
  if (raw.includes('gauge')) return 'gauge';
  return 'gauge';
};

const rangeText = (instrument) => {
  const start = instrument.rangeStart || '';
  const end = instrument.rangeEnd || '';
  const unit = instrument.rangeUnit || '';

  if (start || end) return `${start || '0'} to ${end || ''} ${unit}`.trim();
  return instrument.description || '';
};

const REFERENCE_READING_OFFSETS = {
  digital: {
    0.1: [0.1, 0.1, 0.2, 0.2, 0.3, 0.2],
    0.01: [0.09, 0.08, 0.07, 0.09, 0.09, 0.11],
    0.001: [0.008, 0.023, 0.065, 0.078, 0.022, 0.45],
    1: [0, 1, 1, 0, 0, 0],
  },
  analog: {
    10: [0, 0, 0, 10, 10, 20],
    0.2: [0, 0.4, 0.4, 0.6, 0.6, 0.8],
    5: [0, 5, 5, 5, 10, 10],
  },
};

const referenceOffsetForRow = (instrument, rowIndex, rowCount, converted) => {
  if (converted) return 0;

  const type = String(instrument.type || '').toLowerCase().includes('digital') ? 'digital' : 'analog';
  const resolution = numberValue(instrument.resolution);
  if (resolution === null) return 0;

  const offsets = REFERENCE_READING_OFFSETS[type]?.[resolution];
  if (!offsets?.length) return 0;

  const mappedIndex =
    rowCount > 1
      ? Math.round((rowIndex / (rowCount - 1)) * (offsets.length - 1))
      : 0;

  return offsets[Math.min(offsets.length - 1, Math.max(0, mappedIndex))] ?? 0;
};

const buildRows = (instrument, typeOverride = null) => {
  const type = typeOverride || inferType(instrument);
  const start = numberValue(instrument.rangeStart) ?? 0;
  const end = numberValue(instrument.rangeEnd);
  const points = parsePoints(instrument);
  const maxPoint = Math.max(0, ...points.map((row) => numberValue(row.set)).filter((value) => value !== null));
  const span = end !== null && end !== start ? end - start : maxPoint || 100;
  const unit = instrument.rangeUnit || '';
  const converted = type === 'transmitter' || type === 'humidityTemperature' || type === 'humidityHumidity';

  return points.map((row, index) => {
    const set = numberValue(row.set) ?? 0;
    const correspondingMA = converted ? 4 + (16 / span) * (set - start) : null;
    const defaultReading = converted ? correspondingMA : set;
    const referenceOffset = referenceOffsetForRow(instrument, index, points.length, converted);
    const generatedReading = defaultReading + referenceOffset;
    const up = numberValue(row.up) ?? generatedReading;
    const down = numberValue(row.down) ?? generatedReading;
    const mean = (up + down) / 2;
    const correspondingValue = converted ? (mean - 4) * (span / 16) + start : set;
    const error = converted ? correspondingValue - set : correspondingValue - mean;

    return {
      set: formatNumber(set),
      master: formatNumber(set),
      unit,
      up: formatNumber(up),
      down: formatNumber(down),
      mean: formatNumber(mean),
      correspondingMA: converted ? formatNumber(correspondingMA) : '',
      correspondingValue: converted ? formatNumber(correspondingValue) : '',
      correspondingPressure: formatNumber(correspondingValue),
      error: formatNumber(error, 4),
      unc: row.unc ?? instrument.readingAccuracy ?? instrument.accuracy ?? '',
    };
  });
};

const buildReadings = (instrument) => {
  const type = inferType(instrument);

  if (type === 'humidity') {
    return {
      tableType: 'humidity',
      sections: [
        {
          tableType: 'humidityTemperature',
          title: 'Humidity Transmitter - Temperature',
          unit: 'deg C',
          rows: buildRows(instrument, 'humidityTemperature'),
        },
        {
          tableType: 'humidityHumidity',
          title: 'Humidity Transmitter - Humidity',
          unit: '%RH',
          rows: buildRows(instrument, 'humidityHumidity'),
        },
      ],
    };
  }

  return {
    tableType: type,
    unit: instrument.rangeUnit || '',
    rangeStart: numberValue(instrument.rangeStart) ?? 0,
    highestRange: numberValue(instrument.rangeEnd),
    rows: buildRows(instrument, type),
  };
};

const DEFAULT_REFERENCE_STANDARDS = [
  {
    name: 'Multifunctional Calibrator',
    serial: '68281901172',
    cert: 'CAL-25050083/ET/01',
    reportNo: 'CAL-25050083/ET/01',
    validUpto: '12/05/2026',
  },
  {
    name: 'Digital Manometer',
    serial: '005TTW',
    cert: 'CAL-25100187/PR/03',
    reportNo: 'CAL-25100187/PR/03',
    validUpto: '17/10/2026',
  },
  {
    name: 'Digital Manometer',
    serial: '014L56',
    cert: 'CAL-25100187/PR/02',
    reportNo: 'CAL-25100187/PR/02',
    validUpto: '17/10/2026',
  },
  {
    name: 'Digital Manometer',
    serial: '005PWD',
    cert: 'CAL-25100187/PR/01',
    reportNo: 'CAL-25100187/PR/01',
    validUpto: '17/10/2026',
  },
];

const buildStandards = (standards = []) => {
  if (!standards.length) return DEFAULT_REFERENCE_STANDARDS;

  return standards.map((standard) => ({
    name: standard.instrument,
    serial: standard.serial,
    cert: standard.certificateNo || standard.reportNo,
    reportNo: standard.reportNo,
    validUpto: standard.certExpiry ? standard.certExpiry.toISOString() : '',
  }));
};

const normalizeKey = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

const itemSpecValue = (item, ...keys) => {
  const specs = Array.isArray(item.specs) ? item.specs : [];
  const normalizedKeys = keys.map(normalizeKey);
  const match = specs.find((spec) => normalizedKeys.includes(normalizeKey(spec.key)));
  return match?.value || '';
};

const itemSearchText = (item) =>
  [
    item.name,
    item.title,
    item.description,
    item.itemCode,
    ...(Array.isArray(item.specs) ? item.specs.map((spec) => spec.value) : []),
  ]
    .filter(Boolean)
    .join(' ');

const itemSearchTokens = (item) =>
  [
    item.model,
    item.itemCode,
    item.name,
    item.title,
    item.description,
    itemSpecValue(item, 'model'),
    itemSpecValue(item, 'item code'),
    itemSpecValue(item, 'serial no', 'serial number'),
  ]
    .filter(Boolean)
    .flatMap((value) => String(value).split(/\s+/))
    .map((value) => value.trim())
    .filter((value) => value.length >= 3)
    .slice(0, 12);

const inferCategoryFromItem = (item) => {
  const raw = itemSearchText(item).toLowerCase();
  if (raw.includes('humidity') || raw.includes('rh')) return 'Humidity transmitter';
  if (raw.includes('switch')) return 'Switches';
  if (raw.includes('transmitter') || raw.includes(' tx') || raw.includes('-tx') || raw.includes('tx ')) return 'Transmitter';
  if (raw.includes('gauge') || raw.includes('pressure')) return 'Gauges';
  return 'Gauges';
};

const parseRangeSpec = (value) => {
  const matches = String(value || '').match(/-?\d+(?:\.\d+)?/g) || [];
  const values = matches.map(Number);
  const unit = String(value || '').replace(/[-\d.,\s]+/g, '').trim();

  return {
    start: values.length ? String(values[0]) : '',
    end: values.length ? String(Math.max(...values)) : '',
    unit,
  };
};

const buildFallbackInstrumentFromItem = async (item) => {
  const category = inferCategoryFromItem(item);
  const template = await prisma.instrument.findFirst({
    where: { category: { contains: category.split(' ')[0], mode: 'insensitive' } },
    include: { customer: true, standards: true },
  });

  if (!template) return null;

  const range = parseRangeSpec(itemSpecValue(item, 'range'));
  const itemName = item.name || item.title || item.itemName || 'ERPNext Instrument';
  const itemModel = itemSpecValue(item, 'model') || item.itemCode || itemName;

  return {
    ...template,
    name: itemName,
    make: itemSpecValue(item, 'make') || template.make,
    model: itemModel,
    serial: itemSpecValue(item, 'serial no', 'serial number') || '',
    category,
    rangeStart: range.start || template.rangeStart,
    rangeEnd: range.end || template.rangeEnd,
    rangeUnit: range.unit || template.rangeUnit,
    accuracy: itemSpecValue(item, 'accuracy') || template.accuracy,
    __fallbackTemplate: true,
  };
};

const findInstrumentForItem = async (item, instrumentId) => {
  if (instrumentId) {
    return prisma.instrument.findUnique({
      where: { id: Number(instrumentId) },
      include: { customer: true, standards: true },
    });
  }

  const text = itemSearchText(item);
  const itemName = item.name || item.title || item.itemName || '';
  const tokens = itemSearchTokens(item);
  const searchClauses = [];

  if (itemName.trim()) {
    searchClauses.push({ name: { contains: itemName, mode: 'insensitive' } });
  }

  tokens.forEach((token) => {
    searchClauses.push({ model: { contains: token, mode: 'insensitive' } });
    searchClauses.push({ name: { contains: token, mode: 'insensitive' } });
    searchClauses.push({ serial: { contains: token, mode: 'insensitive' } });
    searchClauses.push({ instrumentId: { contains: token, mode: 'insensitive' } });
  });

  if (!searchClauses.length) return null;

  const candidates = await prisma.instrument.findMany({
    where: {
      OR: searchClauses,
    },
    include: { customer: true, standards: true },
    take: 25,
  });

  const normalizedText = normalizeKey(text);
  return (
    candidates.find((instrument) => normalizeKey(instrument.model) && normalizeKey(instrument.model) === normalizeKey(itemSpecValue(item, 'model'))) ||
    candidates.find((instrument) => normalizeKey(instrument.serial) && normalizeKey(instrument.serial) === normalizeKey(itemSpecValue(item, 'serial no', 'serial number'))) ||
    candidates.find((instrument) => normalizeKey(instrument.model) && normalizedText.includes(normalizeKey(instrument.model))) ||
    candidates.find((instrument) => normalizeKey(instrument.model) && normalizeKey(instrument.model).includes(normalizeKey(itemSpecValue(item, 'model')))) ||
    candidates.find((instrument) => normalizeKey(instrument.name) && normalizedText.includes(normalizeKey(instrument.name))) ||
    candidates[0] ||
    null
  );
};

const buildCertificateNo = (invoiceNumber, instrument) =>
  `CAL-${String(invoiceNumber || 'ERP').replace(/[^\w-]+/g, '-')}-${instrument.id}`;

export const getCalibrationSourceReports = async () =>
  prisma.report.findMany({
    where: {
      type: 'test',
      invoiceId: { not: null },
    },
    include: {
      customer: true,
      invoice: true,
    },
    orderBy: { issueDate: 'desc' },
    take: 50,
  });

export const buildCalibrationReportFromErpItem = async ({ sourceReportId, itemIndex = 0, instrumentId }) => {
  const sourceReport = await prisma.report.findUnique({
    where: { id: Number(sourceReportId) },
    include: {
      customer: true,
      invoice: true,
    },
  });

  if (!sourceReport) {
    const error = new Error('Source ERPNext report not found');
    error.statusCode = 404;
    throw error;
  }

  const items = parseJson(sourceReport.items, []);
  const item = items[Number(itemIndex)] || items[0];

  if (!item) {
    const error = new Error('No purchased instrument found in this PO/invoice');
    error.statusCode = 400;
    throw error;
  }

  const instrument = await findInstrumentForItem(item, instrumentId);
  const resolvedInstrument = instrument || await buildFallbackInstrumentFromItem(item);

  if (!resolvedInstrument) {
    const error = new Error('No matching internal instrument found for selected ERPNext item');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const calibrationDate = now;
  const periodMonths = numberValue(resolvedInstrument.calibrationPeriod) ?? 12;
  const dueDate = new Date(calibrationDate);
  dueDate.setMonth(dueDate.getMonth() + periodMonths);

  const certificateNo = buildCertificateNo(sourceReport.invoice?.invoiceNumber || sourceReport.tcNumber, {
    id: resolvedInstrument.__fallbackTemplate ? `ERP-${sourceReport.id}-${Number(itemIndex)}` : resolvedInstrument.id,
  });
  const reportData = {
    type: 'calibration',
    certificateNo,
    customerId: sourceReport.customerId,
    instrumentId: resolvedInstrument.__fallbackTemplate ? null : resolvedInstrument.id,
    invoiceId: sourceReport.invoiceId,
    issueDate: now,
    status: 'Calibrated & Passed',
    calibrationDate,
    dueDate,
    location: 'Lab',
    instrumentName: resolvedInstrument.name,
    instrumentMake: resolvedInstrument.make,
    instrumentModel: resolvedInstrument.model,
    instrumentSerial: resolvedInstrument.serial,
    instrumentRange: rangeText(resolvedInstrument),
    instrumentResolution: resolvedInstrument.resolution || '',
    instrumentAccuracy: resolvedInstrument.accuracy || '',
    instrumentTag: resolvedInstrument.instrumentId || 'N/A',
    conditionOnReceipt: 'Good',
    envTemperature: '25±5',
    envHumidity: '40-70',
    readings: JSON.stringify(buildReadings(resolvedInstrument)),
    refStandards: JSON.stringify(buildStandards(resolvedInstrument.standards)),
    customRemark: `Generated from ERPNext invoice ${sourceReport.invoice?.invoiceNumber || sourceReport.tcNumber || ''}. PO: ${sourceReport.poNumber || 'N/A'}${resolvedInstrument.__fallbackTemplate ? '. Internal category template used because no exact instrument match was found.' : ''}`,
    calibratedByName: 'Rahul Patel',
    calibratedByDesignation: 'Lab Engineer',
    approvedByName: 'Prashant Patel',
    approvedByDesignation: 'Lab Incharge',
  };

  return prisma.report.upsert({
    where: { certificateNo },
    update: reportData,
    create: reportData,
    include: {
      customer: true,
      instrument: true,
      invoice: true,
    },
  });
};
