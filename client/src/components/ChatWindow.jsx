import { useState, useRef } from "react";
import MessageList from "./MessageList";
import InputBar from "./InputBar";

function ChatWindow() {
  const [messages, setMessages] = useState([]);
  const [streamId, setStreamId] = useState(null);
  const [streamStatus, setStreamStatus] = useState("idle");
  const [inputValue, setInputValue] = useState("");
  const sourceRef = useRef(null);

  function handleChange(e) {
    setInputValue(e.target.value);
  }

  function handleSend() {
    const newMessages = [
      ...messages,
      { role: "user", content: inputValue, stopped: false },
      { role: "assistant", content: "", stopped: false },
    ];
    setMessages(newMessages);
    setStreamStatus("streaming");
    setInputValue("");

    sourceRef.current = new EventSource("http://localhost:3000/chat/stream");
    sourceRef.current.addEventListener("token", (e) => {
      const parsed = JSON.parse(e.data);
      const word = parsed.word;

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content += word + " ";
        return updated;
      });
    });

    sourceRef.current.addEventListener("message", (e) => {
      const parsed = JSON.parse(e.data);
      setStreamId(parsed.streamId);
    });

    sourceRef.current.addEventListener("done", () => {
      setStreamStatus("idle");
      console.log("stream done");
      sourceRef.current.close();
    });
  }

  function handleStop() {
    sourceRef.current.close();
    setStreamStatus("stopped");
    setMessages((prev) => {
      const updated = [...prev];
      updated[prev.length - 1].stopped = true;
      return updated;
    });
    fetch("http://localhost:3000/chat/stop", {
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

  sourceRef.current = new EventSource(`http://localhost:3000/chat/resume/${streamId}`);

  sourceRef.current.addEventListener("token", (e) => {
    const parsed = JSON.parse(e.data);
    const word = parsed.word;
    
    setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].content += word + " ";
        return updated;
      });
  });

  sourceRef.current.addEventListener("done", () => {
    setStreamStatus("idle");
      console.log("stream done");
      sourceRef.current.close();
  });
}

  return (
    <div className="chat-window">
      <MessageList messages={messages} />
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
