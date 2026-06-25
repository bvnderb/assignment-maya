import MessageBubble from "./MessageBubble";
import { useRef, useEffect } from "react";

function MessageList({ messages }) {
    const messagesEndRef = useRef(null)
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    useEffect(() => {
      scrollToBottom()
    }, [messages]);

    return (
        <div className="message-list">
            {messages.map((message, index) => (  
                <MessageBubble
                key={ index }
                role={ message.role }
                content={ message.content }
                stopped={ message.stopped }
                />
            )
            )}
        <div ref={messagesEndRef} />
        </div>
    ); 
}

export default MessageList;