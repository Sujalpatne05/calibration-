import XLSX from 'xlsx';

async function analyzeExcel() {
  try {
    console.log('Analyzing Excel file structure...\n');
    
    // Read the Excel file
    const filePath = '../Instrument Data-Final.xlsx';
    const workbook = XLSX.readFile(filePath);
    
    console.log(`Available sheets: ${workbook.SheetNames.join(', ')}\n`);
    
    // Check all sheets
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      console.log(`\n--- Sheet: "${sheetName}" ---`);
      console.log(`Rows: ${data.length}`);
      console.log(`Columns: ${Object.keys(data[0] || {}).join(', ')}\n`);
      
      if (data.length > 0) {
        console.log('Sample row:');
        const row = data[0];
        Object.entries(row).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

analyzeExcel();
