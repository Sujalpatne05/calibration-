import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function importStandards() {
  try {
    console.log('Reading Excel file to import standards...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} records\n`);
    console.log('Available columns:', Object.keys(data[0]));
    console.log('\n---\n');
    
    // Step 1: Clear existing standards
    console.log('Step 1: Clearing existing standards...');
    const deleted = await prisma.standard.deleteMany({});
    console.log(`✓ Deleted ${deleted.count} existing standards\n`);
    
    // Step 2: Import standards
    console.log('Step 2: Importing standards...');
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Get the instrument by name and make
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
          errorCount++;
          if (errorCount <= 3) {
            console.log(`✗ Instrument not found: ${instrumentName} (${make})`);
          }
          continue;
        }
        
        // Extract standard information from Excel columns
        const standard1 = row['Standard 1'] ? String(row['Standard 1']).trim() : null;
        const standard2 = row['Standard 2'] ? String(row['Standard 2']).trim() : null;
        
        // Create standard entry if standard data exists
        if (standard1) {
          await prisma.standard.create({
            data: {
              instrumentId: instrument.id,
              instrument: instrumentName,
              calibrationDate: new Date(), // Use current date as we don't have calibration date
              reportNo: standard1 || 'N/A',
              certificateNo: standard1 || 'N/A',
              certExpiry: null,
              make: make,
              serial: serialNo,
              range: row['Range start '] && row['Range End'] 
                ? `${row['Range start ']}-${row['Range End']}` 
                : null,
              accuracy: row['Accuracy'] ? String(row['Accuracy']) : null
            }
          });
          
          successCount++;
          
          if (successCount % 500 === 0) {
            console.log(`  ... ${successCount} standards imported`);
          }
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`✗ Error processing row ${i + 1}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✓ Standards import complete!`);
    console.log(`  Successfully imported: ${successCount}`);
    console.log(`  Failed/Skipped: ${errorCount}`);
    
    // Verify
    console.log('\n---\nVerification:');
    const standardCount = await prisma.standard.count();
    console.log(`  Total standards in database: ${standardCount}`);
    
    const standardsPerInstrument = await prisma.instrument.findMany({
      include: {
        _count: { select: { standards: true } }
      },
      where: {
        standards: {
          some: {}
        }
      },
      take: 10
    });
    
    if (standardsPerInstrument.length > 0) {
      console.log(`\n  Sample instruments with standards:`);
      standardsPerInstrument.forEach(inst => {
        console.log(`    - ${inst.name}: ${inst._count.standards} standard(s)`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importStandards();
