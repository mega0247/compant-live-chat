import { useEffect, useRef, useState } from "react";

export function useWebRTC(socket: any, roomId: string) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peerRef.current = pc;

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("signal", { roomId, data: { type: "ice-candidate", candidate: e.candidate } });
      }
    };

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      streamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
      setReady(true);
    });

    socket.on("signal", async (data: any) => {
      if (!peerRef.current) return;

      if (data.type === "offer") {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await peerRef.current.createAnswer();
        await peerRef.current.setLocalDescription(answer);
        socket.emit("signal", { roomId, data: { type: "answer", answer } });
      }

      if (data.type === "answer") {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
      }

      if (data.type === "ice-candidate") {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch {}
      }
    });

    return () => {
      socket.off("signal");
      pc.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [socket, roomId]);

  const call = async () => {
    if (!peerRef.current) return;
    const offer = await peerRef.current.createOffer();
    await peerRef.current.setLocalDescription(offer);
    socket.emit("signal", { roomId, data: { type: "offer", offer } });
  };

  return { localVideoRef, remoteVideoRef, call, ready };
}
