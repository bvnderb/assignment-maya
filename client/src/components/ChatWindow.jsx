import { useState } from 'react';
import MessageList from './MessageList';
import InputBar from './InputBar';

function ChatWindow() {
const [ messages, setMessages ] = useState([]);
const [ streamId, setStreamId ] = useState(null);
const [ streamStatus, setStreamStatus ] = useState('idle');
const [ inputValue, setInputValue ] = useState('');

function handleChange(e) {
    setInputValue(e.target.value);
}

function handleSend() {
    const newMessages = 
    [...messages, 
        { role: 'user', content: inputValue, stopped: false },
        { role: 'assistant', content: '', stopped: false }
    ];
    setMessages(newMessages);

    const source = new EventSource('http://localhost:3000/chat/stream');
    source.addEventListener('token', (e) => {
        console.log(e.data)
    
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