import fs from 'fs';
import path from 'path';

const csvPath = 'C:\\Users\\admin\\Desktop\\품목단가.csv';
const outputPath = path.resolve('src/data/items.json');

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Read and parse CSV
const csvContent = fs.readFileSync(csvPath, 'utf8');
const lines = csvContent.split(/\r?\n/);

// Helper to parse a CSV line handling quotes
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

const items = [];

// Skip header (line 1)
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Skip trailing timestamps/meta if any
  if (line.includes('오후') || line.includes('오전') || /^\d{4}\/\d{2}\/\d{2}/.test(line)) {
    continue;
  }
  
  const cols = parseCsvLine(line);
  if (cols.length < 2 || !cols[0] || !cols[1]) continue;
  
  const code = cols[0];
  const name = cols[1];
  const spec = cols[2] || '';
  const unit = cols[3] || 'EA';
  
  // Clean price values (e.g. "696,000" -> 696000)
  const cleanNumber = (val) => {
    if (!val) return 0;
    const clean = val.replace(/,/g, '');
    return isNaN(Number(clean)) ? 0 : Number(clean);
  };
  
  const purchasePrice = cleanNumber(cols[4]);
  const salesPrice = cleanNumber(cols[5]);
  
  const type = salesPrice > 0 ? '완제품' : '원재료';
  const safetyStock = 50;
  const stock = 120; // Default stock to make data interesting

  items.push({
    code,
    name,
    type,
    spec,
    unit,
    safetyStock,
    purchasePrice,
    salesPrice,
    stock
  });
}

// Write the result directly (no merge with mock items)
fs.writeFileSync(outputPath, JSON.stringify(items, null, 2), 'utf8');
console.log(`Successfully parsed and saved ${items.length} items exclusively to ${outputPath}`);
