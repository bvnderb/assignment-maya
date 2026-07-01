function MessageBubble({ role, content, stopped, failed, onRetry }) {
    return (
        <div className={role === "user" ? "bubble-wrapper-user" : "bubble-wrapper-assistant"}>
            <div className={role === "user" ? "bubble-user" : "bubble-assistant"}>
                {role === "user" ? <small className="bubble-label">You</small> : <small className="bubble-label">Assistant</small>}
                <p>{ content }</p>
            </div>
            { (stopped || failed) && (
                <div className="bubble-actions">
                    { stopped && <span className="bubble-status">⏹ Stopped</span> }
                    { failed && <button className="btn-retry" onClick={onRetry}>↺ Retry</button> }
                </div>
            )}
        </div>
    );
}

export default MessageBubble;