import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const dataPath = path.join(
      process.cwd(),
      "server",
      "data",
      "consultations.json"
    );

    // Create directory if it doesn't exist
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create file with sample data if it doesn't exist
    if (!fs.existsSync(dataPath)) {
      const sampleData = [
        {
          id: "1",
          title: "Initial Consultation",
          date: "2024-03-20T10:00:00Z",
          doctor: "Dr. Smith",
          messages: [
            {
              role: "doctor",
              content: "How are you feeling today?",
              timestamp: "2024-03-20T10:01:00Z",
            },
            {
              role: "user",
              content: "I've been experiencing headaches.",
              timestamp: "2024-03-20T10:02:00Z",
            },
          ],
        },
      ];
      fs.writeFileSync(dataPath, JSON.stringify(sampleData, null, 2));
    }

    const data = fs.readFileSync(dataPath, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error getting consultations:", error);
    return NextResponse.json(
      { error: "Failed to get consultations" },
      { status: 500 }
    );
  }
}
