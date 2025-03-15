import React, { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { saveAs } from "file-saver";
import { Worker, Viewer } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/default-layout/lib/styles/index.css";

const PdfUploader = () => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [modifiedPdf, setModifiedPdf] = useState(null);
  const logoUrl = "/logo.jpg"; // Place your logo in the public folder

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setPdfUrl(fileUrl);
      await addLogoToPdf(file);
    }
  };

  const addLogoToPdf = async (pdfFile) => {
    try {
      // Read the PDF file
      const fileReader = new FileReader();
      fileReader.readAsArrayBuffer(pdfFile);
      fileReader.onload = async () => {
        const pdfBytes = fileReader.result;
        const pdfDoc = await PDFDocument.load(pdfBytes);
  
        // Load and embed the logo (supports JPG or PNG)
        const logoBytes = await fetch(logoUrl).then((res) => res.arrayBuffer());
        const logoImage = await pdfDoc.embedJpg(logoBytes); // Use embedPng for PNG logos
  
        // Iterate over all pages to add watermark & top-right logo
        const pages = pdfDoc.getPages();
        for (let page of pages) {
          const { width, height } = page.getSize();
  
          // ✅ Add the watermark (background logo)
          page.drawImage(logoImage, {
            x: width / 4, // Center horizontally
            y: height / 3, // Adjust vertical position
            width: width / 2, // Scale the logo
            height: height / 2,
            opacity: 0.3, // Watermark effect
          });
  
          // ✅ Add the logo in the top-right corner
          page.drawImage(logoImage, {
            x: width - 100, // Position it near the top-right
            y: height - 50,
            width: 80, // Adjust the size
            height: 40,
            opacity: 1, // Fully visible
          });
        }
  
        // Convert PDF to Blob for preview
        const modifiedPdfBytes = await pdfDoc.save();
        const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });
        setModifiedPdf(URL.createObjectURL(blob));
      };
    } catch (error) {
      console.error("Error processing PDF:", error);
    }
  };
  
  const downloadPdf = () => {
    if (modifiedPdf) {
      saveAs(modifiedPdf, "updated_report.pdf");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Upload Medical Report PDF</h1>
      <input type="file" accept="application/pdf" onChange={handleFileUpload} className="border p-2 mb-4" />

      {modifiedPdf && (
        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">Preview:</h3>
          <div className="border p-2 h-96 overflow-auto">
          <Worker workerUrl={`https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js`} >

              <Viewer fileUrl={modifiedPdf} />
            </Worker>
          </div>
          <button onClick={downloadPdf} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Download PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default PdfUploader;
