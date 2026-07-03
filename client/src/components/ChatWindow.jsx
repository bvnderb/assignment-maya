import { useState, useRef, useEffect } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

function ChatWindow() {
  const [messages, setMessages] = useState(loadState);
  const [streamId, setStreamId] = useState(null);
  const [streamStatus, setStreamStatus] = useState("idle");
  const [inputValue, setInputValue] = useState("");
  const sourceRef = useRef(null);
  const retryCount = useRef(0);
  const maxRetries = 3;

  useEffect(() => {
        localStorage.setItem("chatState", JSON.stringify(messages))
      }, [messages]);

    function loadState() {
    const saved = localStorage.getItem("chatState");
    return saved ? JSON.parse(saved) : []; 
  }
      
  function attachListeners(source) {
    source.addEventListener("message", (e) => {
      const parsed = JSON.parse(e.data);
      setStreamId(parsed.streamId);
    });

    source.addEventListener("done", () => {
      setStreamStatus("idle");
      console.log("stream done");
      retryCount.current = 0;
      source.close();
    });

    source.addEventListener("token", (e) => {
    const parsed = JSON.parse(e.data);
    const word = parsed.word;
    
    setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content += word + " ";
        return updated;
      });
  });

  source.onerror = handleError;
  }

  function handleChange(e) {
    setInputValue(e.target.value);
  }

  function handleSend() {
    const newMessages = [
      ...messages,
      { role: "user", content: inputValue, stopped: false, failed: false },
      { role: "assistant", content: "", stopped: false, failed: false },
    ];
    setMessages(newMessages);
    setStreamStatus("streaming");
    setInputValue("");

    if (sourceRef.current) {
      sourceRef.current.close()
  }

    sourceRef.current = new EventSource(`${import.meta.env.VITE_API_URL}/chat/stream`);
    attachListeners(sourceRef.current);
  }

  function handleStop() {
    sourceRef.current.close();
    setStreamStatus("stopped");
    setMessages((prev) => {
      const updated = [...prev];
      updated[prev.length - 1].stopped = true;
      return updated;
    });
    fetch(`${import.meta.env.VITE_API_URL}/chat/stop`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamId }),
    });
  }

function handleResume() {
  setStreamStatus("streaming");

  setMessages((prev) => {
    const updated = [...prev];
    updated[prev.length - 1].stopped = false;
    return updated;
  });

  sourceRef.current = new EventSource(`${import.meta.env.VITE_API_URL}/chat/resume/${streamId}`);
  attachListeners(sourceRef.current);
}

  function handleError() {
    if((retryCount.current < maxRetries)) {
        retryCount.current++
        sourceRef.current.close()
        handleResume();
    } else {
      sourceRef.current.close();
      setStreamStatus("failed");
      setMessages((prev) => {
      const updated = [...prev];
      updated[prev.length - 1].failed = true;
      return updated;
    })
    }
    
  }

  function handleRetry() {
    sourceRef.current.close();
    setStreamStatus("streaming");
    setMessages((prev) => {
      const updated = [...prev];
      updated[prev.length - 1].content = "";
      updated[prev.length - 1].failed = false;
      return updated;
    })
    sourceRef.current = new EventSource(`${import.meta.env.VITE_API_URL}/chat/stream`);
    attachListeners(sourceRef.current);
    retryCount.current = 0;
  }

  return (
    <div className="chat-window">
      {messages.length === 0 ? (
        <div className="welcome">
          <h1>Welcome</h1>
          <p>Ask a question to get started</p>
          </div>
        ) : 
        (<MessageList 
          messages={messages} 
          onRetry={handleRetry}
          streamStatus={streamStatus}
        />)
        }
      <InputBar
        inputValue={inputValue}
        streamStatus={streamStatus}
        onChange={handleChange}
        onSend={handleSend}
        onStop={handleStop}
        onResume={handleResume}
      />
    </div>
  );
}

export default ChatWindow;
