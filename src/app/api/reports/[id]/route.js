import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

// Helper function to read reports from JSON file
async function getReportsFromFile() {
  const filePath = path.join(process.cwd(), "src/app/data/reports.json");
  const fileData = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileData).reports || [];
}

// Helper function to save reports to JSON file
async function saveReportsToFile(reports) {
  const filePath = path.join(process.cwd(), "src/app/data/reports.json");
  await fs.writeFile(filePath, JSON.stringify({ reports }, null, 2));
}

// GET /api/reports/[id]
export async function GET(request, { params }) {
  try {
    const reports = await getReportsFromFile();
    const report = reports.find((r) => r.report_id === params.id);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Error getting report:", error);
    return NextResponse.json(
      { error: "Failed to fetch report" },
      { status: 500 }
    );
  }
}

// DELETE /api/reports/[id]
export async function DELETE(request, { params }) {
  try {
    const reports = await getReportsFromFile();
    const reportIndex = reports.findIndex((r) => r.report_id === params.id);

    if (reportIndex === -1) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete file if it exists
    const report = reports[reportIndex];
    if (report.filePath) {
      const filePath = path.join(process.cwd(), "public", report.filePath);
      try {
        await fs.unlink(filePath);
      } catch (error) {
        console.error("Error deleting file:", error);
      }
    }

    // Remove report from array
    reports.splice(reportIndex, 1);
    await saveReportsToFile(reports);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting report:", error);
    return NextResponse.json(
      { error: "Failed to delete report" },
      { status: 500 }
    );
  }
}
