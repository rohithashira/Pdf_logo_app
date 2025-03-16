import React, { useState, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const PdfUploader = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [modifiedPdf, setModifiedPdf] = useState(null);
  
  // Logos (Make sure these are in the public folder)
  const logo1Url = "/logo1.jpg"; // Top-left
  const logo2Url = "/logo2.jpg"; // Top-center & Watermark
  const logo3Url = "/logo3.jpg"; // Top-right

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
      if (modifiedPdf) URL.revokeObjectURL(modifiedPdf);
    };
  }, [pdfUrl, modifiedPdf]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileUrl = URL.createObjectURL(file);
    setPdfUrl(fileUrl);
    await addLogosToPdf(file);
  };

  const addLogosToPdf = async (pdfFile) => {
    try {
      const pdfBytes = await readFileAsArrayBuffer(pdfFile);
      const pdfDoc = await PDFDocument.load(pdfBytes);

      // Load and embed all logos
      const [logo1, logo2, logo3] = await Promise.all([
        embedImage(pdfDoc, logo1Url),
        embedImage(pdfDoc, logo2Url),
        embedImage(pdfDoc, logo3Url),
      ]);

      // Iterate over pages and add logos
      const pages = pdfDoc.getPages();
      for (let page of pages) {
        const { width, height } = page.getSize();

        // ✅ Watermark (Logo2 in the background)
        page.drawImage(logo2, {
          x: width / 4,
          y: height / 3 - 28.35, // Move 1 cm down
          width: width / 2,
          height: height / 2,
          opacity: 0.2, // Watermark effect
        });

        // ✅ Logo1 (Top-left)
        page.drawImage(logo1, {
          x: 20, // Left padding
          y: height - 50,
          width: 80,
          height: 40,
        });

        // ✅ Logo2 (Top-center, beside Logo1)
        page.drawImage(logo2, {
          x: width / 2 - 40, // Centered horizontally
          y: height - 50,
          width: 80,
          height: 40,
        });

        // ✅ Logo3 (Top-right)
        page.drawImage(logo3, {
          x: width - 100, // Right padding
          y: height - 50,
          width: 80,
          height: 40,
        });
      }

      // Convert to Blob and update state
      const modifiedPdfBytes = await pdfDoc.save();
      const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
      setModifiedPdf(URL.createObjectURL(blob));
    } catch (error) {
      console.error("Error processing PDF:", error);
    }
  };

  const readFileAsArrayBuffer = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
  };

  const embedImage = async (pdfDoc, url) => {
    const response = await fetch(url);
    const bytes = await response.arrayBuffer();
    const contentType = response.headers.get("content-type");
    return contentType.includes("png")
      ? pdfDoc.embedPng(bytes)
      : pdfDoc.embedJpg(bytes);
  };

  const downloadPdf = () => {
    if (modifiedPdf) {
      saveAs(modifiedPdf, "updated_report.pdf");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Upload Medical Report PDF</h1>
      <input
        type="file"
        accept="application/pdf"
        onChange={handleFileUpload}
        className="border p-2 mb-4"
      />

      {modifiedPdf && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <div className="border p-2 h-96 overflow-auto">
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js">
              <Viewer fileUrl={modifiedPdf} />
            </Worker>
          </div>
          <button
            onClick={downloadPdf}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          >
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
