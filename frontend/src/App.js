import './App.css';
import 'react-chatbox-component/dist/style.css';
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ChatBox } from 'react-chatbox-component';
import { useState } from 'react';

function App() {
  const [waiting, setWaiting] = useState(false);
  const [messages, setMessages] = useState([{
    "text": "Hello there",
    "sender": {
      "name": "Dingus",
      "uid": "user0",
      "avatar": "dingus.png",
    }
  }]);

  return (
    <div className="App">
      <header className="App-header">
        <ChatBox id="chat"
          messages={messages}
          onSubmit={(message) => {
            setMessages([...messages,]);
            fetch("http://127.0.0.1:80/api/message", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                "message": message,
              })
            }).then(r => r.json()).then(r => {
              setWaiting(false);
              setMessages([...messages, {
                "text": message,
                "sender": {
                  "name": "Me",
                  "uid": "user1",
                  "avatar": "otter.png",
                }
              }, {
                "text": r.reply,
                "sender": {
                  "name": "Dingus",
                  "uid": "user0",
                  "avatar": "dingus.png",
                }
              }]);
            });
          }}
        />
        <FontAwesomeIcon className="icon" icon={faGithub} onClick={() => { window.open("https://github.com/msho-student/granddingus") }} />
      </header>
    </div>
  );
}

export default App;
