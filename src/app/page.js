"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  FileText,
  ChevronRight,
  Search,
  Menu,
  X,
  MessageSquare,
  Trash2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import UploadReportModal from "./components/UploadReportModal";
import Loader from "./components/Loader";

// Enhanced Toast component
const Toast = ({ message, onClose }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onClose, 300); // Wait for exit animation
    }, 2700); // Slightly less than progress bar to ensure smooth transition

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-4 right-4 flex items-center gap-3 min-w-[320px] bg-gradient-to-r from-slate-900 to-slate-800 text-white px-4 py-3 rounded-lg shadow-lg z-50 ${
        isExiting ? "animate-slide-out" : "animate-slide-in"
      }`}
    >
      <div className="flex items-center gap-3 flex-1">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-blue-400" />
        </div>
        <p className="text-sm font-medium pr-4">{message}</p>
      </div>
      <button
        onClick={() => {
          setIsExiting(true);
          setTimeout(onClose, 300);
        }}
        className="flex-shrink-0 rounded-full p-1 hover:bg-slate-700 transition-colors duration-200"
      >
        <X className="h-4 w-4" />
      </button>
      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-blue-400/20 w-full rounded-b-lg overflow-hidden">
        <div className="h-full bg-blue-400 animate-progress rounded-lg" />
      </div>
    </div>
  );
};

export default function Home() {
  const [selectedSession, setSelectedSession] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [reports, setReports] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedChatSession, setSelectedChatSession] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [consultations, setConsultations] = useState([]);
  const [activeChatSessions, setActiveChatSessions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  // Add showToast function
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load reports
        const reportsResponse = await fetch("/api/reports");
        if (!reportsResponse.ok) {
          throw new Error("Failed to load reports");
        }
        const reportsData = await reportsResponse.json();
        setReports(Array.isArray(reportsData) ? reportsData : []);

        // Load sessions
        const sessionsResponse = await fetch("/api/sessions");
        if (!sessionsResponse.ok) {
          throw new Error("Failed to load sessions");
        }
        const sessionsData = await sessionsResponse.json();
        setSessions(Array.isArray(sessionsData) ? sessionsData : []);

        // Load consultations
        const consultationsResponse = await fetch("/api/consultations");
        if (!consultationsResponse.ok) {
          throw new Error("Failed to load consultations");
        }
        const consultationsData = await consultationsResponse.json();
        setConsultations(
          Array.isArray(consultationsData) ? consultationsData : []
        );
      } catch (error) {
        console.error("Error loading data:", error);
        setError(error.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadChatSessions = async () => {
      try {
        const response = await fetch("/api/ai-chat");
        if (!response.ok) throw new Error("Failed to load chat sessions");
        const data = await response.json();
        setChatSessions(data);
        setActiveChatSessions(data.filter((session) => session.isActive));
      } catch (error) {
        console.error("Error loading chat sessions:", error);
      }
    };

    loadChatSessions();
  }, []);

  useEffect(() => {
    if (!selectedChatSession?.isActive) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `/api/ai-chat?sessionId=${selectedChatSession.id}`
        );
        if (!response.ok) throw new Error("Failed to fetch updates");
        const data = await response.json();

        setChatSessions((prev) =>
          prev.map((session) => (session.id === data.id ? data : session))
        );
      } catch (error) {
        console.error("Error fetching updates:", error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedChatSession?.id, selectedChatSession?.isActive]);

  const handleUpload = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
  };

  const handleDeleteReport = async (reportId) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const response = await fetch(`/api/reports?id=${reportId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete report");
      }

      setReports((prevReports) =>
        prevReports.filter((report) => report.report_id !== reportId)
      );
      setSelectedReport(null);
    } catch (error) {
      console.error("Error deleting report:", error);
      showToast("Failed to delete report. Please try again.");
    }
  };

  const renderReport = (report) => {
    return report.fileType === "image" ? (
      <img
        src={report.filePath}
        alt={report.title}
        style={{ maxWidth: "100%", height: "auto" }}
      />
    ) : (
      <embed
        src={report.filePath}
        type="application/pdf"
        width="100%"
        height="100%"
      />
    );
  };

  const handleNewSession = async () => {
    try {
      const response = await fetch("/api/chat/new", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create new session");
      }

      const newSession = await response.json();
      setSessions((prev) => [newSession, ...prev]);
      setSelectedSession(newSession);
    } catch (error) {
      console.error("Error creating new session:", error);
      showToast("Failed to create new session. Please try again.");
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/ai-chat/new", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to create new chat");
      }

      const newSession = await response.json();
      setChatSessions((prev) => [newSession, ...prev]);
      setSelectedChatSession(newSession);
    } catch (error) {
      console.error("Error creating new chat:", error);
      showToast("Failed to create new chat. Please try again.");
    }
  };

  const LoadingMessage = () => (
    <div className="flex items-center space-x-2 p-4 bg-gray-800 rounded-lg max-w-[80%]">
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-3 h-3 bg-gray-300 rounded-full animate-bounce"></div>
      </div>
      <span className="text-lg text-gray-300">Generating response</span>
    </div>
  );

  const handleSendMessage = async (message) => {
    if (
      !selectedChatSession?.id ||
      !message.trim() ||
      !selectedChatSession.isActive
    )
      return;

    setNewMessage(""); // Clear input immediately
    setIsGenerating(true); // Show loading state

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedChatSession.id,
          message: message.trim(),
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const updatedSession = await response.json();

      // Update the sessions list and selected session
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === updatedSession.id ? updatedSession : session
        )
      );
      setSelectedChatSession(updatedSession);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsGenerating(false); // Hide loading state
    }
  };

  const handleEndChat = async () => {
    if (!selectedChatSession?.id) return;

    try {
      const response = await fetch("/api/ai-chat", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: selectedChatSession.id,
        }),
      });

      if (!response.ok) throw new Error("Failed to end chat session");

      const updatedSession = await response.json();
      setChatSessions((prev) =>
        prev.map((session) =>
          session.id === updatedSession.id ? updatedSession : session
        )
      );
      setActiveChatSessions((prev) =>
        prev.filter((session) => session.id !== updatedSession.id)
      );
      // wait for 2 sec and reload the page
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error ending chat session:", error);
    }
  };

  // Update handleTabSwitch to use showToast
  const handleTabSwitch = (tab) => {
    if (selectedChatSession?.isActive && tab !== "chat") {
      showToast("Please end the current chat session before switching tabs.");
      return;
    }
    setActiveTab(tab);
  };

  // Add function to handle Ask AI from other tabs
  const handleAskAI = async () => {
    await handleNewChat();
    setActiveTab("chat");
  };

  if (loading) {
    return <Loader text="Loading reports..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4 ">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg
              className="w-12 h-12 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h3 className="text-lg font-medium text-center">{error}</h3>
          </div>
          <div className="text-sm text-gray-500 text-center">
            <p>Make sure to run both the server and client using:</p>
            <code className="bg-gray-100 px-2 py-1 rounded mt-2 inline-block">
              npm run dev
            </code>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gray-50 overflow-y-hidden ">
      {/* Add Toast component */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <h1 className="ml-2 text-xl font-semibold text-gray-800">
                Patient Dashboard
              </h1>
            </div>
            <div>
              <Image src="/Exthalpy.svg" alt="logo" width={200} height={100} />
            </div>

            <div className="hidden md:flex items-center space-x-4"></div>

            <button
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {/* {mobileMenuOpen && (
        <div className="md:hidden bg-white shadow-md">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="p-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-slate-950 focus:border-slate-950"
                />
              </div>
            </div>
            <button className="w-full bg-slate-950 text-white px-4 py-2 rounded-md hover:bg-white hover:text-slate-950 hover:border">
              New Session
            </button>
          </div>
        </div>
      )} */}

      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row">
          {/* Sidebar - Patient Info */}
          {sidebarOpen && (
            <div className="w-full md:w-64 bg-white rounded-xl shadow-md p-4 mb-4 md:mb-0 md:mr-4 h-[calc(100vh-5rem)]">
              <div className="flex flex-col items-center mb-4">
                <Image
                  src="/profile.webp"
                  alt="Profile Picture"
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-4 border-gray-200 shadow-lg"
                />
                <h2 className="text-lg font-semibold">Rashmi</h2>
                <p className="text-sm text-gray-500">ID: 12345678</p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <div className="flex flex-col gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="font-medium">28</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="font-medium">Female</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="font-medium">555-123-4567</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium truncate">
                      Rashmi.doe@example.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-md overflow-hidden h-[calc(100vh-5rem)] ">
              {/* Tabs and Add Report Button */}
              <div className="border-b border-gray-200 flex justify-between items-center px-4">
                <nav className="flex">
                  <button
                    onClick={() => handleTabSwitch("chat")}
                    className={`px-4 py-3 text-sm font-medium ${
                      activeTab === "chat"
                        ? "border-b-2 border-slate-950 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    AI Chat
                  </button>
                  <button
                    onClick={() => handleTabSwitch("consultations")}
                    className={`px-4 py-3 text-sm font-medium ${
                      activeTab === "consultations"
                        ? "border-b-2 border-slate-950 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Consultations
                  </button>
                  <button
                    onClick={() => handleTabSwitch("reports")}
                    className={`px-4 py-3 text-sm font-medium ${
                      activeTab === "reports"
                        ? "border-b-2 border-slate-950 text-blue-600"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Reports
                  </button>
                </nav>

                <div className="flex gap-2">
                  {activeTab === "reports" && (
                    <>
                      <button
                        onClick={handleAskAI}
                        className="bg-slate-950 hover:bg-white hover:text-slate-950 hover:border text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
                      >
                        <MessageSquare size={16} />
                        Ask AI
                      </button>
                      <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-slate-950 hover:bg-white hover:text-slate-950 hover:border text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
                      >
                        <FileText size={16} />
                        Add Report
                      </button>
                    </>
                  )}

                  {activeTab === "consultations" && (
                    <button
                      onClick={handleAskAI}
                      className="bg-slate-950 hover:bg-white hover:text-slate-950 hover:border text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
                    >
                      <MessageSquare size={16} />
                      Ask AI
                    </button>
                  )}

                  {activeTab === "chat" && (
                    <button
                      onClick={handleNewChat}
                      className="bg-slate-950 hover:bg-white hover:text-slate-950 hover:border text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm"
                    >
                      <MessageSquare size={16} />
                      Ask AI
                    </button>
                  )}
                </div>
              </div>

              {/* Content Container */}
              <div className="flex flex-col lg:flex-row h-[calc(100vh-9rem)]">
                {activeTab === "chat" ? (
                  <>
                    {/* Chat Sessions List */}
                    <div className="w-full lg:w-1/3 border-r border-gray-200">
                      <div className="h-full overflow-y-auto">
                        {chatSessions.map((session) => (
                          <div
                            key={session.id}
                            onClick={() => setSelectedChatSession(session)}
                            className={`border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50 ${
                              selectedChatSession?.id === session.id
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="flex text-sm items-center gap-2">
                                  <h3 className="font-medium">
                                    {session.title}
                                  </h3>
                                </div>
                                <p className="text-xs text-gray-500">
                                  {new Date(
                                    session.createdAt
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <ChevronRight
                                size={16}
                                className="text-gray-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chat Interface */}
                    <div className="flex-1 flex flex-col">
                      {selectedChatSession && (
                        <>
                          <div className="border-b border-gray-200 p-4 flex justify-between items-center">
                            <h2 className="text-lg font-medium">
                              {selectedChatSession.title}
                            </h2>
                            {selectedChatSession.isActive && (
                              <button
                                onClick={handleEndChat}
                                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                              >
                                End Chat
                              </button>
                            )}
                          </div>
                          <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                              {selectedChatSession.messages.map((message) => (
                                <div
                                  key={message.id}
                                  className={`flex ${
                                    message.role === "user"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%]  p-3 rounded-2xl ${
                                      message.role === "user"
                                        ? "bg-slate-950 rounded-tr-none text-white"
                                        : "bg-white rounded-tl-none"
                                    }`}
                                  >
                                    <div className="flex flex-col space-y-2">
                                      {message.content
                                        .split("###")
                                        .map((section, index) => {
                                          if (!section.trim()) return null;

                                          const [title, ...content] =
                                            section.split("\n");

                                          return (
                                            <div
                                              key={index}
                                              className="rounded-lg  p-2 shadow-sm"
                                            >
                                              {/* Section Title */}
                                              {title && (
                                                <h3
                                                  className={`text-md  ${
                                                    message.role === "user"
                                                      ? "text-slate-200"
                                                      : "text-slate-950"
                                                  } `}
                                                >
                                                  {title.trim()}
                                                </h3>
                                              )}

                                              {/* Section Content */}
                                              <div className="space-y-2">
                                                {content.map(
                                                  (line, lineIndex) => {
                                                    // Handle bold text as subheadings
                                                    if (line.includes("**")) {
                                                      const subheading = line
                                                        .replace(/\*\*/g, "")
                                                        .trim();
                                                      return (
                                                        <h4
                                                          key={lineIndex}
                                                          className="text-sm font-medium text-gray-700 mt-2 mb-1"
                                                        >
                                                          {subheading}
                                                        </h4>
                                                      );
                                                    }

                                                    // Handle bullet points
                                                    if (
                                                      line
                                                        .trim()
                                                        .startsWith("-")
                                                    ) {
                                                      return (
                                                        <div
                                                          key={lineIndex}
                                                          className="flex items-start space-x-2 ml-2"
                                                        >
                                                          <span className="text-blue-500 mt-1">
                                                            •
                                                          </span>
                                                          <p className="text-sm text-gray-600">
                                                            {line
                                                              .replace("-", "")
                                                              .trim()}
                                                          </p>
                                                        </div>
                                                      );
                                                    }

                                                    // Handle key-value pairs (like test results)
                                                    if (line.includes(":")) {
                                                      const [key, value] =
                                                        line.split(":");
                                                      return (
                                                        <div
                                                          key={lineIndex}
                                                          className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2"
                                                        >
                                                          <span className="font-medium text-md text-gray-700">
                                                            {key.trim()}:
                                                          </span>
                                                          <span className="text-md text-gray-600">
                                                            {value.trim()}
                                                          </span>
                                                        </div>
                                                      );
                                                    }

                                                    // Regular text
                                                    if (line.trim()) {
                                                      return (
                                                        <p
                                                          key={lineIndex}
                                                          className="text-md text-gray-600"
                                                        >
                                                          {line.trim()}
                                                        </p>
                                                      );
                                                    }

                                                    return null;
                                                  }
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                    <p className="text-xs mt-1 opacity-70 text-slate-400">
                                      {new Date(
                                        message.timestamp
                                      ).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {selectedChatSession.isActive && (
                            <div className="flex items-center space-x-2 p-4 border-t border-slate-400">
                              <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder={
                                  isGenerating
                                    ? "Generating response..."
                                    : "Type your message..."
                                }
                                disabled={isGenerating}
                                className={`flex-1 p-2 rounded-lg border ${
                                  isGenerating
                                    ? "bg-gray-100 text-gray-500"
                                    : "bg-white text-gray-900"
                                }`}
                                onKeyPress={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(newMessage);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleSendMessage(newMessage)}
                                disabled={isGenerating || !newMessage.trim()}
                                className={`px-4 py-2 rounded-lg border transition-all duration-300 ease-in-out
    ${
      isGenerating || !newMessage.trim()
        ? "bg-slate-950 text-white border-gray-300 cursor-not-allowed"
        : "bg-slate-950 text-white border-slate-950 hover:bg-white hover:text-slate-950 hover:border-slate-950 hover:shadow-md"
    }`}
                              >
                                {isGenerating ? (
                                  <span className="flex items-center space-x-2">
                                    <svg
                                      className="animate-spin h-5 w-5"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                      />
                                    </svg>
                                    <span>Generating...</span>
                                  </span>
                                ) : (
                                  "Send"
                                )}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : activeTab === "consultations" ? (
                  <>
                    {/* Consultations List */}
                    <div className="w-full lg:w-1/3 border-r border-gray-200">
                      <div className="h-full overflow-y-auto">
                        {consultations.map((consultation) => (
                          <div
                            key={consultation.session_id}
                            onClick={() => setSelectedSession(consultation)}
                            className={`border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50 ${
                              selectedSession?.session_id ===
                              consultation.session_id
                                ? "bg-blue-50"
                                : ""
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h3 className="font-medium text-sm">
                                  {consultation.title}
                                </h3>
                                <p className="text-xs text-slate-400">
                                  {new Date(
                                    consultation.date
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <ChevronRight
                                size={16}
                                className="text-gray-400"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Consultation Chat Preview */}
                    <div className="flex-1">
                      {selectedSession ? (
                        <div className="h-full flex flex-col">
                          <div className="border-b border-gray-200 p-4">
                            <h2 className="text-lg font-medium">
                              {selectedSession.title}
                            </h2>
                            <p className="text-sm text-gray-500">
                              Date:{" "}
                              {new Date(
                                selectedSession.date
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4">
                            <div className="space-y-4">
                              {selectedSession.messages.map((message) => (
                                <div
                                  key={message._id}
                                  className={`flex ${
                                    message.sender === "Patient"
                                      ? "justify-end"
                                      : "justify-start"
                                  }`}
                                >
                                  <div
                                    className={`max-w-[70%] rounded-lg p-3 ${
                                      message.sender === "Patient"
                                        ? "bg-slate-950 rounded-tr-none text-white"
                                        : "bg-slate-200 rounded-tl-none"
                                    }`}
                                  >
                                    <p className="text-xs font-medium mb-1">
                                      {message.sender}
                                    </p>
                                    <p className="text-sm">{message.message}</p>
                                    <p className="text-xs mt-1 opacity-70 text-slate-400">
                                      {new Date(
                                        message.timestamp
                                      ).toLocaleTimeString()}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          Select a consultation to view conversation
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Reports List */}
                    <div className="w-full lg:w-1/3 border-r border-gray-200 overflow-auto">
                      {reports.map((report) => (
                        <div
                          key={report.report_id}
                          onClick={() => setSelectedReport(report)}
                          className={`border-b border-gray-200 p-4 cursor-pointer hover:bg-gray-50 ${
                            selectedReport?.report_id === report.report_id
                              ? "bg-blue-50"
                              : ""
                          }`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0">
                              {report.fileType === "image" ? (
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                                  <Image
                                    src={report.filePath}
                                    alt=""
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-red-50 flex items-center justify-center">
                                  <FileText
                                    className="text-red-500"
                                    size={24}
                                  />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {report.title}
                              </h4>
                              <p className="text-xs text-gray-500">
                                {report.category}
                              </p>
                              <p className="text-xs text-gray-400">
                                {report.date}
                              </p>
                            </div>

                            <ChevronRight
                              size={16}
                              className="text-gray-400 flex-shrink-0"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Report Preview */}
                    {selectedReport && (
                      <div className="flex-1 flex flex-col h-full overflow-hidden">
                        <div className="font-medium p-4 flex items-center justify-between border-b border-gray-200">
                          <div className="flex items-center">
                            <FileText
                              size={18}
                              className="text-slate-950 mr-2"
                            />
                            {selectedReport.title}
                          </div>
                          <button
                            onClick={() =>
                              handleDeleteReport(selectedReport.report_id)
                            }
                            className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete report"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                        <div className="flex-1 overflow-auto bg-gray-50">
                          {renderReport(selectedReport)}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <UploadReportModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  );
}
