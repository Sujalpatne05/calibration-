import pkg from '@prisma/client';
import logger from '../config/logger.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const validateJsonField = (data, fieldName, expectedRoot) => {
  if (data[fieldName] === undefined || data[fieldName] === null || data[fieldName] === '') return null;

  try {
    const parsed = typeof data[fieldName] === 'string' ? JSON.parse(data[fieldName]) : data[fieldName];

    if (expectedRoot === 'readings') {
      const rows = Array.isArray(parsed) ? parsed : parsed.rows;
      const sections = parsed.sections;

      if (!Array.isArray(rows) && !Array.isArray(sections)) {
        return `${fieldName} must contain rows or sections`;
      }
    }

    if (expectedRoot === 'items' && !Array.isArray(parsed)) {
      return `${fieldName} must be an array`;
    }
  } catch {
    return `${fieldName} must be valid JSON`;
  }

  return null;
};

const sanitizeReportData = (data) => {
  const next = { ...data };
  const errors = [
    validateJsonField(next, 'readings', 'readings'),
    validateJsonField(next, 'items', 'items'),
    validateJsonField(next, 'refStandards', 'items')
  ].filter(Boolean);

  return { data: next, errors };
};

const asString = (value, fallback = '') =>
  value === undefined || value === null || value === '' ? fallback : String(value);

const toJsonString = (value, fallback) => {
  if (typeof value === 'string') return value;
  return JSON.stringify(value ?? fallback);
};

const normalizeCustomer = (customer = {}) => ({
  id: customer.id ?? 0,
  name: asString(customer.name, 'Dummy Customer Pvt. Ltd.'),
  email: asString(customer.email, 'qa@example.com'),
  phone: asString(customer.phone, '9999999999'),
  address: asString(customer.address, 'Plot 1, Test Industrial Area, Surat, Gujarat, India'),
  gstin: asString(customer.gstin, '24DUMMY0000Z1Z5')
});

const validateDummyCalibrationPayload = (payload) => {
  const errors = [];

  if (payload.readings !== undefined) {
    const readingError = validateJsonField(payload, 'readings', 'readings');
    if (readingError) errors.push(readingError);
  }

  if (payload.refStandards !== undefined) {
    const standardError = validateJsonField(payload, 'refStandards', 'items');
    if (standardError) errors.push(standardError);
  }

  if (payload.customer !== undefined && typeof payload.customer !== 'object') {
    errors.push('customer must be an object');
  }

  return errors;
};

const validateDummyTestPayload = (payload) => {
  const errors = [];

  if (payload.items !== undefined) {
    const itemError = validateJsonField(payload, 'items', 'items');
    if (itemError) errors.push(itemError);
  }

  if (payload.customer !== undefined && typeof payload.customer !== 'object') {
    errors.push('customer must be an object');
  }

  return errors;
};

const today = new Date();
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const referenceStandards = [
  {
    name: 'Digital Pressure Calibrator',
    make: 'Fluke 718',
    serial: 'DPC-2406-01',
    range: '0 to 750 Pa',
    certificateNo: 'STD/SANC/2026/041',
    validUpto: '31/12/2026'
  },
  {
    name: 'Process Meter',
    make: 'Yokogawa CA450',
    serial: 'PM-2406-02',
    range: '4 to 20 mA',
    certificateNo: 'STD/SANC/2026/052',
    validUpto: '31/12/2026'
  }
];

