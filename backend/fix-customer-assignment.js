import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function fixCustomerAssignment() {
  try {
    console.log('Reading Excel file and reassigning customers to instruments...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // Get all existing customers
    const customers = await prisma.customer.findMany();
    const customerMap = {};
    customers.forEach(c => {
      customerMap[c.name.toLowerCase().trim()] = c.id;
    });
    
    console.log(`Found ${customers.length} customers in database:`);
    customers.forEach(c => console.log(`  - ${c.name}`));
    console.log('\n---\n');
    console.log('Processing instruments and assigning to customers...\n');
    
    let reassignCount = 0;
    let failCount = 0;
    
    // Create a map of Make -> customerId from Excel data for batch assignment
    const makeToCustomerId = {};
    for (const row of data) {
      const make = (row['Make'] || '').trim();
      const makeKey = make.toLowerCase();
      
      if (!makeToCustomerId[makeKey] && customerMap[makeKey]) {
        makeToCustomerId[makeKey] = customerMap[makeKey];
      }
    }
    
    console.log('Make to Customer mapping:');
    Object.entries(makeToCustomerId).forEach(([make, customerId]) => {
      const customer = customers.find(c => c.id === customerId);
      console.log(`  ${make} -> ${customer.name} (ID: ${customerId})`);
    });
    console.log('\n---\n');
    
    // Batch update all instruments based on their Make field
    for (const [makeKey, customerId] of Object.entries(makeToCustomerId)) {
      try {
        const updated = await prisma.instrument.updateMany({
          where: {
            make: {
              contains: makeKey.charAt(0).toUpperCase() + makeKey.slice(1) // Capitalize first letter
            }
          },
          data: {
            customerId: customerId
          }
        });
        
        reassignCount += updated.count;
        console.log(`✓ Updated ${updated.count} instruments with make containing "${makeKey}"`);
      } catch (error) {
        failCount++;
        console.error(`✗ Error updating instruments for make "${makeKey}": ${error.message}`);
      }
    }
    
    console.log(`\n---`);
    console.log(`✓ Successfully reassigned: ${reassignCount} instruments`);
    console.log(`Failed attempts: ${failCount}`);
    
  } catch (error) {
    console.error('Error during reassignment:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCustomerAssignment();
