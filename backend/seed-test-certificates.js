import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const legalDisclaimer =
  'This is to certify that the items listed above have been inspected and tested as per applicable internal quality procedures and found conforming to the stated requirements.';

const notes =
  'Material and workmanship are visually inspected. Certificate is valid for the supplied items only.';

function buildItems(instrument, index) {
  return [
    {
      sr: 1,
      name: instrument.name,
      qty: 1,
      specs: [
        { key: 'Make', value: instrument.make || 'N/A' },
        { key: 'Model', value: instrument.model || 'N/A' },
        { key: 'Serial No', value: instrument.serial || 'N/A' },
        { key: 'Category', value: instrument.category || 'N/A' }
      ]
    },
    {
      sr: 2,
      name: `Inspection and conformance check - ${index + 1}`,
      qty: 1,
      specs: [
        { key: 'Visual inspection', value: 'Accepted' },
        { key: 'Functional check', value: 'Conforming' },
        { key: 'Result', value: 'Pass' }
      ]
    }
  ];
}

async function main() {
  const instruments = await prisma.instrument.findMany({
    take: 6,
    include: { customer: true },
    orderBy: { id: 'asc' }
  });

  if (instruments.length === 0) {
    throw new Error('No instruments found. Import instruments before seeding test certificates.');
  }

  let createdOrUpdated = 0;

  for (const [index, instrument] of instruments.entries()) {
    const serial = String(index + 1).padStart(4, '0');
    const tcNumber = `SANC-TC-2026-${serial}`;
    const certificateNo = `SANC-CONF-2026-${serial}`;
    const issueDate = new Date(Date.UTC(2026, 5, 10 + index));

    await prisma.report.upsert({
      where: { certificateNo },
      update: {
        type: 'test',
        tcNumber,
        customerId: instrument.customerId,
        instrumentId: instrument.id,
        issueDate,
        status: 'approved',
        poNumber: `PO-SANC-2026-${serial}`,
        tcDate: issueDate,
        items: JSON.stringify(buildItems(instrument, index)),
        legalDisclaimer,
        notes
      },
      create: {
        type: 'test',
        certificateNo,
        tcNumber,
        customerId: instrument.customerId,
        instrumentId: instrument.id,
        issueDate,
        status: 'approved',
        instrumentName: instrument.name,
        instrumentMake: instrument.make,
        instrumentModel: instrument.model,
        instrumentSerial: instrument.serial,
        poNumber: `PO-SANC-2026-${serial}`,
        tcDate: issueDate,
        items: JSON.stringify(buildItems(instrument, index)),
        legalDisclaimer,
        notes
      }
    });

    createdOrUpdated++;
  }

  console.log(`Seeded ${createdOrUpdated} test & conformance certificates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
