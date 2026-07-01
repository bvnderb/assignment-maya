function MessageBubble({ role, content, stopped, failed, onRetry }) {
    return (
        <div className={role === "user" ? "bubble-user" : "bubble-assistant"}>
            {role === "user" ? <small className="bubble-label">You</small> : <small className="bubble-label">Assistant</small>}
            <p>{ content }</p>
            { stopped && <span>Stopped</span> }
            { failed && <button onClick={onRetry}>Retry</button> }
        </div>
    );
}

export default MessageBubble;