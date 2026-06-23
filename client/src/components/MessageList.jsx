import MessageBubble from "./MessageBubble";

function MessageList({ messages }) {
    return (
        <div className="message-list">
            {messages.map((message, index) => (
                <MessageBubble
                key={ index }
                role={ message.role }
                content={ message.content }
                stopped={ message.stopped }
                />
            ))}
        </div>
    );
}

export default MessageList;