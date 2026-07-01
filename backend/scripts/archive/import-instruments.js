import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function importInstruments() {
  try {
    console.log('Reading Excel file...');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Found ${data.length} records in Excel file\n`);
    
    if (data.length === 0) {
      console.log('No data found in Excel file');
      return;
    }
    
    // Log first row to see the structure
    console.log('Sample record:', data[0]);
    console.log('\nAvailable columns:', Object.keys(data[0]));
    console.log('\n---\n');
    
    // Create or get default customer
    let defaultCustomer = await prisma.customer.findFirst();
    if (!defaultCustomer) {
      defaultCustomer = await prisma.customer.create({
        data: {
          name: 'Default Customer',
          phone: '0000000000'
        }
      });
      console.log('Created default customer:', defaultCustomer.name);
    }
    
    console.log('Importing instruments...\n');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Import each record
    for (const row of data) {
      try {
        // Map Excel columns to Instrument model fields
        const instrument = await prisma.instrument.create({
          data: {
            name: row['Instrument Name'] || row['Name'] || 'Unknown',
            serial: String(row['Serial Number'] || row['Serial'] || row['Sr.No. '] || ''),
            make: row['Make'] || row['Manufacturer'] || '',
            model: String(row['Model'] || ''),  // Convert to string
            category: row['Category '] || row['Category'] || row['Type'] || '',
            customerId: defaultCustomer.id,
            dueDate: row['Due Date'] ? new Date(row['Due Date']) : null
          }
        });
        
        successCount++;
        console.log(`✓ Imported: ${instrument.name} (Serial: ${instrument.serial})`);
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to import row:`, row);
        console.error(`  Error: ${error.message}`);
      }
    }
    
    console.log(`\n---\nImport Summary:`);
    console.log(`✓ Successfully imported: ${successCount}`);
    console.log(`✗ Failed: ${errorCount}`);
    console.log(`Total: ${successCount + errorCount}`);
    
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importInstruments();
