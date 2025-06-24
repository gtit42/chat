import { useState, useEffect, useRef } from "react";
import { useWebSocket } from "./useWebSocket";

export function useWebRTC() {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const { sendMessage, lastMessage } = useWebSocket();

  // Initialize peer connection
  useEffect(() => {
    const initializePeerConnection = () => {
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      pc.onicecandidate = (event) => {
        if (event.candidate && sendMessage) {
          sendMessage({
            type: 'webrtc_candidate',
            candidate: event.candidate,
          });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        setIsConnected(true);
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          setIsConnected(false);
          setRemoteStream(null);
        }
      };

      return pc;
    };

    peerConnection.current = initializePeerConnection();

    return () => {
      if (peerConnection.current) {
        peerConnection.current.close();
      }
    };
  }, [sendMessage]);

  // Get user media
  useEffect(() => {
    const getUserMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        // Add tracks to peer connection
        if (peerConnection.current) {
          stream.getTracks().forEach((track) => {
            peerConnection.current?.addTrack(track, stream);
          });
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    getUserMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (!lastMessage || !peerConnection.current) return;

    const handleMessage = async (message: any) => {
      switch (message.type) {
        case 'match_found':
          // Create offer for the matched user
          try {
            const offer = await peerConnection.current!.createOffer();
            await peerConnection.current!.setLocalDescription(offer);
            
            if (sendMessage) {
              sendMessage({
                type: 'webrtc_offer',
                offer,
                targetUserId: message.partnerId,
              });
            }
          } catch (error) {
            console.error('Error creating offer:', error);
          }
          break;

        case 'webrtc_offer':
          try {
            await peerConnection.current?.setRemoteDescription(message.offer);
            const answer = await peerConnection.current?.createAnswer();
            await peerConnection.current?.setLocalDescription(answer);
            
            if (sendMessage) {
              sendMessage({
                type: 'webrtc_answer',
                answer,
                targetUserId: message.fromUserId,
              });
            }
          } catch (error) {
            console.error('Error handling offer:', error);
          }
          break;

        case 'webrtc_answer':
          try {
            await peerConnection.current?.setRemoteDescription(message.answer);
          } catch (error) {
            console.error('Error handling answer:', error);
          }
          break;

        case 'webrtc_candidate':
          try {
            await peerConnection.current?.addIceCandidate(message.candidate);
          } catch (error) {
            console.error('Error adding ice candidate:', error);
          }
          break;
      }
    };

    handleMessage(lastMessage);
  }, [lastMessage, sendMessage]);

  const startCall = () => {
    // Call is started automatically when a match is found
  };

  const endCall = () => {
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });
      
      // Re-add local stream tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, localStream);
        });
      }
    }
    
    setIsConnected(false);
    setRemoteStream(null);
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  return {
    localStream,
    remoteStream,
    isConnected,
    isMuted,
    isCameraOff,
    startCall,
    endCall,
    toggleMute,
    toggleCamera,
  };
}
