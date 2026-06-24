import fs from 'fs';
import path from 'path';

const salesCsvPath = 'C:\\Users\\admin\\Desktop\\뉴진스ERP\\판매조회.csv';
const purchasesCsvPath = 'C:\\Users\\admin\\Desktop\\뉴진스ERP\\구매조회.csv';

const salesOutputPath = path.resolve('src/data/sales.json');
const purchasesOutputPath = path.resolve('src/data/purchases.json');

// Helper to parse CSV lines handling quotes
function parseCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const cleanNumber = (val) => {
  if (!val) return 0;
  const clean = val.replace(/,/g, '');
  return isNaN(Number(clean)) ? 0 : Number(clean);
};

// --- PARSE SALES ---
console.log('Parsing sales...');
const salesContent = fs.readFileSync(salesCsvPath, 'utf8');
const salesLines = salesContent.split(/\r?\n/);
const salesList = [];
const seenSales = new Set();

// Skip line 1 (header company) and line 2 (column headers)
for (let i = 2; i < salesLines.length; i++) {
  const line = salesLines[i].trim();
  if (!line) continue;
  
  const cols = parseCsvLine(line);
  if (cols.length < 3 || !cols[0] || !cols[2]) continue;
  
  const dateNo = cols[0]; // e.g., "2026/06/22 -2"
  const dateParts = dateNo.split(' -');
  const rawDate = dateParts[0].trim();
  const date = rawDate.replace(/\//g, '-');
  const seq = dateParts[1] ? parseInt(dateParts[1].trim(), 10) : 1;
  
  const partnerCode = cols[1] || '';
  const customer = cols[2];
  const paymentMethod = cols[3] || '';
  const note = cols[4] || '';
  const itemName = cols[5] || '';
  const supplyValue = cleanNumber(cols[7]);
  const vat = cleanNumber(cols[8]);
  const purchasePlace = cols[9] || '';
  const employee = cols[10] || '';
  
  // Create a unique key for deduplication
  const uniqueKey = `${date}_${seq}_${customer}_${itemName}`;
  if (seenSales.has(uniqueKey)) {
    console.log(`Duplicate sale skipped: ${uniqueKey}`);
    continue;
  }
  seenSales.add(uniqueKey);
  
  const qty = 1;
  const price = supplyValue;
  const isAccountReflected = paymentMethod !== '';

  salesList.push({
    id: `SL-${salesList.length + 1001}`,
    date,
    seq,
    partnerCode,
    customer,
    paymentMethod,
    note,
    itemCode: '',
    itemName,
    qty,
    price,
    supplyValue,
    vat,
    purchasePlace,
    employee,
    isAccountReflected
  });
}

fs.writeFileSync(salesOutputPath, JSON.stringify(salesList, null, 2), 'utf8');
console.log(`Saved ${salesList.length} sales to ${salesOutputPath}`);


// --- PARSE PURCHASES ---
console.log('Parsing purchases...');
const purchasesContent = fs.readFileSync(purchasesCsvPath, 'utf8');
const purchasesLines = purchasesContent.split(/\r?\n/);
const purchasesList = [];
const seenPurchases = new Set();

// Skip line 1 (header company) and line 2 (column headers)
for (let i = 2; i < purchasesLines.length; i++) {
  const line = purchasesLines[i].trim();
  if (!line) continue;
  
  const cols = parseCsvLine(line);
  if (cols.length < 3 || !cols[0] || !cols[1]) continue;
  
  const dateNo = cols[0]; // e.g., "2026/06/23 -1"
  const dateParts = dateNo.split(' -');
  const rawDate = dateParts[0].trim();
  const date = rawDate.replace(/\//g, '-');
  const seq = dateParts[1] ? parseInt(dateParts[1].trim(), 10) : 1;
  
  const vendor = cols[1];
  const customer = cols[2] || '';
  const note = cols[3] || ''; // spec
  const itemName = cols[4] || '';
  const totalAmount = cleanNumber(cols[5]);
  const employee = cols[6] || '';
  
  // Create a unique key for deduplication
  const uniqueKey = `${date}_${seq}_${vendor}_${itemName}`;
  if (seenPurchases.has(uniqueKey)) {
    console.log(`Duplicate purchase skipped: ${uniqueKey}`);
    continue;
  }
  seenPurchases.add(uniqueKey);
  
  const supplyValue = Math.round(totalAmount / 1.1);
  const vat = totalAmount - supplyValue;
  const qty = 1;
  const price = supplyValue;

  purchasesList.push({
    id: `PC-${purchasesList.length + 1718000001}`,
    date,
    vendor,
    itemCode: '',
    itemName,
    qty,
    price,
    supplyValue,
    vat,
    paymentMethod: '계좌',
    employee,
    customer,
    note
  });
}

fs.writeFileSync(purchasesOutputPath, JSON.stringify(purchasesList, null, 2), 'utf8');
console.log(`Saved ${purchasesList.length} purchases to ${purchasesOutputPath}`);
