const express = require("express");
const cors = require("cors");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const archiver = require("archiver");

const app = express();
app.use(cors());
app.use(express.json());

const pdfDir = path.join(__dirname, "pdfs");
const zipDir = path.join(__dirname, "zips");

if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir);
if (!fs.existsSync(zipDir)) fs.mkdirSync(zipDir);

app.use("/pdfs", express.static(pdfDir));
app.use("/zips", express.static(zipDir));

app.post("/convert", async (req, res) => {
  const { url } = req.body;
  console.log("Received URL:", url);

  if (!url) return res.status(400).json({ error: "URL required" });

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      executablePath: puppeteer.executablePath(), // FIX for Render
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });

    await page.goto(url, {
      waitUntil: "networkidle0",
      timeout: 60000,
    });

    const hasVideo = await page.evaluate(() => {
      return (
        document.querySelector("video") !== null ||
        document.querySelector("iframe[src*='youtube']") !== null ||
        document.querySelector("iframe[src*='vimeo']") !== null
      );
    });

    const fileName = `page_${Date.now()}.pdf`;
    const filePath = path.join(pdfDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    await browser.close();

    // ---- Merge PDF ----
    const mergedPdf = await PDFDocument.create();
    const bytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(bytes);
    const copied = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
    copied.forEach((p) => mergedPdf.addPage(p));

    const mergedName = `merged_${Date.now()}.pdf`;
    const mergedPath = path.join(pdfDir, mergedName);
    const mergedBytes = await mergedPdf.save();
    fs.writeFileSync(mergedPath, mergedBytes);

    // ---- Create ZIP ----
    const zipName = `all_${Date.now()}.zip`;
    const zipPath = path.join(zipDir, zipName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip");

    archive.pipe(output);
    archive.file(filePath, { name: fileName });
    archive.file(mergedPath, { name: "merged.pdf" });
    await archive.finalize();

    res.json({
      pages: [
        {
          pdf: `pdfs/${fileName}`,
          hasVideo,
        },
      ],
      mergedPdf: `pdfs/${mergedName}`,
      zip: `zips/${zipName}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Conversion failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
