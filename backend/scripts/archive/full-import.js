import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function fullImport() {
  try {
    console.log('Starting full import with customers...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    console.log(`Read ${data.length} records from Excel\n`);
    
    // Step 1: Delete sujal patne customer if it exists
    console.log('Step 1: Removing default customer...');
    await prisma.customer.deleteMany({
      where: { name: 'sujal patne' }
    });
    console.log('✓ Removed\n');
    
    // Step 2: Extract unique customers from Make column
    const uniqueCustomers = new Set();
    const customerMap = {}; // make -> customerId
    
    for (const row of data) {
      const make = (row['Make'] || '').trim();
      if (make) uniqueCustomers.add(make);
    }
    
    console.log(`Step 2: Creating ${uniqueCustomers.size} customers...`);
    for (const customerName of uniqueCustomers) {
      try {
        let customer = await prisma.customer.findFirst({
          where: { name: customerName }
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              name: customerName,
              phone: '',
              address: ''
            }
          });
        }
        customerMap[customerName] = customer.id;
        console.log(`  ✓ ${customerName} (ID: ${customer.id})`);
      } catch (error) {
        console.log(`  ℹ ${customerName} already exists`);
        const existing = await prisma.customer.findFirst({
          where: { name: customerName }
        });
        if (existing) customerMap[customerName] = existing.id;
      }
    }
    console.log('');
    
    // Step 3: Clear existing instruments
    console.log('Step 3: Clearing existing instruments...');
    const deleted = await prisma.instrument.deleteMany({});
    console.log(`✓ Deleted ${deleted.count} existing instruments\n`);
    
    // Step 4: Import instruments with correct customers
    console.log('Step 4: Importing instruments...');
    let successCount = 0;
    let errorCount = 0;
    
    for (const row of data) {
      try {
        const make = (row['Make'] || '').trim();
        const customerId = customerMap[make];
        
        if (!customerId) {
          console.error(`✗ No customer found for make: ${make}`);
          errorCount++;
          continue;
        }
        
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
        
        successCount++;
        if (successCount % 500 === 0) {
          console.log(`  ... ${successCount} imported`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`✗ Failed: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✓ Import complete!`);
    console.log(`  Successfully imported: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    
    // Verify
    console.log('\n---\nVerification:');
    const customerCounts = await prisma.customer.findMany({
      include: {
        _count: { select: { instruments: true } }
      }
    });
    
    for (const customer of customerCounts) {
      console.log(`  ${customer.name}: ${customer._count.instruments} instruments`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fullImport();
