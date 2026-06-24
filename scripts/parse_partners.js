import fs from 'fs';
import path from 'path';

const csvPath = 'C:\\Users\\admin\\Desktop\\거래처등록_수정.csv';
const outputPath = path.resolve('src/data/partners.json');

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

const partners = [];

// Skip line 1 (header company name) and line 2 (column headers)
for (let i = 2; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Skip the timestamp at the end if present
  if (line.includes('오후') || line.includes('오전') || /^\d{4}\/\d{2}\/\d{2}/.test(line)) {
    continue;
  }
  
  const cols = parseCsvLine(line);
  if (cols.length < 2 || !cols[0] || !cols[1]) continue;
  
  const code = cols[0];
  const name = cols[1];
  const owner = cols[2] || '';
  const bizType = cols[3] || '';
  const bizItem = cols[4] || '';
  const email = cols[5] || '';
  const phone = cols[6] || '';
  const zipCode = cols[7] || '';
  const address = cols[8] || '';

  partners.push({
    code,
    name,
    owner,
    bizType,
    bizItem,
    email,
    phone,
    zipCode,
    address
  });
}

// Write the result
fs.writeFileSync(outputPath, JSON.stringify(partners, null, 2), 'utf8');
console.log(`Successfully parsed and saved ${partners.length} partners from 수정 CSV to ${outputPath}`);
