import fs from 'fs';
import { PDFParse } from 'pdf-parse';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pdfPath = join(__dirname, '../public/para analise.pdf');

if (!fs.existsSync(pdfPath)) {
    console.error('PDF file not found at:', pdfPath);
    process.exit(1);
}

let dataBuffer = fs.readFileSync(pdfPath);

async function run() {
    try {
        const parser = new PDFParse({ data: dataBuffer });
        const result = await parser.getText();
        console.log('--- PDF TEXT START ---');
        console.log(result.text);
        console.log('--- PDF TEXT END ---');
        await parser.destroy();
    } catch (err) {
        console.error('Error parsing PDF:', err);
        process.exit(1);
    }
}

run();
