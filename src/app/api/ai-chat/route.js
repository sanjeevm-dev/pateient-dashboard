import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Helper function to read AI chat sessions
const getChatSessions = () => {
  const dataPath = path.join(
    process.cwd(),
    "server",
    "data",
    "aiChatSessions.json"
  );
  if (!fs.existsSync(dataPath)) {
    fs.writeFileSync(dataPath, "[]");
    return [];
  }
  const data = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(data);
};

// Helper function to save AI chat sessions
const saveChatSessions = (sessions) => {
  const dataPath = path.join(
    process.cwd(),
    "server",
    "data",
    "aiChatSessions.json"
  );
  fs.writeFileSync(dataPath, JSON.stringify(sessions, null, 2));
};

// GET /api/ai-chat - Get all chat sessions
export async function GET() {
  try {
    const sessions = getChatSessions();
    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error getting chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to get chat sessions" },
      { status: 500 }
    );
  }
}

// POST /api/ai-chat - Send a message
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

    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex === -1) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session is active
    if (!sessions[sessionIndex].isActive) {
      return NextResponse.json(
        { error: "Cannot send message to inactive session" },
        { status: 400 }
      );
    }

    // Add user message
    const userMessage = {
      id: `msg_${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
    };

    sessions[sessionIndex].messages.push(userMessage);

    // Add AI response
    const aiMessage = {
      id: `msg_${Date.now() + 1}`,
      role: "assistant",
      content: `Response to: ${message}`, // Replace with actual AI response
      timestamp: new Date().toISOString(),
    };

    sessions[sessionIndex].messages.push(aiMessage);
    saveChatSessions(sessions);

    return NextResponse.json(sessions[sessionIndex]);
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 }
    );
  }
}

// Add a new endpoint to end chat sessions
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    const sessions = getChatSessions();
    const sessionIndex = sessions.findIndex((s) => s.id === sessionId);

    if (sessionIndex === -1) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Mark session as ended
    sessions[sessionIndex].isActive = false;
    saveChatSessions(sessions);

    return NextResponse.json(sessions[sessionIndex]);
  } catch (error) {
    console.error("Error ending chat session:", error);
    return NextResponse.json(
      { error: "Failed to end chat session" },
      { status: 500 }
    );
  }
}