const readingFixtures = {
  gauge: {
    tableType: 'gauge',
    unit: 'Pa',
    highestRange: 60,
    rows: [
      { set: '0', up: '0', down: '0', unc: '0.5' },
      { set: '10', up: '10.05', down: '10.03', unc: '0.5' },
      { set: '20', up: '20.04', down: '20.02', unc: '0.5' },
      { set: '30', up: '30.1', down: '30.2', unc: '0.5' },
      { set: '40', up: '40.3', down: '40.2', unc: '0.5' },
      { set: '50', up: '50.2', down: '50.3', unc: '0.5' },
      { set: '60', up: '59.9', down: '59.9', unc: '0.5' }
    ]
  },
  transmitter: {
    tableType: 'transmitter',
    unit: 'Pa',
    highestRange: 750,
    rows: [
      { set: '0', up: '4.1', down: '4.1', unc: '0.8' },
      { set: '175', up: '7.9', down: '7.9', unc: '0.8' },
      { set: '375', up: '12.15', down: '12.15', unc: '0.8' },
      { set: '550', up: '15.85', down: '15.85', unc: '0.8' },
      { set: '750', up: '20', down: '20', unc: '0.8' }
    ]
  },
  switch: {
    tableType: 'switch',
    unit: 'Pa',
    highestRange: 20,
    rows: [
      { set: '0', up: '0', down: '0', unc: '0.5' },
      { set: '10', up: '10.05', down: '10.03', unc: '0.5' },
      { set: '20', up: '20.04', down: '20.02', unc: '0.5' }
    ]
  },
  humidity: {
    tableType: 'humidity',
    sections: [
      {
        tableType: 'humidityTemperature',
        title: 'Humidity Transmitter - Temperature',
        unit: 'deg C',
        highestRange: 100,
        rows: [
          { set: '0', up: '0.1', down: '0.2', unc: '1.0' },
          { set: '25', up: '7.9', down: '7.9', unc: '1.0' },
          { set: '50', up: '12.15', down: '12.15', unc: '1.0' },
          { set: '75', up: '15.85', down: '15.85', unc: '1.0' },
          { set: '100', up: '20', down: '20', unc: '1.0' }
        ]
      },
      {
        tableType: 'humidityHumidity',
        title: 'Humidity Transmitter - Humidity',
        unit: '%RH',
        highestRange: 100,
        rows: [
          { set: '0', up: '0.1', down: '0.2', unc: '1.5' },
          { set: '25', up: '7.9', down: '7.9', unc: '1.5' },
          { set: '50', up: '12.15', down: '12.15', unc: '1.5' },
          { set: '75', up: '15.85', down: '15.85', unc: '1.5' },
          { set: '100', up: '20', down: '20', unc: '1.5' }
        ]
      }
    ]
  }
};

const dummyInstrumentByCase = {
  gauge: {
    name: 'Differential Pressure Gauge',
    make: 'Magnehelic',
    model: '2000-60PA',
    serial: 'DPG-DUMMY-001',
    range: '0 to 60 Pa',
    resolution: '1 Pa',
    accuracy: '+/-0.5 Pa',
    category: 'Gauge'
  },
  transmitter: {
    name: 'Differential Pressure Transmitter',
    make: 'Dwyer',
    model: 'MS-751',
    serial: 'DPT-DUMMY-001',
    range: '0 to 750 Pa',
    resolution: '0.01 mA',
    accuracy: '+/-0.8 Pa',
    category: 'Transmitter'
  },
  switch: {
    name: 'Differential Pressure Switch',
    make: 'Dwyer',
    model: 'ADPS',
    serial: 'DPS-DUMMY-001',
    range: '0 to 20 Pa',
    resolution: '1 Pa',
    accuracy: '+/-0.5 Pa',
    category: 'Switch'
  },
  humidity: {
    name: 'Humidity & Temperature Transmitter',
    make: 'Rotronic',
    model: 'HF5',
    serial: 'HDT-DUMMY-001',
    range: '0 to 100 %RH / 0 to 100 deg C',
    resolution: '0.1 %RH / 0.1 deg C',
    accuracy: '+/-1.5 %RH / +/-1.0 deg C',
    category: 'Humidity Transmitter'
  }
};

