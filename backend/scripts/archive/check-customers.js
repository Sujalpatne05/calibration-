import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function checkCustomers() {
  try {
    console.log('Checking all customers in database...\n');
    
    const customers = await prisma.customer.findMany({
      include: {
        _count: {
          select: {
            instruments: true,
            invoices: true,
            reports: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`═══════════════════════════════════════════════════════════════`);
    console.log(`Total Customers: ${customers.length}\n`);
    
    customers.forEach((customer, idx) => {
      console.log(`${idx + 1}. ${customer.name}`);
      console.log(`   ID: ${customer.id}`);
      console.log(`   Email: ${customer.email || 'N/A'}`);
      console.log(`   Phone: ${customer.phone || 'N/A'}`);
      console.log(`   Address: ${customer.address || 'N/A'}`);
      console.log(`   GSTIN: ${customer.gstin || 'N/A'}`);
      console.log(`   Created: ${customer.createdAt.toLocaleDateString('en-IN')}`);
      console.log(`   Instruments: ${customer._count.instruments}`);
      console.log(`   Invoices: ${customer._count.invoices}`);
      console.log(`   Reports: ${customer._count.reports}`);
      console.log('');
    });
    
    console.log(`═══════════════════════════════════════════════════════════════`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomers();
