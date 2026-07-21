import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AnySocket = {
  emit: (event: string, payload?: any) => void;
  on: (event: string, handler: (...args: any[]) => void) => void;
  off: (event: string, handler?: (...args: any[]) => void) => void;
  disconnect?: () => void;
};

type SignalMessage =
  | {
      type: "offer" | "answer" | "ice";
      roomId: string;
      from?: string;
      to?: string;
      sdp?: any;
      candidate?: any;
    }
  | any;

export type UseWebRTCResult = {
  localVideoRef: React.RefObject<HTMLVideoElement>;
  remoteVideoRef: React.RefObject<HTMLVideoElement>;
  call: () => Promise<void>;
  ready: boolean;
};

export default function useWebRTC(
  socket: AnySocket,
  roomId: string
): UseWebRTCResult {
  const localVideoRef = useRef<HTMLVideoElement>(null as any);
  const remoteVideoRef = useRef<HTMLVideoElement>(null as any);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  const [ready, setReady] = useState(false);

  const iceServers = useMemo(
    () => [{ urls: "stun:stun.l.google.com:19302" }],
    []
  );

  const getOrCreatePC = useCallback((): RTCPeerConnection => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (!event.candidate) return;

      const payload = { roomId, candidate: event.candidate };

      socket.emit("ice-candidate", payload);
      socket.emit("signal", {
        type: "ice",
        roomId,
        candidate: event.candidate,
      });
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (!stream) return;

      // remoteVideoRef.current is typed as HTMLVideoElement (non-null),
      // but it may still not be attached yet at runtime.
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    pcRef.current = pc;
    return pc;
  }, [iceServers, roomId, socket]);

  const ensureLocalStream = useCallback(async (): Promise<MediaStream> => {
    if (localStreamRef.current) return localStreamRef.current;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const pc = getOrCreatePC();
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    return stream;
  }, [getOrCreatePC]);

  const createOffer = useCallback(async () => {
    const pc = getOrCreatePC();
    await ensureLocalStream();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call-user", { roomId, sdp: offer });
    socket.emit("signal", { type: "offer", roomId, sdp: offer });
  }, [ensureLocalStream, getOrCreatePC, roomId, socket]);

  const call = useCallback(async () => {
    setReady(false);
    try {
      await createOffer();
      setReady(true);
    } catch (e) {
      console.error("WebRTC call() failed:", e);
      setReady(false);
    }
  }, [createOffer]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await ensureLocalStream();
        if (!mounted) return;
        setReady(true);
      } catch (e) {
        console.error("Failed to get local media:", e);
        if (!mounted) return;
        setReady(false);
      }
    })();

    const onSignal = async (msg: SignalMessage) => {
      const data = msg?.roomId ? msg : msg;
      const type = data?.type;

      const sdp = data?.sdp;
      const candidate = data?.candidate;

      if (type === "offer" && sdp) {
        const pc = getOrCreatePC();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        socket.emit("answer-user", { roomId, sdp: answer });
        socket.emit("signal", { type: "answer", roomId, sdp: answer });
        if (mounted) setReady(true);
      } else if (type === "answer" && sdp) {
        const pc = getOrCreatePC();
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        if (mounted) setReady(true);
      } else if (type === "ice" && candidate) {
        const pc = getOrCreatePC();
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
    };

    const onSignalEvent = (payload: any) => onSignal(payload);

    const onOffer = async (payload: any) =>
      onSignal({ type: "offer", ...payload });
    const onAnswer = async (payload: any) =>
      onSignal({ type: "answer", ...payload });
    const onIce = async (payload: any) => onSignal({ type: "ice", ...payload });

    socket.on("signal", onSignalEvent);
    socket.on("offer", onOffer);
    socket.on("answer", onAnswer);
    socket.on("ice-candidate", onIce);

    return () => {
      mounted = false;

      try {
        socket.off("signal", onSignalEvent);
        socket.off("offer", onOffer);
        socket.off("answer", onAnswer);
        socket.off("ice-candidate", onIce);
      } catch {
        // ignore
      }

      if (pcRef.current) {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      }
      pcRef.current = null;

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      localStreamRef.current = null;

      if (localVideoRef.current) localVideoRef.current.srcObject = null as any;
      if (remoteVideoRef.current)
        remoteVideoRef.current.srcObject = null as any;
    };
  }, [ensureLocalStream, getOrCreatePC, roomId, socket]);

  return { localVideoRef, remoteVideoRef, call, ready };
}
