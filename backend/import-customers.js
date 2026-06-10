import XLSX from 'xlsx';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function importCustomers() {
  try {
    console.log('Reading Excel file to extract customers...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    console.log(`Found ${data.length} records in Excel file`);
    console.log('Available columns:', Object.keys(data[0]));
    console.log('\n---\n');
    
    // Extract unique customers/companies from the data
    const customerSet = new Set();
    const customerDetails = {};
    
    for (const row of data) {
      // Look for customer/company information in various possible column names
      const customerName = 
        row['Customer'] || 
        row['Company'] || 
        row['Organization'] || 
        row['Client'] || 
        row['Customer Name'] ||
        row['Company Name'] ||
        row['Make'] || // Fallback to Make if no customer field
        'General Customer';
      
      if (customerName && customerName.trim()) {
        customerSet.add(customerName.trim());
        if (!customerDetails[customerName.trim()]) {
          customerDetails[customerName.trim()] = {
            name: customerName.trim(),
            count: 0
          };
        }
        customerDetails[customerName.trim()].count++;
      }
    }
    
    console.log(`Found ${customerSet.size} unique customers:\n`);
    
    // Sort by frequency
    const sortedCustomers = Object.values(customerDetails)
      .sort((a, b) => b.count - a.count);
    
    sortedCustomers.forEach((c, idx) => {
      console.log(`${idx + 1}. ${c.name} (${c.count} instruments)`);
    });
    
    console.log('\n---\n');
    console.log('Importing customers into database...\n');
    
    // Delete the default "sujal patne" customer first
    const deletedCustomer = await prisma.customer.deleteMany({
      where: {
        name: 'sujal patne'
      }
    });
    console.log(`✓ Deleted default customer "sujal patne" (${deletedCustomer.count} records)`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Import each unique customer
    for (const customer of sortedCustomers) {
      try {
        const newCustomer = await prisma.customer.create({
          data: {
            name: customer.name,
            phone: '', // No phone data available in Excel
            address: ''  // No address data available in Excel
          }
        });
        
        successCount++;
        console.log(`✓ Created customer: ${newCustomer.name}`);
      } catch (error) {
        if (error.code === 'P2002') {
          // Unique constraint violation - customer already exists
          console.log(`ℹ Customer already exists: ${customer.name}`);
        } else {
          errorCount++;
          console.error(`✗ Failed to create customer: ${customer.name}`);
          console.error(`  Error: ${error.message}`);
        }
      }
    }
    
    console.log(`\n---\nCustomer Import Summary:`);
    console.log(`✓ Successfully created: ${successCount}`);
    console.log(`✗ Failed: ${errorCount}`);
    
    // Now reassign instruments to their respective customers
    console.log(`\n---\nReassigning instruments to customers...\n`);
    
    let reassignCount = 0;
    
    for (const row of data) {
      const customerName = 
        row['Customer'] || 
        row['Company'] || 
        row['Organization'] || 
        row['Client'] || 
        row['Customer Name'] ||
        row['Company Name'] ||
        row['Make'] || 
        'General Customer';
      
      if (customerName && customerName.trim()) {
        try {
          // Find the customer
          const customer = await prisma.customer.findFirst({
            where: {
              name: customerName.trim()
            }
          });
          
          if (customer) {
            // Find instruments with this customer name and update them
            const updated = await prisma.instrument.updateMany({
              where: {
                name: row['Instrument Name'] || 'Unknown',
                make: row['Make'] || ''
              },
              data: {
                customerId: customer.id
              }
            });
            
            if (updated.count > 0) {
              reassignCount += updated.count;
            }
          }
        } catch (error) {
          // Silently skip errors during reassignment
        }
      }
    }
    
    console.log(`✓ Reassigned ${reassignCount} instruments to their respective customers`);
    
  } catch (error) {
    console.error('Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importCustomers();
