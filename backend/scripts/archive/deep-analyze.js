import XLSX from 'xlsx';

async function deepAnalyze() {
  try {
    console.log('Deep analysis of Excel file...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    
    // Get raw worksheet to see all columns including empty ones
    const worksheet = workbook.Sheets['Merged'];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    
    console.log('Raw sheet range:', worksheet['!ref']);
    console.log(`Columns: A-${String.fromCharCode(65 + range.e.c)}`);
    console.log(`Rows: 1-${range.e.r + 1}\n`);
    
    // Get header row
    console.log('All columns in Merged sheet:');
    const headers = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet[cellAddress];
      const header = cell ? cell.v : `Empty_${col}`;
      headers.push(header);
      console.log(`  Column ${String.fromCharCode(65 + col)}: ${header}`);
    }
    
    console.log('\n---\n');
    
    // Now check Sheet2
    const worksheet2 = workbook.Sheets['Sheet2'];
    const range2 = XLSX.utils.decode_range(worksheet2['!ref']);
    
    console.log('All columns in Sheet2:');
    for (let col = range2.s.c; col <= range2.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      const cell = worksheet2[cellAddress];
      const header = cell ? cell.v : `Empty_${col}`;
      console.log(`  Column ${String.fromCharCode(65 + col)}: ${header}`);
    }
    
    // Check if there are more sheets
    console.log(`\n---\n`);
    console.log(`Total sheets: ${workbook.SheetNames.length}`);
    workbook.SheetNames.forEach((name, idx) => {
      console.log(`  ${idx + 1}. ${name}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

deepAnalyze();
