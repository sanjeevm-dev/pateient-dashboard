"use client";

import React, { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ url }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  return (
    <div className="flex flex-col items-center">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        className="max-w-full"
      >
        <Page
          pageNumber={pageNumber}
          className="rounded-lg shadow-lg"
          renderTextLayer={false}
          renderAnnotationLayer={false}
        />
      </Document>
      {numPages > 1 && (
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => setPageNumber((page) => Math.max(page - 1, 1))}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Previous
          </button>
          <p className="text-sm">
            Page {pageNumber} of {numPages}
          </p>
          <button
            onClick={() =>
              setPageNumber((page) => Math.min(page + 1, numPages))
            }
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-gray-100 rounded-md disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
