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

  // Video proxy endpoint to handle CORS issues
  app.get('/api/proxy/video', async (req, res) => {
    try {
      const videoUrl = req.query.url as string;
      if (!videoUrl) {
        return res.status(400).json({ message: 'Video URL is required' });
      }

      // Validate URL to prevent abuse
      try {
        new URL(videoUrl);
      } catch {
        return res.status(400).json({ message: 'Invalid URL' });
      }

      // Set CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Range, Content-Length, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges');

      // Handle preflight requests
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      }

      // Fetch the video with proper headers
      const fetch = (await import('node-fetch')).default;
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'video/*,*/*;q=0.9',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'identity',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      };

      // Forward range headers for video seeking
      if (req.headers.range) {
        headers['Range'] = req.headers.range;
      }

      const response = await fetch(videoUrl, { headers });
      
      // Forward response headers
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().includes('content') || key.toLowerCase().includes('accept-ranges')) {
          res.setHeader(key, value);
        }
      });

      // Forward status code
      res.status(response.status);
      
      // Pipe the video data
      if (response.body) {
        response.body.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      console.error('Video proxy error:', error);
      res.status(500).json({ message: 'Failed to proxy video' });
    }
  });

  return httpServer;
}