const buildDummyCalibrationReport = (caseName = 'gauge') => {
  const selectedCase = readingFixtures[caseName] ? caseName : 'gauge';
  const instrument = dummyInstrumentByCase[selectedCase];

  return {
    id: `dummy-${selectedCase}`,
    type: 'calibration',
    certificateNo: `SANC-DUMMY-${selectedCase.toUpperCase()}-001`,
    tcNumber: null,
    issueDate: today.toISOString(),
    status: 'Calibrated & Passed',
    ulrNo: `DUMMY-ULR-${selectedCase.toUpperCase()}-2026`,
    calibrationDate: today.toISOString(),
    dueDate: addDays(today, 365).toISOString(),
    location: 'At SANC Laboratory',
    procedureRef: 'SOP/SANC/PR-01',
    srfNo: `SRF-DUMMY-${selectedCase.toUpperCase()}-001`,
    instrumentName: instrument.name,
    instrumentMake: instrument.make,
    instrumentModel: instrument.model,
    instrumentSerial: instrument.serial,
    instrumentRange: instrument.range,
    instrumentResolution: instrument.resolution,
    instrumentAccuracy: instrument.accuracy,
    instrumentTag: `${selectedCase.toUpperCase()}-TAG-01`,
    instrumentCategory: instrument.category,
    conditionOnReceipt: 'Satisfactory',
    envTemperature: '25.0',
    envHumidity: '52',
    envPressure: '1013',
    readings: JSON.stringify(readingFixtures[selectedCase]),
    refStandards: JSON.stringify(referenceStandards),
    customRemark: 'Dummy data generated for certificate format and calculation testing only.',
    calibratedByName: 'Rahul Patel',
    calibratedByDesignation: 'Lab Engineer',
    approvedByName: 'Prashant Patel',
    approvedByDesignation: 'Lab Incharge',
    customer: normalizeCustomer(),
    instrument: {
      id: 0,
      name: instrument.name,
      serial: instrument.serial,
      make: instrument.make,
      model: instrument.model,
      category: instrument.category
    }
  };
};

export const getDummyCalibrationReport = async (req, res) => {
  const report = buildDummyCalibrationReport(req.query.case);
  res.json(report);
};

export const postDummyCalibrationReport = async (req, res) => {
  const base = buildDummyCalibrationReport(req.body?.case);
  const errors = validateDummyCalibrationPayload(req.body ?? {});

  if (errors.length) return res.status(400).json({ errors });

  const next = {
    ...base,
    ...req.body,
    id: 'dummy-custom-calibration',
    type: 'calibration',
    customer: normalizeCustomer(req.body?.customer ?? base.customer),
    readings: toJsonString(req.body?.readings, JSON.parse(base.readings)),
    refStandards: toJsonString(req.body?.refStandards, JSON.parse(base.refStandards)),
    instrument: {
      ...base.instrument,
      ...(req.body?.instrument ?? {})
    }
  };

  res.json(next);
};

const dummyTestItems = [
  {
    sr: 1,
    name: 'DIFFERENTIAL PRESSURE GAUGE',
    qty: 1,
    specs: [
      { key: 'MAKE', value: 'Dwyer' },
      { key: 'MODEL', value: '2000-60PA' },
      { key: 'RANGE', value: '0 to 60 Pa' },
      { key: 'ACCURACY', value: '+/-2.0% FS' },
      { key: 'DISPLAY', value: '4 inch diameter dial face' },
      { key: 'PRESSURE LIMIT', value: '-20 in Hg. to 15 psig' },
      { key: 'AMBIENT OPERATING LIMIT', value: '20 to 140 F (-6.67 to 60 C)' },
      { key: 'HOUSING', value: 'Die cast aluminum case and bezel with acrylic cover' },
      { key: 'PROCESS CONNECTION', value: '1/8 inch female NPT high and low pressure taps' },
      { key: 'ENCLOSURE RATING', value: 'IP67' }
    ]
  }
];

