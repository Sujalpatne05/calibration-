import pkg from '@prisma/client';
import bcrypt from 'bcryptjs';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  try {
    // Create or update the default application user.
    const hashedPassword = await bcrypt.hash('sanc@123', 10);
    const sancUser = await prisma.user.findUnique({
      where: { username: 'sanc' }
    });
    const legacyUser = sancUser
      ? null
      : await prisma.user.findFirst({
          where: {
            OR: [
              { username: 'admin' },
              { email: 'admin@sanc.com' }
            ]
          }
        });

    const defaultUserData = {
      username: 'sanc',
      password: hashedPassword,
      email: 'admin@sanc.com',
      fullName: 'Admin User',
      role: 'admin'
    };

    const user = sancUser
      ? await prisma.user.update({
          where: { id: sancUser.id },
          data: {
            password: hashedPassword,
            fullName: 'Admin User',
            role: 'admin'
          }
        })
      : legacyUser
      ? await prisma.user.update({
          where: { id: legacyUser.id },
          data: defaultUserData
        })
      : await prisma.user.create({ data: defaultUserData });

    console.log('Default user ready:', user.username);

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
      console.log('Customer created:', customer.name);
    } else {
      console.log('Customer already exists:', existingCustomer.name);
    }

    console.log('\nDatabase seeded successfully!');
    console.log('Default credentials: username: sanc, password: sanc@123');
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exitCode = 1;
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
