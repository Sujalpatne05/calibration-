import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const text = (value) => (value === undefined || value === null ? '' : String(value).trim());

const numberValue = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numeric = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(numeric) ? numeric : null;
};

const formatNumber = (value) => {
  const numeric = numberValue(value);
  if (numeric === null) return text(value);
  return numeric.toFixed(4).replace(/\.?0+$/, '');
};

const tableTypeForRow = (row) => {
  const value = `${text(row['Category '])} ${text(row.Category)} ${text(row['Instrument Name'])}`.toLowerCase();

  if (value.includes('humidity')) return 'humidity';
  if (value.includes('switch')) return 'switch';
  if (value.includes('transmitter')) return 'transmitter';
  if (value.includes('gauge')) return 'gauge';
  return 'gauge';
};

const calibrationPoints = (row) =>
  [
    row['Calibration Points'],
    row.__EMPTY,
    row.__EMPTY_1,
    row.__EMPTY_2,
    row.__EMPTY_3,
  ]
    .filter((value) => value !== undefined && value !== null && value !== '')
    .map(text);

const generatedPoints = (row) => {
  const start = numberValue(row['Range start ']);
  const end = numberValue(row['Range End']);

  if (start === null || end === null || start === end) {
    return start !== null ? [formatNumber(start)] : [];
  }

  const step = (end - start) / 5;
  return Array.from({ length: 6 }, (_, index) => formatNumber(start + step * index));
};

const buildReadings = (row) => {
  const resolvedPoints = calibrationPoints(row);
  const points = resolvedPoints.length ? resolvedPoints : generatedPoints(row);
  const unit = text(row.Unit);
  const uncertainty = text(row['Reading Accuracy ']) || text(row.Accuracy);
  const highestRange = numberValue(row['Range End']) ?? numberValue(row['Range start ']);
  const tableType = tableTypeForRow(row);
  const rows = points.map((point) => ({
    set: point,
    master: point,
    unit,
    up: '',
    down: '',
    mean: '',
    error: '',
    unc: uncertainty,
  }));

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
    };
  }

  return { tableType, highestRange, unit, uncertainty, rows };
};

const expectedOutput = (tableType, point, highestRange, unit) => {
  const pointNumber = numberValue(point);

  if (tableType === 'transmitter' && highestRange && pointNumber !== null) {
    return `${formatNumber(4 + (16 / highestRange) * pointNumber)} mA`;
  }

  if (tableType === 'humidity' && highestRange && pointNumber !== null) {
    return `${formatNumber(4 + (16 / highestRange) * pointNumber)} mA / ${formatNumber(pointNumber)} ${unit || '%RH'}`;
  }

  return `${formatNumber(point)}${unit ? ` ${unit}` : ''}`;
};