const buildDummyTestReport = () => ({
  id: 'dummy-test',
  type: 'test',
  certificateNo: 'SANC-DUMMY-TC-001',
  tcNumber: 'TC/DUMMY/2026/001',
  poNumber: 'PO-DUMMY-001',
  issueDate: today.toISOString(),
  tcDate: today.toISOString(),
  status: 'issued',
  items: JSON.stringify(dummyTestItems),
  notes:
    'This is to certify that the following material has been checked for Visual, Dimensional and Performance tests and found within accuracy.',
  legalDisclaimer:
    'We confirm specifications and performance as per supplied item details and applicable internal quality procedures.',
  customer: normalizeCustomer({
    name: 'Dummy Test Customer Pvt. Ltd.',
    phone: '8888888888',
    email: 'tc-qa@example.com',
    address: 'Dummy TC Industrial Area, Surat, Gujarat, India'
  }),
  instrumentName: 'Differential Pressure Gauge',
  instrumentMake: 'Dwyer',
  instrumentModel: '2000-60PA',
  instrumentSerial: 'TC-DUMMY-001',
  instrumentRange: '0 to 60 Pa',
  instrumentAccuracy: '+/-2.0% FS',
  instrument: {
    id: 0,
    name: 'Differential Pressure Gauge',
    serial: 'TC-DUMMY-001',
    make: 'Dwyer',
    model: '2000-60PA',
    category: 'Gauge'
  }
});

export const getDummyTestReport = async (_req, res) => {
  res.json(buildDummyTestReport());
};

export const postDummyTestReport = async (req, res) => {
  const base = buildDummyTestReport();
  const errors = validateDummyTestPayload(req.body ?? {});

  if (errors.length) return res.status(400).json({ errors });

  const next = {
    ...base,
    ...req.body,
    id: 'dummy-custom-test',
    type: 'test',
    customer: normalizeCustomer(req.body?.customer ?? base.customer),
    items: toJsonString(req.body?.items, JSON.parse(base.items)),
    instrument: {
      ...base.instrument,
      ...(req.body?.instrument ?? {})
    }
  };

  res.json(next);
};

export const getAllReports = async (req, res) => {
  try {
    const { type, search } = req.query;
    const requestedLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(requestedLimit, 1), 100)
      : 50;

    const where = {};

    if (type) {
      where.type = type;
    }

    if (search) {
      where.OR = [
        { certificateNo: { contains: search, mode: 'insensitive' } },
        { tcNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { instrumentName: { contains: search, mode: 'insensitive' } }
      ];
    }

    const reports = await prisma.report.findMany({
      where,
      include: { 
        customer: true, 
        instrument: true
      },
      orderBy: { issueDate: 'desc' },
      take: limit
    });

    res.json(reports);
  } catch (error) {
    logger.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const getReportById = async (req, res) => {
  try {
    const { id } = req.params;

    const report = await prisma.report.findUnique({
      where: { id: parseInt(id) },
      include: { 
        customer: true, 
        instrument: true,
        invoice: true
      }
    });

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    logger.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
};

export const createReport = async (req, res) => {
  try {
    const { data, errors } = sanitizeReportData(req.validated ?? req.body);
    if (errors.length) return res.status(400).json({ errors });

    const report = await prisma.report.create({
      data,
      include: { 
        customer: true, 
        instrument: true,
        invoice: true
      }
    });

    logger.info(`Report created: ${report.id}`);
    res.status(201).json(report);
  } catch (error) {
    logger.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, errors } = sanitizeReportData(req.validated ?? req.body);
    if (errors.length) return res.status(400).json({ errors });

    const report = await prisma.report.update({
      where: { id: parseInt(id) },
      data,
      include: { 
        customer: true, 
        instrument: true,
        invoice: true
      }
    });

    logger.info(`Report updated: ${id}`);
    res.json(report);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report not found' });
    }
    logger.error('Update report error:', error);
    res.status(500).json({ error: 'Failed to update report' });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.report.delete({
      where: { id: parseInt(id) }
    });

    logger.info(`Report deleted: ${id}`);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Report not found' });
    }
    logger.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
};
