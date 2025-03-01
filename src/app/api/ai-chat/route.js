import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import axios from "axios";

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

// Helper function to get reports
const getReports = () => {
  const dataPath = path.join(process.cwd(), "server", "data", "reports.json");
  if (!fs.existsSync(dataPath)) {
    return [];
  }
  const data = fs.readFileSync(dataPath, "utf8");
  return JSON.parse(data);
};

// System prompt for the AI
const systemPrompt = `You are an AI medical assistant helping with patient consultations.
You have access to the patient's medical reports and chat history.
Please provide relevant, accurate, and helpful responses based on this information.

Format your responses using the following structure:

### Test Results
**Hormone Levels**
- Present each test result on a new line
- Format as "Test Name: Value (normal range: X-Y units)"

**Other Parameters**
- Additional test results
- Secondary findings

### Summary
**Key Findings**
- Main observations
- Important patterns

**Clinical Interpretation**
- Overall health status
- Medical significance

### Recommendations
**Immediate Actions**
- Priority steps
- Required tests

**Follow-up Care**
- Monitoring plan
- Future appointments

Additional formatting guidelines:
- Use ### for main sections
- Use **text** for subsections
- Use bullet points (-) for lists
- Keep sentences concise and clear
- Use proper spacing between sections`;

// File content prompt
const filePrompt = `Please consider the medical reports and test results provided when formulating your response.
Focus on relevant medical data and provide explanations that are both accurate and understandable to the patient.`;

// Function to generate AI response
const generateRelevantResponse = async (anthropicMessages, relevantContext) => {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) {
    console.error("OPEN_ROUTER_API_KEY Key is missing. Please configure it.");
    return;
  }
  console.time("generateRelevantResponse");

  const enhancedSystemPrompt = `${systemPrompt}\n\nContext:\n${relevantContext}\n\n${filePrompt}`;
  let openaiResponse;

  try {
    // Making the API call
    openaiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "openai/gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: enhancedSystemPrompt,
          },
          ...anthropicMessages,
        ],
        top_p: 0.8,
        temperature: 0.2,
        repetition_penalty: 1.1,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Ensure the response has the expected structure
    if (!openaiResponse?.data?.choices?.[0]?.message?.content) {
      throw new Error("Unexpected response structure from OpenRouter API.");
    }

    console.timeEnd("generateRelevantResponse");
    // Return the assistant's response
    return openaiResponse.data.choices[0].message.content.trim();
  } catch (err) {
    // Categorize the error
    if (err.response) {
      console.error("API Error:", {
        status: err.response.status,
        data: err.response.data,
      });
      throw new Error(
        `OpenRouter API Error: ${err.response.status} - ${
          err.response.data?.message || "Unknown error"
        }`
      );
    } else if (err.request) {
      console.error("Network Error: No response received from OpenRouter API.");
      throw new Error("Network Error: Unable to reach the OpenRouter API.");
    } else {
      console.error("Unexpected Error:", err.message);
      throw new Error(`Unexpected Error: ${err.message}`);
    }
  }
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

    // Get reports data
    const reports = getReports();

    console.log(reports.length);

    // Prepare context for AI
    const relevantContext = `
Reports Data:
${reports
  .map(
    (report) => `
Report ID: ${report.report_id}
Title: ${report.title}
Date: ${report.date}
Content: ${report.fileContent}
`
  )
  .join("\n")}

Chat History:
${sessions[sessionIndex].messages
  .map(
    (msg) => `
${msg.role}: ${msg.content}
Timestamp: ${msg.timestamp}
`
  )
  .join("\n")}
`;

    // Format messages for AI
    const anthropicMessages = sessions[sessionIndex].messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Generate AI response
    const aiResponseContent = await generateRelevantResponse(
      anthropicMessages,
      relevantContext
    );

    // Add AI response
    const aiMessage = {
      id: `msg_${Date.now() + 1}`,
      role: "assistant",
      content: aiResponseContent,
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
