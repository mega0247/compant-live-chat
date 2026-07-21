import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";
import ChatBox from "../components/ChatBox";
import ParticipantList from "../components/ParticipantList";

export default function LiveRoom() {
  const { id } = useParams<{ id: string }>();

  const socket = useSocket();

  const userId = useMemo(() => localStorage.getItem("userId") || "guest", []);
  const roomId = id || "default-room";

  const [users, setUsers] = useState<any[]>([]);

  const { localVideoRef, remoteVideoRef, call, ready } = useWebRTC(socket, roomId);

  useEffect(() => {
    socket.emit("join-room", { roomId, userId });

    const handler = (payload: any) => setUsers(payload);
    socket.on("room-users", handler);

    return () => {
      socket.off("room-users", handler);
    };
  }, [socket, roomId, userId]);

  return (
    <div className="room-grid">
      <div>
        <h2>Live Room</h2>
        <button onClick={call} disabled={!ready}>
          Start Call
        </button>

        <div className="video-row">
          <video ref={localVideoRef} autoPlay muted playsInline className="video" />
          <video ref={remoteVideoRef} autoPlay playsInline className="video" />
        </div>

        <ParticipantList users={users} />
      </div>

      <ChatBox socket={socket} roomId={roomId} userId={userId} />
    </div>
  );
}
