const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const Transaction = require('../models/Transaction');
const { asyncHandler } = require('../middleware/errorHandler');

const exportPDF = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ user: req.user._id }).sort({ date: -1 }).lean();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=spendsense-transactions.pdf');

  const doc = new PDFDocument({ margin: 40 });
  doc.pipe(res);

  doc.fontSize(18).text('SpendSense — Transaction History', { align: 'center' });
  doc.moveDown();
  doc.fontSize(10);

  transactions.forEach((t) => {
    const line = `${new Date(t.date).toLocaleDateString()}  |  ${t.merchant}  |  ${t.category}  |  ${t.type === 'income' ? '+' : '-'}₹${t.amount}`;
    doc.text(line);
  });

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