const buildConformanceChecks = (row) => {
  const tableType = tableTypeForRow(row);
  const highestRange = numberValue(row['Range End']) ?? numberValue(row['Range start ']);
  const resolvedPoints = calibrationPoints(row);
  const points = resolvedPoints.length ? resolvedPoints : generatedPoints(row);
  const unit = text(row.Unit);
  const accuracy = text(row['Reading Accuracy ']) || text(row.Accuracy) || 'As specified';

  return [
    { test: 'Visual inspection', reference: 'No physical damage', observed: 'Accepted', result: 'Conforms' },
    { test: 'Dimensional inspection', reference: 'As per model/specification', observed: 'Accepted', result: 'Conforms' },
    ...points.map((point) => ({
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
  ];
};

const rangeText = (row) => {
  const start = text(row['Range start ']);
  const end = text(row['Range End']);
  const unit = text(row.Unit);

  if (start && end) return `${start}-${end}${unit ? ` ${unit}` : ''}`;
  if (start) return `${start}${unit ? ` ${unit}` : ''}`;
  if (end) return `${end}${unit ? ` ${unit}` : ''}`;
  return '';
};

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
];

async function importCertificates() {
  try {
    console.log('Importing certificate data from Excel...\n');
    
    // Read both sheets
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    
    let totalReports = 0;
    let totalErrors = 0;
    
    for (const sheetName of ['Merged', 'Sheet2']) {
      console.log(`Processing sheet: "${sheetName}"...`);
      
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      let sheetSuccessCount = 0;
      let sheetErrorCount = 0;
      
      for (const row of data) {
        try {
          const make = (row['Make'] || '').trim();
          const instrumentName = row['Instrument Name'] || 'Unknown';
          const serialNo = String(row['Sr.No. '] || '');
          
          // Find the instrument
          const instrument = await prisma.instrument.findFirst({
            where: {
              name: instrumentName,
              make: make,
              serial: serialNo
            }
          });
          
          if (!instrument) {
            sheetErrorCount++;
            continue;
          }
          
          // Get customer
          const customer = await prisma.customer.findFirst({
            where: {
              instruments: {
                some: { id: instrument.id }
              }
            }
          });
          
          if (!customer) {
            sheetErrorCount++;
            continue;
          }
          
          // Extract certificate data
          const calibrationCertNo = row['Calibration Certificate'] 
            ? String(row['Calibration Certificate']).trim() 
            : null;
          const testingCertNo = row['Testing Certificate']
            ? String(row['Testing Certificate']).trim()
            : null;
          const standard1 = row['Standard 1']
            ? String(row['Standard 1']).trim()
            : null;
          const standardValues = [
            text(row['Standard 1']),
            text(row['Standard 2']),
            text(row['Standard 3'])
          ].filter(Boolean);
          const range = rangeText(row);
          
          // Create calibration report if we have certificate data
          if (calibrationCertNo || standard1) {
            try {
              await prisma.report.create({
                data: {
                  type: 'calibration',
                  certificateNo: calibrationCertNo || `CERT-${instrument.id}`,
                  customerId: customer.id,
                  instrumentId: instrument.id,
                  status: 'draft',
                  
                  // Certificate Fields
                  instrumentName: instrumentName,
                  instrumentMake: make,
                  instrumentModel: row['Model'] ? String(row['Model']) : null,
                  instrumentSerial: serialNo,
                  instrumentRange: range || null,
                  instrumentAccuracy: row['Accuracy'] ? String(row['Accuracy']) : null,
                  readings: JSON.stringify(buildReadings(row)),
                  
                  // Reference standards
                  refStandards: JSON.stringify(
                    standardValues.map((certificateNo) => ({
                      name: 'Reference Standard',
                      make: '',
                      serial: '',
                      range,
                      cert: certificateNo,
                      valid: ''
                    }))
                  ),
                  
                  // Dates
                  calibrationDate: new Date(),
                  issueDate: new Date()
                }
              });
              
              sheetSuccessCount++;
            } catch (error) {
              // Report might already exist, continue
              sheetErrorCount++;
            }
          }

          if (testingCertNo) {
            try {
              await prisma.report.create({
                data: {
                  type: 'test',
                  certificateNo: `TCC-${testingCertNo}`,
                  tcNumber: testingCertNo,
                  customerId: customer.id,
                  instrumentId: instrument.id,
                  status: 'approved',
                  issueDate: new Date(),
                  poNumber: null,
                  tcDate: new Date(),
                  instrumentName,
                  instrumentMake: make,
                  instrumentModel: row['Model'] ? String(row['Model']) : null,
                  instrumentSerial: serialNo,
                  items: JSON.stringify(buildTestItems(row, instrument, range)),
                  legalDisclaimer:
                    'We confirm for specifications and performance for a period of 12 months from the date of commissioning or 18 months from the date of dispatch, whichever is earlier, for manufacturing defects only.',
                  notes:
                    'This is to certify that the material has been checked for Visual, Dimensional and Performance tests and found within accuracy.'
                }
              });

              sheetSuccessCount++;
            } catch (error) {
              sheetErrorCount++;
            }
          }
          
        } catch (error) {
          sheetErrorCount++;
        }
      }
      
      console.log(`  ✓ Processed ${data.length} records`);
      console.log(`  ✓ Created reports: ${sheetSuccessCount}`);
      console.log(`  ✗ Errors/Skipped: ${sheetErrorCount}\n`);
      
      totalReports += sheetSuccessCount;
      totalErrors += sheetErrorCount;
    }
    
    console.log('---\nFinal Summary:');
    console.log(`✓ Total reports created: ${totalReports}`);
    console.log(`✗ Total errors/skipped: ${totalErrors}`);
    
    // Verify
    const reportCount = await prisma.report.count();
    console.log(`\n✓ Total reports in database: ${reportCount}`);
    
    const reportsByType = await prisma.report.groupBy({
      by: ['type'],
      _count: true
    });
    
    console.log('\nReports by type:');
    reportsByType.forEach(r => {
      console.log(`  ${r.type}: ${r._count}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importCertificates();
