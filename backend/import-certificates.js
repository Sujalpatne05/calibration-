import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

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
                  instrumentRange: row['Range start '] && row['Range End']
                    ? `${row['Range start ']}-${row['Range End']}`
                    : null,
                  instrumentAccuracy: row['Accuracy'] ? String(row['Accuracy']) : null,
                  
                  // Reference standards
                  refStandards: standard1 || null,
                  
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
