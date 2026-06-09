// Mock report data structured around the API shape.
// In production the API response populates these fields; here we provide
// realistic sample values for both certificate types.

export const apiResponse = {
  config: 'SANC',
  environment: 'SANC-QA',
  date: '2025-03-26',
  number: 'SINV-25-00003',
  po: '',
  customer: 'Mr ritesh deshmukh',
  items: [
    { title: 'P00000123', qty: '5' },
    { title: 'P00000124', qty: '5' },
    { title: 'CDU000002', qty: '2' },
  ],
}

// List of available reports for search/selection
export const reportsList = [
  {
    id: 1,
    type: 'calibration',
    certificate_no: 'SANC-CAL-2026-00508',
    customer_name: 'Vijay Transtech Private Limited',
    calibration_date: '05 Jun 2026',
    status: 'Calibrated & Passed',
    instrument_name: 'Pressure Gauge',
  },
  {
    id: 2,
    type: 'calibration',
    certificate_no: 'SANC-CAL-2026-00509',
    customer_name: 'Acme Labs Pvt. Ltd.',
    calibration_date: '06 Jun 2026',
    status: 'Calibrated & Passed',
    instrument_name: 'Pressure Transmitter',
  },
  {
    id: 3,
    type: 'calibration',
    certificate_no: 'SANC-CAL-2026-00510',
    customer_name: 'TechFlow Solutions',
    calibration_date: '07 Jun 2026',
    status: 'Calibrated & Passed',
    instrument_name: 'Digital Multimeter',
  },
  {
    id: 4,
    type: 'test',
    tc_number: 'TC/160824/1043/1',
    customer_name: 'BECTO FLEX CONTAINMENT SYSTEM PVT LTD',
    tc_date: '16/08/2024',
    item_name: 'DIFFERENTIAL PRESSURE GAUGE',
  },
  {
    id: 5,
    type: 'test',
    tc_number: 'TC/150824/1042/1',
    customer_name: 'Industrial Testing Labs',
    tc_date: '15/08/2024',
    item_name: 'FLOW METER',
  },
]

// Full calibration certificate data (values change per report; format stays fixed)
export const calibrationCertificateData = {
  certificate_no: 'SANC-CAL-2026-00508',
  ulr_no: 'CC260626000001',
  calibration_date: '05 Jun 2026',
  date_of_issue: '06 Jun 2026',
  due_date: '05 Jun 2027',
  status: 'Calibrated & Passed',

  customer_name: 'Vijay Transtech Private Limited',
  customer_address:
    'Plot No. 113, Smart Industrial Park, Pithampur, Indore, MP - 454774',
  customer_contact: 'Mr Faiz — 9871545167',
  customer_gstin: '23AABCV1234F1Z5',

  calibration_location: 'SANC Laboratory — In-house',
  calibration_address:
    'Plot No. 733, Road No. 85, GIDC-Sachin, Dist. Surat — 394 230, Gujarat',
  procedure_ref: 'SANC/SOP/CAL-PG/01 Rev.03',
  srf_no: 'SRF/2026/0508',

  instrument_name: 'Pressure Gauge',
  instrument_make: 'Wika',
  instrument_model: 'A-308',
  instrument_serial: 'PG-1187',
  instrument_range: '0 to 10 bar',
  instrument_resolution: '0.05 bar',
  instrument_accuracy: '±1.6% FS (Class 1.6)',
  instrument_tag: 'VTPL-PG-001',
  condition_on_receipt: 'Satisfactory — no visible damage',

  standards: [
    {
      name: 'Digital Manometer',
      make: 'Additel — 681',
      serial: 'AD-681-0921',
      range: '0 to 25 bar',
      cert: 'CAL-25100187/PR/01',
      valid: 'Oct 2027',
    },
    {
      name: 'Dead Weight Tester',
      make: 'Desgranges & Huot — 50200',
      serial: 'DWT-50200-031',
      range: '0.1 to 100 bar',
      cert: 'NABL-411020-2025',
      valid: 'Mar 2028',
    },
  ],

  env_temperature: '23.5',
  env_humidity: '52',
  env_pressure: '1013.2',

  readings: [
    { set: '0.00', unit: 'bar', up: '0.00', down: '0.00', mean: '0.000', error: '+0.000', unc: '0.025' },
    { set: '2.00', unit: 'bar', up: '2.02', down: '2.01', mean: '2.015', error: '+0.015', unc: '0.030' },
    { set: '4.00', unit: 'bar', up: '4.03', down: '4.01', mean: '4.020', error: '+0.020', unc: '0.030' },
    { set: '6.00', unit: 'bar', up: '5.98', down: '5.97', mean: '5.975', error: '-0.025', unc: '0.035' },
    { set: '10.00', unit: 'bar', up: '9.96', down: '9.95', mean: '9.955', error: '-0.045', unc: '0.040' },
  ],

  custom_remark:
    'The instrument was found within the specified tolerance across the calibrated range.',

  calibrated_by_name: 'R. K. Sharma',
  calibrated_by_designation: 'Calibration Engineer',
  approved_by_name: 'Dr. S. M. Patil',
  approved_by_designation: 'Technical Manager',
}

// Test & Conformance Certificate data
export const testCertificateData = {
  customer_name: 'BECTO FLEX CONTAINMENT SYSTEM PVT LTD',
  po_number: 'BF/PO/2024-25/129',
  tc_number: 'TC/160824/1043/1',
  tc_date: '16/08/2024',

  items: [
    {
      sr: 1,
      name: 'DIFFERENTIAL PRESSURE GAUGE',
      qty: 1,
      specs: [
        { key: 'MAKE', value: 'Dwyer' },
        { key: 'MODEL', value: '2000-60PA' },
        { key: 'RANGE', value: '0 to 60 Pa' },
        { key: 'ACCURACY', value: '±2.0% FS' },
        { key: 'DISPLAY', value: '4″ (101.6 mm) diameter dial face' },
        { key: 'PRESSURE LIMIT', value: '-20 in Hg. to 15 psig' },
        {
          key: 'AMBIENT OPERATING LIMIT',
          value: '20 to 140°F (-6.67 to 60°C).',
        },
        {
          key: 'HOUSING',
          value:
            'Die cast aluminum case and bezel, with acrylic cover, Exterior finish is coated grey to withstand 168 hour salt spray corrosion test.',
        },
        {
          key: 'PROCESS CONNECTION',
          value:
            '1/8" female NPT duplicate high and low pressure taps — one pair side and one pair back.',
        },
        { key: 'ENCLOSURE RATING', value: 'IP67.' },
      ],
    },
  ],

  note: 'This is to certify that the following material has been checked for the tests such as Visual, Dimensional & Performance & also found within accuracy.',

  legal:
    'We confirm for specifications and performance for a period of 12 months from the date of commissioning or 18 months from the date of dispatch, whichever is earlier, for manufacturing defects only. We reserve the right of repair or to replace the defective material in parts or in full depending upon the nature of defect & observation. Further all the warranty ceases to exist if instruction manual is not followed.',
}
