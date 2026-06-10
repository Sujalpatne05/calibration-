import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  try {
    // Create a test user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
      where: { username: 'admin' },
      update: {},
      create: {
        username: 'admin',
        password: hashedPassword,
        email: 'admin@sanc.com',
        fullName: 'Admin User',
        role: 'admin'
      }
    });

    console.log('✓ Test user created:', user.username);

    // Check if customer already exists
    const existingCustomer = await prisma.customer.findFirst({
      where: { name: 'sujal patne' }
    });

    if (!existingCustomer) {
      const customer = await prisma.customer.create({
        data: {
          name: 'sujal patne',
          email: 'sujal@example.com',
          phone: '9876543210',
          address: 'Pune, India',
          gstin: '27AABCA1234H1Z0'
        }
      });
      console.log('✓ Customer created:', customer.name);
    } else {
      console.log('✓ Customer already exists:', existingCustomer.name);
    }

    console.log('\nDatabase seeded successfully!');
    console.log('Test credentials: username: admin, password: admin123');
  } catch (error) {
    console.error('Seed error:', error.message);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
