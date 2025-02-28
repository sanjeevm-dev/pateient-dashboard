import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper function to read sessions data
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

// Helper function to save sessions data
const saveSessionsData = (sessions) => {
  const dataPath = path.join(
    process.cwd(),
    "server",
    "data",
    "chatSessions.json"
  );
  fs.writeFileSync(dataPath, JSON.stringify(sessions, null, 2));
};

// POST /api/chat - Send a message
export async function POST(request) {
  try {
    const body = await request.json();
    const { sessionId, message } = body;

    if (!sessionId || !message) {
      return NextResponse.json(
        { error: "Session ID and message are required" },
        { status: 400 }
      );
    }

    const sessions = getSessionsData();
    const sessionIndex = sessions.findIndex((s) => s.session_id === sessionId);

    if (sessionIndex === -1) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Add user message
    const newUserMessage = {
      _id: Date.now().toString(),
      sender: "Patient",
      message,
      timestamp: new Date().toISOString(),
    };

    sessions[sessionIndex].messages.push(newUserMessage);

    // TODO: Add your AI/response logic here
    // This is where you'll implement your response generation
    const botResponse = {
      _id: (Date.now() + 1).toString(),
      sender: "Doctor",
      message: "This is a placeholder response. Replace with actual AI logic.",
      timestamp: new Date().toISOString(),
    };

    sessions[sessionIndex].messages.push(botResponse);
    saveSessionsData(sessions);

    return NextResponse.json({
      userMessage: newUserMessage,
      botResponse,
    });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}
