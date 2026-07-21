import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import { useWebRTC } from "../hooks/useWebRTC";

export default function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();

  const socket = useSocket();

  const safeRoomId = useMemo(() => roomId ?? "", [roomId]);

  const { localVideoRef, remoteVideoRef, call, ready } = useWebRTC(socket, safeRoomId);

  const [joined, setJoined] = useState(false);

  useEffect(() => {
    // If roomId is missing, don't join
    if (!safeRoomId) return;

    socket.emit("join-room", { roomId: safeRoomId });
    setJoined(true);

    return () => {
      // React cleanup must return void
      socket.off("signal");
      socket.disconnect();
    };
  }, [socket, safeRoomId]);

  return (
    <div style={{ padding: 16 }}>
      <h2>Live Room: {safeRoomId || "-"}</h2>

      <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
        <div>
          <div>Local</div>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: 320, background: "#000" }} />
        </div>

        <div>
          <div>Remote</div>
          <video ref={remoteVideoRef} autoPlay playsInline style={{ width: 320, background: "#000" }} />
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <button
          onClick={call}
          disabled={!ready || !joined}
          style={{ padding: "10px 16px" }}
        >
          {ready ? "Start Call" : "Preparing media..."}
        </button>
      </div>
    </div>
  );
}
