import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Initialize server directories
const initializeServerDirs = () => {
  const dirs = {
    server: path.join(process.cwd(), "server"),
    data: path.join(process.cwd(), "server", "data"),
    files: path.join(process.cwd(), "server", "files", "uploads"),
  };

  Object.values(dirs).forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const reportsPath = path.join(dirs.data, "reports.json");
  if (!fs.existsSync(reportsPath)) {
    fs.writeFileSync(reportsPath, "[]");
  }

  return dirs;
};

// Helper function to read reports data
const getReportsData = () => {
  const { data } = initializeServerDirs();
  const filePath = path.join(data, "reports.json");
  const fileData = fs.readFileSync(filePath, "utf8");
  return JSON.parse(fileData);
};

// Helper function to save reports data
const saveReportsData = (reports) => {
  const { data } = initializeServerDirs();
  const filePath = path.join(data, "reports.json");
  fs.writeFileSync(filePath, JSON.stringify(reports, null, 2));
};

// GET /api/reports
export async function GET() {
  try {
    const reports = getReportsData();
    return NextResponse.json(reports);
  } catch (error) {
    console.error("Error getting reports:", error);
    return NextResponse.json(
      { error: "Failed to get reports" },
      { status: 500 }
    );
  }
}

// POST /api/reports
export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const category = formData.get("category") || "Other";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const { files } = initializeServerDirs();
    const fileType = file.type.startsWith("image/") ? "image" : "pdf";
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(files, fileName);

    // Save file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Create report entry
    const reports = getReportsData();
    const newReport = {
      report_id: Date.now().toString(),
      title: title || file.name,
      category,
      date: new Date().toISOString().split("T")[0],
      fileType,
      fileName,
      filePath: `/api/reports/file/${fileName}`,
      uploadedAt: new Date().toISOString(),
    };

    reports.unshift(newReport);
    saveReportsData(reports);

    return NextResponse.json(newReport);
  } catch (error) {
    console.error("Error uploading report:", error);
    return NextResponse.json(
      { error: "Failed to upload report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports?id={reportId}
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json(
        { error: "Report ID is required" },
        { status: 400 }
      );
    }

    const reports = getReportsData();
    const reportIndex = reports.findIndex((r) => r.report_id === reportId);

    if (reportIndex === -1) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    const report = reports[reportIndex];
    const { files } = initializeServerDirs();
    const filePath = path.join(files, report.fileName);

    // Delete file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove report from data
    reports.splice(reportIndex, 1);
    saveReportsData(reports);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
