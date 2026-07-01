import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '@prisma/client';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dumpPath = path.resolve(__dirname, '..', 'CALIBRATION_SANC.sql');

const statusLabels = {
  1: 'pending',
  2: 'in-progress',
  3: 'error',
  4: 'completed',
  6: 'failed',
  7: 'failed-no-info',
  8: 'failed-out-of-scope',
  9: 'old-data',
  10: 'internal-testing',
};

const statusPriority = {
  error: 100,
  failed: 90,
  'failed-no-info': 85,
  'failed-out-of-scope': 80,
  'in-progress': 60,
  'internal-testing': 50,
  'old-data': 40,
  pending: 20,
  completed: 10,
};

const parseSqlValue = (raw, wasString = false) => {
  const value = raw.trim();
  if (wasString) return raw.trim();
  if (!value || /^null$/i.test(value)) return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value;
};

const splitSqlRows = (valuesSql) => {
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
      tokenWasString = false;
      inRow = false;
      continue;
    }

    if (inRow) token += char;
  }

  return rows;
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

      if (char === "'") inString = false;
      continue;
    }

    if (char === "'") {
      inString = true;
      continue;
    }

    if (char === ';') return i;
  }

  return -1;
};

const extractInsertRows = (sql, insertPrefix) => {
  const rows = [];
  let searchStart = 0;

  while (searchStart < sql.length) {
    const insertStart = sql.indexOf(insertPrefix, searchStart);
    if (insertStart === -1) break;

    const valuesStart = insertStart + insertPrefix.length;
    const statementEnd = findStatementEnd(sql, valuesStart);
    if (statementEnd === -1) {
      throw new Error(`Unterminated INSERT near offset ${insertStart}.`);
    }

    rows.push(...splitSqlRows(sql.slice(valuesStart, statementEnd)));
    searchStart = statementEnd + 1;
  }

  return rows;
};

const normalizeStatus = (items) => {
  if (!items.length) return 'pending';

  const statuses = items.map((item) => statusLabels[item.status] ?? 'pending');
  return statuses.sort((a, b) => (statusPriority[b] ?? 0) - (statusPriority[a] ?? 0))[0];
};

const toDate = (value, fallback = new Date()) => {
  const date = value ? new Date(value) : fallback;
  return Number.isNaN(date.getTime()) ? fallback : date;
};

async function importSqlInvoices() {
  if (!fs.existsSync(dumpPath)) {
    throw new Error(`SQL dump not found: ${dumpPath}`);
  }

  const sql = fs.readFileSync(dumpPath, 'utf8');
  const invoiceRows = extractInsertRows(
    sql,
    'INSERT INTO `INVOICE` (`INVOICE_ID`, `DATE`, `INVOICE_NUMBER`, `PO_NUMBER`, `CUSTOMER_ID`, `ENTRY_ON`) VALUES'
  );
  const itemRows = extractInsertRows(
    sql,
    'INSERT INTO `INVOICE_ITEMS` (`ENTRY_ID`, `INVOICE_ID`, `INSTRUMENT_ID`, `QTY`, `CC_DONE`, `CC_ERROR`, `TC_DONE`, `STATUS`) VALUES'
  );

  const itemsByInvoice = new Map();

  for (const row of itemRows) {
    const [, invoiceId, instrumentId, qty, ccDone, ccError, tcDone, status] = row;
    const item = { invoiceId, instrumentId, qty, ccDone, ccError, tcDone, status };
    const items = itemsByInvoice.get(invoiceId) ?? [];
    items.push(item);
    itemsByInvoice.set(invoiceId, items);
  }

  const invoices = invoiceRows.map((row) => {
    const [id, date, invoiceNumber, poNumber, customerId, entryOn] = row;
    const items = itemsByInvoice.get(id) ?? [];

    return {
      id,
      invoiceNumber,
      customerId,
      calibrationDate: toDate(date),
      issueDate: toDate(entryOn, toDate(date)),
      dueDate: null,
      amount: null,
      status: normalizeStatus(items),
      itemCount: items.length,
      poNumber,
    };
  });

  const customers = await prisma.customer.findMany({
    where: { id: { in: invoices.map((invoice) => invoice.customerId) } },
    select: { id: true },
  });
  const customerIds = new Set(customers.map((customer) => customer.id));
  const validInvoices = invoices.filter((invoice) => customerIds.has(invoice.customerId));
  const skipped = invoices.length - validInvoices.length;

  await prisma.invoice.deleteMany({});

  for (const invoice of validInvoices) {
    await prisma.invoice.create({
      data: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        customerId: invoice.customerId,
        calibrationDate: invoice.calibrationDate,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        amount: invoice.amount,
        status: invoice.status,
      },
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"Invoice"', 'id'), COALESCE((SELECT MAX(id) FROM "Invoice"), 1), true)`
  );

  const grouped = await prisma.invoice.groupBy({
    by: ['status'],
    _count: { status: true },
  });

  console.log(`Parsed invoices: ${invoices.length}`);
  console.log(`Parsed invoice items: ${itemRows.length}`);
  console.log(`Imported invoices: ${validInvoices.length}`);
  console.log(`Skipped missing customers: ${skipped}`);
  console.log('Status summary:', grouped);
}

importSqlInvoices()
  .catch((error) => {
    console.error('SQL invoice import failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
