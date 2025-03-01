import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST() {
  try {
    const dataPath = path.join(
      process.cwd(),
      "server",
      "data",
      "aiChatSessions.json"
    );

    // Create directory if it doesn't exist
    const dir = path.dirname(dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Read existing sessions
    // Read existing sessions
    let sessions = [];
    if (fs.existsSync(dataPath)) {
      sessions = JSON.parse(fs.readFileSync(dataPath, "utf8"));
    }

    // Create a dynamic session name
    const sessionNumber = sessions.length + 1;
    const newSession = {
      id: `session${Date.now()}`,
      title: `Session ${sessionNumber}`,
      createdAt: new Date().toISOString(),
      isActive: true,
      messages: [],
    };

    // Add new session to the beginning of the array
    sessions.unshift(newSession);

    // Save updated sessions
    fs.writeFileSync(dataPath, JSON.stringify(sessions, null, 2));

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating new chat session:", error);
    return NextResponse.json(
      { error: "Failed to create new chat session" },
      { status: 500 }
    );
  }
}
