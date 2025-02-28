import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const title = formData.get("title");
    const category = formData.get("category");

    if (!file || !title) {
      return NextResponse.json(
        { error: "File and title are required" },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Upload the file to a storage service (e.g., AWS S3, Google Cloud Storage)
    // 2. Save the metadata to your database
    // For now, we'll return a mock response

    const mockReport = {
      report_id: Date.now().toString(),
      title,
      category,
      type: file.type.startsWith("image/") ? "image" : "pdf",
      fileUrl: URL.createObjectURL(file), // Note: This is temporary and will only work client-side
      uploadedAt: new Date().toISOString(),
    };

    return NextResponse.json(mockReport);
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Error processing upload" },
      { status: 500 }
    );
  }
}
