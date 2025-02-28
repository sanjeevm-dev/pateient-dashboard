import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const initializeServerData = () => {
  const serverDir = path.join(process.cwd(), "server");
  const dataDir = path.join(serverDir, "data");
  const sessionsPath = path.join(dataDir, "chatSessions.json");

  // Create directories if they don't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize with empty array if file doesn't exist
  if (!fs.existsSync(sessionsPath)) {
    fs.writeFileSync(sessionsPath, JSON.stringify([], null, 2));
  }
};

// GET /api/sessions
export async function GET() {
  try {
    initializeServerData();
    const dataPath = path.join(
      process.cwd(),
      "server",
      "data",
      "chatSessions.json"
    );
    const data = fs.readFileSync(dataPath, "utf8");
    return NextResponse.json(JSON.parse(data));
  } catch (error) {
    console.error("Error getting sessions:", error);
    return NextResponse.json(
      { error: "Failed to get sessions" },
      { status: 500 }
    );
  }
}
