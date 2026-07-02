import { useEffect, useRef, useCallback, useState } from "react";

type MessageHandler = (data: any) => void;

export function useHostWebSocket(gameId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const [connected, setConnected] = useState(false);

  const on = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, []);
    }
    handlersRef.current.get(type)!.push(handler);
  }, []);

  const off = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type);
    if (handlers) {
      handlersRef.current.set(
        type,
        handlers.filter((h) => h !== handler)
      );
    }
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (!gameId) return;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsUrl = baseUrl.replace(/^http/, "ws") + `/games/ws/host/${gameId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = handlersRef.current.get(data.type) || [];
        handlers.forEach((h) => h(data));
      } catch (e) {
        console.error("WS message error:", e);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId]);

  return { connected, send, on, off };
}

export function usePlayerWebSocket(gameId: string | null, playerId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, MessageHandler[]>>(new Map());
  const [connected, setConnected] = useState(false);

  const on = useCallback((type: string, handler: MessageHandler) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, []);
    }
    handlersRef.current.get(type)!.push(handler);
  }, []);

  const off = useCallback((type: string, handler: MessageHandler) => {
    const handlers = handlersRef.current.get(type);
    if (handlers) {
      handlersRef.current.set(
        type,
        handlers.filter((h) => h !== handler)
      );
    }
  }, []);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  useEffect(() => {
    if (!gameId || !playerId) return;

    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsUrl = baseUrl.replace(/^http/, "ws") + `/games/ws/player/${gameId}/${playerId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onerror = () => setConnected(false);

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const handlers = handlersRef.current.get(data.type) || [];
        handlers.forEach((h) => h(data));
      } catch (e) {
        console.error("WS message error:", e);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [gameId, playerId]);

  return { connected, send, on, off };
}
