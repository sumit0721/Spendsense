const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');

const exportPDF = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 }).lean();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=spendsense-transactions.pdf');

  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  doc.pipe(res);

  doc.fontSize(18).font('Helvetica-Bold').text('SpendSense — Transaction History', { align: 'center' });
  doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Generated ${new Date().toLocaleDateString()}`, { align: 'center' });
  doc.moveDown(1.5);

  const colWidths = { date: 70, merchant: 140, category: 90, type: 55, amount: 80 };
  const startX = doc.page.margins.left;
  let y = doc.y;

  const drawRow = (cells, isHeader = false) => {
    let x = startX;
    doc.font(isHeader ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(isHeader ? '#fff' : '#1b1b1d');
    if (isHeader) {
      doc.rect(startX, y, Object.values(colWidths).reduce((a, b) => a + b, 0), 20).fill('#0f172a');
      doc.fillColor('#fff');
    }
    Object.keys(colWidths).forEach((key) => {
      doc.text(cells[key], x + 5, y + 5, { width: colWidths[key] - 10 });
      x += colWidths[key];
    });
    y += 20;
  };

  drawRow({ date: 'Date', merchant: 'Merchant', category: 'Category', type: 'Type', amount: 'Amount' }, true);

  transactions.forEach((t, i) => {
    if (y > doc.page.height - 60) { doc.addPage(); y = doc.page.margins.top; }
    if (i % 2 === 0) {
      doc.rect(startX, y, Object.values(colWidths).reduce((a, b) => a + b, 0), 20).fill('#f5f1f3');
    }
    drawRow({
      date: new Date(t.date).toLocaleDateString(),
      merchant: t.merchant.length > 22 ? t.merchant.slice(0, 20) + '…' : t.merchant,
      category: t.category,
      type: t.type === 'income' ? 'Income' : 'Expense',
      amount: `${t.type === 'income' ? '+' : '-'}₹${t.amount.toFixed(2)}`,
    });
  });

  // Outer border around the full table
  doc.rect(startX, doc.y, 1, 1); // no-op, keeps pdfkit's cursor sane
  doc.end();
});

const exportExcel = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 }).lean();

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Merchant', key: 'merchant', width: 25 },
    { header: 'Category', key: 'category', width: 18 },
    { header: 'Type', key: 'type', width: 10 },
    { header: 'Amount', key: 'amount', width: 12 },
    { header: 'Payment Method', key: 'paymentMethod', width: 15 },
  ];

  transactions.forEach((t) => {
    sheet.addRow({
      date: new Date(t.date).toLocaleDateString(),
      merchant: t.merchant,
      category: t.category,
      type: t.type,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=spendsense-transactions.xlsx');
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { exportPDF, exportExcel };
