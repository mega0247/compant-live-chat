import { useEffect, useState } from "react";

type Props = {
  socket: any;
  roomId: string;
  userId: string;
};

export default function ChatBox({ socket, roomId, userId }: Props) {
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const onMsg = (msg: any) => setMessages(prev => [...prev, msg]);
    const onSys = (msg: any) => setMessages(prev => [...prev, { userId: "system", message: msg }]);

    socket.on("chat-message", onMsg);
    socket.on("system-message", onSys);

    return () => {
      socket.off("chat-message", onMsg);
      socket.off("system-message", onSys);
    };
  }, [socket]);

  const send = () => {
    if (!text.trim()) return;
    socket.emit("chat-message", { roomId, userId, message: text });
    setText("");
  };

  return (
    <div className="chatbox">
      <div className="chatlog">
        {messages.map((m, i) => (
          <div key={i}><b>{m.userId}:</b> {m.message}</div>
        ))}
      </div>
      <div className="row">
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Message" />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}
