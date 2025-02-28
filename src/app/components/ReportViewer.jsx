"use client";

import React from "react";
import { FileText } from "lucide-react";
import Image from "next/image";

const ReportViewer = ({ report }) => {
  if (!report) return null;

  if (report.fileType === "image") {
    return (
      <div className="w-full h-auto">
        <Image
          src={report.filePath}
          alt={report.title}
          width={800}
          height={600}
          className="max-w-full h-auto rounded-lg"
        />
      </div>
    );
  }

  return (
    <embed
      src={report.filePath}
      type="application/pdf"
      width="100%"
      height="600px"
      className="rounded-lg"
    />
  );
};

export default ReportViewer;
