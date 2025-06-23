import { useState, useEffect, useRef } from "react";

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const websocket = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connect = () => {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      
      websocket.current = new WebSocket(wsUrl);

      websocket.current.onopen = () => {
        setIsConnected(true);
      };

      websocket.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.current.onclose = () => {
        setIsConnected(false);
        // Attempt to reconnect after 3 seconds
        setTimeout(connect, 3000);
      };

      websocket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    };

    connect();

    return () => {
      if (websocket.current) {
        websocket.current.close();
      }
    };
  }, []);

  const sendMessage = (message: any) => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      websocket.current.send(JSON.stringify(message));
    }
  };

  return {
    isConnected,
    lastMessage,
    sendMessage,
  };
}
