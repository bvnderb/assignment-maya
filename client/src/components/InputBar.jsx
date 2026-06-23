function InputBar ({ inputValue, streamStatus, onChange, onSend, onStop, onResume }) {
    let button;
    if (streamStatus === 'idle') {
        button = <button onClick={onSend}>Send</button>
    } else if (streamStatus === 'streaming') {
        button = <button onClick={onStop}>Stop</button>
    } else {
        button = <button onClick={onResume}>Resume</button>
    } return (
    <div>
         <textarea value={inputValue} onChange={onChange}></textarea>
         {button}
    </div>
    );
}

export default InputBar;