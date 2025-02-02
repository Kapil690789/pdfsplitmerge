const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const pdfSchema = new mongoose.Schema({
  filename: String,
  path: String,
});

const PDF = mongoose.model('PDF', pdfSchema);

app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    const pdf = new PDF({
      filename: req.file.originalname,
      path: req.file.path,
    });
    await pdf.save();
    res.json({ message: 'PDF uploaded successfully', id: pdf._id });
  } catch (error) {
    res.status(500).json({ error: 'Error uploading PDF' });
  }
});

app.post('/split', async (req, res) => {
  try {
    const { id, pages } = req.body;
    const pdf = await PDF.findById(id);
    const pdfDoc = await PDFDocument.load(fs.readFileSync(pdf.path));
    const newPdf = await PDFDocument.create();

    for (const pageNum of pages) {
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [pageNum - 1]);
      newPdf.addPage(copiedPage);
    }

    const pdfBytes = await newPdf.save();
    const outputPath = path.join('uploads', `split_${pdf.filename}`);
    fs.writeFileSync(outputPath, pdfBytes);

    res.download(outputPath);
  } catch (error) {
    res.status(500).json({ error: 'Error splitting PDF' });
  }
});

app.post('/merge', upload.array('pdfs'), async (req, res) => {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdfDoc = await PDFDocument.load(fs.readFileSync(file.path));
      const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const pdfBytes = await mergedPdf.save();
    const outputPath = path.join('uploads', 'merged.pdf');
    fs.writeFileSync(outputPath, pdfBytes);

    res.download(outputPath);
  } catch (error) {
    res.status(500).json({ error: 'Error merging PDFs' });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});