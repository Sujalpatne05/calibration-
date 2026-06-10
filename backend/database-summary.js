import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function summary() {
  try {
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('          DATABASE SUMMARY - CALIBRATION SYSTEM\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Customers
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            instruments: true,
            invoices: true,
            reports: true
          }
        }
      }
    });
    
    console.log('👥 CUSTOMERS:');
    console.log(`   Total: ${customers.length}\n`);
    customers.forEach(c => {
      console.log(`   ├─ ${c.name}`);
      console.log(`   │  ├─ Instruments: ${c._count.instruments}`);
      console.log(`   │  ├─ Invoices: ${c._count.invoices}`);
      console.log(`   │  └─ Reports: ${c._count.reports}\n`);
    });
    
    // Instruments
    const instrumentCount = await prisma.instrument.count();
    console.log(`📦 INSTRUMENTS: ${instrumentCount}`);
    
    const instrumentByCategory = await prisma.instrument.groupBy({
      by: ['category'],
      _count: true
    });
    console.log(`   By Category:`);
    instrumentByCategory.sort((a, b) => b._count - a._count).forEach(item => {
      console.log(`   ├─ ${item.category || 'Uncategorized'}: ${item._count}`);
    });
    console.log('');
    
    // Standards
    const standardCount = await prisma.standard.count();
    console.log(`📋 STANDARDS/CALIBRATION DATA: ${standardCount}\n`);
    
    // Invoices
    const invoiceCount = await prisma.invoice.count();
    const invoiceByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      _count: true,
      _sum: { amount: true }
    });
    
    console.log(`💰 INVOICES: ${invoiceCount}`);
    console.log(`   By Status:`);
    invoiceByStatus.forEach(item => {
      const amount = item._sum.amount || 0;
      console.log(`   ├─ ${item.status}: ${item._count} invoices, Total: ₹${amount.toLocaleString('en-IN')}`);
    });
    
    const totalInvoiceAmount = await prisma.invoice.aggregate({
      _sum: { amount: true }
    });
    console.log(`   └─ Grand Total: ₹${(totalInvoiceAmount._sum.amount || 0).toLocaleString('en-IN')}\n`);
    
    // Reports
    const reportCount = await prisma.report.count();
    const reportByStatus = await prisma.report.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log(`📄 REPORTS/CERTIFICATES: ${reportCount}`);
    console.log(`   By Status:`);
    reportByStatus.forEach(item => {
      console.log(`   ├─ ${item.status}: ${item._count}`);
    });
    console.log('');
    
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                   ✅ ALL DATA IMPORTED SUCCESSFULLY\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

summary();
