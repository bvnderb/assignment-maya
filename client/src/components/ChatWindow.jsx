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
        onStop={null}
        onResume={null}
      />
    </div>
  );
}

export default ChatWindow;
