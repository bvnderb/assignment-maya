function InputBar ({ inputValue, streamStatus, onChange, onSend, onStop, onResume }) {
    let button;
    
    if (streamStatus === "idle") {
        button = <button className="btn btn-send" onClick={onSend}>Send</button>
    } else if (streamStatus === "streaming") {
        button = <button className="btn btn-stop" onClick={onStop}>Stop</button>
    } else if (streamStatus === "failed") {
        button = <button className="btn btn-send" onClick={onSend}>Send</button>
    } else {
        button = <button className="btn btn-resume" onClick={onResume}>Resume</button>
    } 

    function handleKeyDown(e){
    if (e.key === "Enter" || e.key === "NumpadEnter") {
        e.preventDefault();
        onSend();
    }
}
    return (
        <div className="input-bar">
            <textarea placeholder="Type here" value={inputValue} onChange={onChange} onKeyDown={handleKeyDown}></textarea>
            {button}
        </div>
    );
}

export default InputBar;