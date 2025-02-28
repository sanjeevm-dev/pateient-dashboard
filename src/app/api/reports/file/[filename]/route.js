import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request, { params }) {
  try {
    const { filename } = await params;
    const filePath = path.join(
      process.cwd(),
      "server",
      "files",
      "uploads",
      filename
    );

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    const fileType = filename.endsWith(".pdf") ? "application/pdf" : "image/*";

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": fileType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return NextResponse.json(
      { error: "Failed to serve file" },
      { status: 500 }
    );
  }
}
