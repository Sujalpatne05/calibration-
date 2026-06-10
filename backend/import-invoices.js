import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function importInvoices() {
  try {
    console.log('Creating invoices for instruments...\n');
    
    // Step 1: Clear existing invoices
    console.log('Step 1: Clearing existing invoices...');
    const deleted = await prisma.invoice.deleteMany({});
    console.log(`✓ Deleted ${deleted.count} existing invoices\n`);
    
    // Step 2: Get all instruments
    console.log('Step 2: Fetching all instruments...');
    const instruments = await prisma.instrument.findMany({
      include: {
        customer: true
      }
    });
    console.log(`✓ Found ${instruments.length} instruments\n`);
    
    // Step 3: Create invoices for each instrument
    console.log('Step 3: Creating invoices...');
    let successCount = 0;
    let errorCount = 0;
    let invoiceCounter = 1001; // Start invoice numbers from 1001
    
    for (const instrument of instruments) {
      try {
        // Generate invoice number based on customer and counter
        const customerPrefix = instrument.customer.name.substring(0, 3).toUpperCase();
        const invoiceNumber = `${customerPrefix}-${String(invoiceCounter).padStart(6, '0')}`;
        invoiceCounter++;
        
        // Calculate dates
        const calibrationDate = new Date();
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days payment terms
        
        // Generate a random amount between 5000 and 20000
        const amount = Math.floor(Math.random() * (20000 - 5000 + 1)) + 5000;
        
        await prisma.invoice.create({
          data: {
            invoiceNumber: invoiceNumber,
            customerId: instrument.customerId,
            calibrationDate: calibrationDate,
            issueDate: issueDate,
            dueDate: dueDate,
            amount: amount,
            status: 'pending' // Default status is pending
          }
        });
        
        successCount++;
        
        if (successCount % 500 === 0) {
          console.log(`  ... ${successCount} invoices created`);
        }
      } catch (error) {
        errorCount++;
        if (errorCount <= 5) {
          console.error(`✗ Error creating invoice for instrument ${instrument.id}: ${error.message}`);
        }
      }
    }
    
    console.log(`\n✓ Invoices creation complete!`);
    console.log(`  Successfully created: ${successCount}`);
    console.log(`  Failed: ${errorCount}`);
    
    // Step 4: Verify and show summary
    console.log('\n---\nVerification:');
    const totalInvoices = await prisma.invoice.count();
    console.log(`  Total invoices in database: ${totalInvoices}`);
    
    // Get invoice summary by customer
    const invoiceSummary = await prisma.invoice.groupBy({
      by: ['customerId'],
      _count: true,
      _sum: {
        amount: true
      }
    });
    
    console.log(`\n  Invoices by customer:`);
    for (const summary of invoiceSummary) {
      const customer = await prisma.customer.findUnique({
        where: { id: summary.customerId }
      });
      console.log(`    - ${customer.name}: ${summary._count} invoices, Total: ₹${summary._sum.amount || 0}`);
    }
    
    // Show sample invoices
    console.log(`\n  Sample invoices:`);
    const sampleInvoices = await prisma.invoice.findMany({
      take: 5,
      include: {
        customer: true
      }
    });
    
    sampleInvoices.forEach((inv, idx) => {
      console.log(`    ${idx + 1}. ${inv.invoiceNumber} - ${inv.customer.name}: ₹${inv.amount} (${inv.status})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importInvoices();
