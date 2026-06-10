import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  const customers = await prisma.customer.findMany();
  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true } });
  
  console.log('\n=== DATABASE VERIFICATION ===\n');
  
  console.log('Users:');
  users.forEach(user => {
    console.log(`  - ${user.username} (${user.email})`);
  });
  
  console.log('\nCustomers:');
  customers.forEach(customer => {
    console.log(`  - ID: ${customer.id}, Name: ${customer.name}, Phone: ${customer.phone}`);
  });
  
  console.log('\n✓ Total Users:', users.length);
  console.log('✓ Total Customers:', customers.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
