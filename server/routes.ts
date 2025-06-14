import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSessionSchema, type SyncMessage, type VideoSource } from "@shared/schema";
import { z } from "zod";
import { nanoid } from "nanoid";

interface ClientConnection {
  ws: WebSocket;
  sessionId: string;
  viewerId: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time synchronization
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const connections = new Map<string, ClientConnection>();

  // Broadcast message to all clients in a session
  function broadcastToSession(sessionId: string, message: SyncMessage, excludeViewerId?: string) {
    connections.forEach((conn) => {
      if (conn.sessionId === sessionId && 
          conn.viewerId !== excludeViewerId && 
          conn.ws.readyState === WebSocket.OPEN) {
        conn.ws.send(JSON.stringify(message));
      }
    });
  }

  wss.on('connection', (ws, req) => {
    console.log('WebSocket connection attempt:', req.url);
    
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const viewerId = url.searchParams.get('viewerId');

    console.log('WebSocket params:', { sessionId, viewerId });

    if (!sessionId || !viewerId) {
      console.log('WebSocket connection rejected: missing sessionId or viewerId');
      ws.close(1008, 'Missing sessionId or viewerId');
      return;
    }

    const connectionId = nanoid();
    connections.set(connectionId, { ws, sessionId, viewerId });

    // Add viewer to session
    storage.addViewer({ sessionId, viewerId }).catch(console.error);

    // Notify others about new viewer
    broadcastToSession(sessionId, {
      type: 'viewer-join',
      sessionId,
      data: { viewerId }
    }, viewerId);

    // Send current session state to new viewer
    storage.getSession(sessionId).then(session => {
      if (session && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'sync',
          sessionId,
          data: {
            currentTime: session.currentTime || 0,
            isPlaying: session.isPlaying || false,
            videoUrl: session.videoUrl || '',
            videoSources: session.videoSources || [],
            selectedSourceId: session.selectedSourceId
          }
        }));
      }
    });

    ws.on('message', async (data) => {
      try {
        const message: SyncMessage = JSON.parse(data.toString());
        
        // Update session state
        if (message.type === 'sync' || message.type === 'play' || message.type === 'pause' || message.type === 'seek') {
          await storage.updateSession(sessionId, {
            currentTime: message.data?.currentTime,
            isPlaying: message.data?.isPlaying
          });
        }

        if (message.type === 'video-change' && message.data?.videoUrl) {
          await storage.updateSession(sessionId, {
            videoUrl: message.data.videoUrl,
            videoSources: message.data.videoSources || [],
            selectedSourceId: message.data.selectedSourceId,
            currentTime: 0,
            isPlaying: false
          });
        }

        // Remove source-change handling - each viewer selects their own source independently

        // Broadcast to other viewers (except source-change which is local only)
        if (message.type !== 'source-change') {
          broadcastToSession(sessionId, message, viewerId);
        }
        
        // Update viewer last seen
        await storage.updateViewerLastSeen(sessionId, viewerId);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      connections.delete(connectionId);
      await storage.removeViewer(sessionId, viewerId);
      
      // Notify others about viewer leaving
      broadcastToSession(sessionId, {
        type: 'viewer-leave',
        sessionId,
        data: { viewerId }
      });
    });
  });

  // REST API routes
  
  // Create or join session
  app.post('/api/sessions', async (req, res) => {
    try {
      const sessionId = req.body.sessionId || nanoid();
      
      let session = await storage.getSession(sessionId);
      if (!session) {
        const sessionData = insertSessionSchema.parse({
          id: sessionId,
          videoUrl: req.body.videoUrl || null,
          isPlaying: false,
          currentTime: 0
        });
        session = await storage.createSession(sessionData);
      }
      
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Invalid request' });
    }
  });

  // Get session info
  app.get('/api/sessions/:id', async (req, res) => {
    try {
      const session = await storage.getSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      
      // Count active WebSocket connections for this session
      const activeConnections = Array.from(connections.values())
        .filter(conn => conn.sessionId === req.params.id && conn.ws.readyState === WebSocket.OPEN);
      
      res.json({ ...session, viewerCount: activeConnections.length });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update session
  app.patch('/api/sessions/:id', async (req, res) => {
    try {
      const updates = req.body;
      const session = await storage.updateSession(req.params.id, updates);
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get session viewers
  app.get('/api/sessions/:id/viewers', async (req, res) => {
    try {
      // Count active WebSocket connections for this session
      const activeConnections = Array.from(connections.values())
        .filter(conn => conn.sessionId === req.params.id && conn.ws.readyState === WebSocket.OPEN);
      
      res.json(activeConnections.map(conn => ({ viewerId: conn.viewerId })));
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}
