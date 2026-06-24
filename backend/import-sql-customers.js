import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '@prisma/client';

const { PrismaClient, Prisma } = pkg;
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dumpPath = path.resolve(__dirname, '..', 'CALIBRATION_SANC.sql');

const normalizeText = (value) => {
  if (value === null || value === undefined) return value;

  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/â€“/g, '-')
    .replace(/â€”/g, '-')
    .replace(/â€˜|â€™/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim();
};

const splitSqlValues = (valuesSql) => {
  const rows = [];
  let row = [];
  let token = '';
  let inString = false;
  let inRow = false;
  let tokenWasString = false;

  for (let i = 0; i < valuesSql.length; i += 1) {
    const char = valuesSql[i];
    const next = valuesSql[i + 1];

    if (inString) {
      if (char === '\\' && next !== undefined) {
        token += next;
        i += 1;
        continue;
      }

      if (char === "'" && next === "'") {
        token += "'";
        i += 1;
        continue;
      }

      if (char === "'") {
        inString = false;
        continue;
      }

      token += char;
      continue;
    }

    if (char === "'") {
      inString = true;
      tokenWasString = true;
      continue;
    }

    if (char === '(') {
      inRow = true;
      row = [];
      token = '';
      tokenWasString = false;
      continue;
    }

    if (char === ',' && inRow) {
      row.push(parseSqlValue(token, tokenWasString));
      token = '';
      tokenWasString = false;
      continue;
    }

    if (char === ')' && inRow) {
      row.push(parseSqlValue(token, tokenWasString));
      rows.push(row);
      row = [];
      token = '';
      inRow = false;
      tokenWasString = false;
      continue;
    }

    if (inRow) {
      token += char;
    }
  }

  return rows;
};

const parseSqlValue = (raw, wasString = false) => {
  const value = raw.trim();
  if (wasString) return raw;
  if (!value || /^null$/i.test(value)) return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
};

const findStatementEnd = (sql, start) => {
  let inString = false;

  for (let i = start; i < sql.length; i += 1) {
    const char = sql[i];
    const next = sql[i + 1];

    if (inString) {
      if (char === '\\' && next !== undefined) {
        i += 1;
        continue;
      }

      if (char === "'" && next === "'") {
        i += 1;
        continue;
      }

      if (char === "'") {
        inString = false;
      }

      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === ';') {
      return i;
    }
  }

  return -1;
};

const extractCustomerRows = (sql) => {
  const insertPrefix =
    'INSERT INTO `CUSTOMER` (`CUSTOMER_ID`, `TITLE`, `PHONE`, `EMAIL`, `ADDRESS`, `UPDATE_NEEDED`, `IGNORE_CUSTOMER`) VALUES';
  const customers = [];
  let searchStart = 0;

  while (searchStart < sql.length) {
    const insertStart = sql.indexOf(insertPrefix, searchStart);
    if (insertStart === -1) break;

    const valuesStart = insertStart + insertPrefix.length;
    const statementEnd = findStatementEnd(sql, valuesStart);
    if (statementEnd === -1) {
      throw new Error(`Unterminated CUSTOMER INSERT near offset ${insertStart}.`);
    }

    const rows = splitSqlValues(sql.slice(valuesStart, statementEnd));

    for (const row of rows) {
      const [id, name, phone, email, address, updateNeeded, ignoreCustomer] = row;
      if (!id || !name) continue;

      customers.push({
        id,
        name: normalizeText(name),
        phone: normalizeText(phone) || '',
        email: normalizeText(email) || null,
        address: normalizeText(address) || null,
        updateNeeded: Boolean(updateNeeded),
        ignoreCustomer: Boolean(ignoreCustomer),
      });
    }

    searchStart = statementEnd + 1;
  }

  return customers;
};

async function importCustomers() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`SQL dump not found: ${dumpPath}`);
  }

  const sql = fs.readFileSync(dumpPath, 'utf8');
  const customers = extractCustomerRows(sql);

  if (customers.length === 0) {
    throw new Error('No CUSTOMER rows found in SQL dump.');
  }

  console.log(`Parsed ${customers.length} customers from ${path.basename(dumpPath)}.`);

  const existingIds = new Set(
    (
      await prisma.customer.findMany({
        where: {
          id: {
            in: customers.map((customer) => customer.id),
          },
        },
        select: { id: true },
      })
    ).map((customer) => customer.id)
  );

  const batchSize = 100;

  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);

    await prisma.$executeRaw(
      Prisma.sql`
        INSERT INTO "Customer" ("id", "name", "email", "phone", "address", "createdAt", "updatedAt")
        VALUES ${Prisma.join(
          batch.map(
            (customer) => Prisma.sql`(
              ${customer.id},
              ${customer.name},
              ${customer.email},
              ${customer.phone},
              ${customer.address},
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )`
          )
        )}
        ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "email" = EXCLUDED."email",
          "phone" = EXCLUDED."phone",
          "address" = EXCLUDED."address",
          "updatedAt" = CURRENT_TIMESTAMP
      `
    );
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Customer"', 'id'), COALESCE((SELECT MAX(id) FROM "Customer"), 1), true)`
  );

  const total = await prisma.customer.count();
  const ignoredInDump = customers.filter((customer) => customer.ignoreCustomer).length;

  console.log(`Created: ${customers.filter((customer) => !existingIds.has(customer.id)).length}`);
  console.log(`Updated: ${customers.filter((customer) => existingIds.has(customer.id)).length}`);
  console.log(`Ignored flag present in dump: ${ignoredInDump}`);
  console.log(`Total customers now in database: ${total}`);
}

importCustomers()
  .catch((error) => {
    console.error('Customer import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
