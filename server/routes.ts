import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertSessionSchema, type SyncMessage } from "@shared/schema";
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
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    const viewerId = url.searchParams.get('viewerId');

    if (!sessionId || !viewerId) {
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
            videoUrl: session.videoUrl || ''
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
            currentTime: 0,
            isPlaying: false
          });
        }

        if (message.type === 'source-add' && message.data?.videoSource) {
          try {
            const sources = await storage.addVideoSource(sessionId, message.data.videoSource);
            broadcastToSession(sessionId, {
              type: 'source-add',
              sessionId,
              data: { videoSources: sources }
            });
          } catch (error) {
            console.error('Error adding video source:', error);
          }
        }

        if (message.type === 'source-remove' && message.data?.selectedSourceId) {
          try {
            const sources = await storage.removeVideoSource(sessionId, message.data.selectedSourceId);
            broadcastToSession(sessionId, {
              type: 'source-remove',
              sessionId,
              data: { videoSources: sources }
            });
          } catch (error) {
            console.error('Error removing video source:', error);
          }
        }

        // Broadcast to other viewers
        broadcastToSession(sessionId, message, viewerId);
        
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

  // Get video sources for session
  app.get('/api/sessions/:id/sources', async (req, res) => {
    try {
      const sources = await storage.getVideoSources(req.params.id);
      console.log(`Getting sources for session ${req.params.id}:`, sources);
      res.json(sources);
    } catch (error) {
      console.error('Error getting video sources:', error);
      res.status(500).json({ message: 'Server error' });
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

  // Add video source to session
  app.post('/api/sessions/:id/sources', async (req, res) => {
    try {
      const { url, title, addedBy } = req.body;
      const source = {
        id: nanoid(),
        url,
        title: title || 'Untitled Video',
        addedBy
      };
      
      const sources = await storage.addVideoSource(req.params.id, source);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Remove video source from session
  app.delete('/api/sessions/:id/sources/:sourceId', async (req, res) => {
    try {
      const sources = await storage.removeVideoSource(req.params.id, req.params.sourceId);
      res.json(sources);
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  return httpServer;
}
