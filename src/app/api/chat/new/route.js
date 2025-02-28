import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper functions (same as above)
const getSessionsData = () => {
  const dataPath = path.join(
    process.cwd(),
    "server",
    "data",
    "chatSessions.json"
  );
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  const data = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(data);
};

const saveSessionsData = (sessions) => {
  const dataPath = path.join(
    process.cwd(),
    "server",
    "data",
    "chatSessions.json"
  );
  fs.writeFileSync(dataPath, JSON.stringify(sessions, null, 2));
};

// POST /api/chat/new - Create new session
export async function POST(request) {
  try {
    const sessions = getSessionsData();
    const newSession = {
      session_id: `session${Date.now()}`,
      title: "New Consultation",
      date: new Date().toISOString().split("T")[0],
      messages: [],
    };

    sessions.unshift(newSession);
    saveSessionsData(sessions);

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating new session:", error);
    return NextResponse.json(
      { error: "Failed to create new session" },
      { status: 500 }
    );
  }
}
