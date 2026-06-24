function MessageBubble({ role, content, stopped }) {
    return (
        <div className={role === "user" ? "bubble-user" : "bubble-assistant"}>
            <p>{ content }</p>
            { stopped && <span>Stopped</span> }
        </div>
    );
}

export default MessageBubble;