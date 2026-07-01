import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function importSheet2() {
  try {
    console.log('Importing data from Sheet2...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets['Sheet2'];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Found ${data.length} records in Sheet2\n`);
    
    // Extract unique customers from Make column
    const uniqueCustomers = new Set();
    for (const row of data) {
      const make = (row['Make'] || '').trim();
      if (make) uniqueCustomers.add(make);
    }
    
    console.log(`Unique customers in Sheet2: ${uniqueCustomers.size}`);
    Array.from(uniqueCustomers).forEach(c => console.log(`  - ${c}`));
    console.log('');
    
    // Get all existing customers
    const existingCustomers = await prisma.customer.findMany();
    const customerMap = {};
    existingCustomers.forEach(c => {
      customerMap[c.name.toLowerCase().trim()] = c.id;
    });
    
    // Step 1: Create any new customers from Sheet2
    console.log('Step 1: Creating new customers if needed...');
    let newCustomerCount = 0;
    
    for (const customerName of uniqueCustomers) {
      const key = customerName.toLowerCase().trim();
      if (!customerMap[key]) {
        try {
          const customer = await prisma.customer.create({
            data: {
              name: customerName,
              phone: '',
              address: ''
            }
          });
          customerMap[key] = customer.id;
          newCustomerCount++;
          console.log(`  ✓ Created new customer: ${customerName}`);
        } catch (error) {
          console.error(`  ✗ Error creating customer ${customerName}: ${error.message}`);
        }
      }
    }
    
    if (newCustomerCount === 0) {
      console.log('  ℹ All customers already exist');
    }
    console.log('');
    
    // Step 2: Import instruments from Sheet2
    console.log('Step 2: Importing instruments from Sheet2...');
    let instrumentSuccessCount = 0;
    let instrumentErrorCount = 0;
    
    for (const row of data) {
      try {
        const make = (row['Make'] || '').trim();
        const customerId = customerMap[make.toLowerCase().trim()];
        
        if (!customerId) {
          console.error(`✗ No customer found for make: ${make}`);
          instrumentErrorCount++;
          continue;
        }
        
        // Check if instrument already exists
        const existing = await prisma.instrument.findFirst({
          where: {
            name: row['Instrument Name'] || 'Unknown',
            make: make,
            serial: String(row['Sr.No. '] || '')
          }
        });
        
        if (!existing) {
          await prisma.instrument.create({
            data: {
              name: row['Instrument Name'] || 'Unknown',
              serial: String(row['Sr.No. '] || ''),
              make: make,
              model: String(row['Model'] || ''),
              category: row['Category '] || row['Category'] || '',
              customerId: customerId,
              dueDate: row['Due Date'] ? new Date(row['Due Date']) : null
            }
          });
          
          instrumentSuccessCount++;
          
          if (instrumentSuccessCount % 50 === 0) {
            console.log(`  ... ${instrumentSuccessCount} instruments imported`);
          }
        }
      } catch (error) {
        instrumentErrorCount++;
        if (instrumentErrorCount <= 5) {
          console.error(`✗ Error importing instrument: ${error.message}`);
        }
      }
    }
    
    console.log(`  Successfully imported: ${instrumentSuccessCount}`);
    console.log(`  Failed/Skipped: ${instrumentErrorCount}\n`);
    
    // Step 3: Import standards from Sheet2
    console.log('Step 3: Importing standards from Sheet2...');
    let standardSuccessCount = 0;
    let standardErrorCount = 0;
    
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
          standardErrorCount++;
          continue;
        }
        
        // Extract standard information
        const standard1 = row['Standard 1'] ? String(row['Standard 1']).trim() : null;
        
        if (standard1) {
          await prisma.standard.create({
            data: {
              instrumentId: instrument.id,
              instrument: instrumentName,
              calibrationDate: new Date(),
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
          
          standardSuccessCount++;
          
          if (standardSuccessCount % 50 === 0) {
            console.log(`  ... ${standardSuccessCount} standards imported`);
          }
        }
      } catch (error) {
        standardErrorCount++;
        if (standardErrorCount <= 5) {
          console.error(`✗ Error importing standard: ${error.message}`);
        }
      }
    }
    
    console.log(`  Successfully imported: ${standardSuccessCount}`);
    console.log(`  Failed/Skipped: ${standardErrorCount}\n`);
    
    // Step 4: Verify
    console.log('---\nFinal Verification:');
    const allCustomers = await prisma.customer.findMany({
      include: {
        _count: { select: { instruments: true } }
      }
    });
    
    console.log(`\nCustomers and their instruments:`);
    let totalInstruments = 0;
    for (const customer of allCustomers) {
      console.log(`  ${customer.name}: ${customer._count.instruments} instruments`);
      totalInstruments += customer._count.instruments;
    }
    console.log(`\nTotal instruments: ${totalInstruments}`);
    
    const totalStandards = await prisma.standard.count();
    console.log(`Total standards: ${totalStandards}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importSheet2();
