import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function debug() {
  try {
    // Get a few instruments to see the data structure
    const instruments = await prisma.instrument.findMany({
      take: 5
    });
    
    console.log('Sample instruments from database:');
    instruments.forEach((inst, idx) => {
      console.log(`\n${idx + 1}. ${inst.name}`);
      console.log(`   ID: ${inst.id}`);
      console.log(`   Serial: "${inst.serial}"`);
      console.log(`   Make: "${inst.make}"`);
      console.log(`   Model: "${inst.model}"`);
      console.log(`   Category: "${inst.category}"`);
      console.log(`   Customer ID: ${inst.customerId}`);
    });
    
    // Count instruments per customer
    console.log('\n---\nInstruments per customer:');
    const customerCounts = await prisma.instrument.groupBy({
      by: ['customerId'],
      _count: true
    });
    
    for (const count of customerCounts) {
      const customer = await prisma.customer.findUnique({
        where: { id: count.customerId }
      });
      console.log(`  Customer ID ${count.customerId} (${customer?.name}): ${count._count} instruments`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
