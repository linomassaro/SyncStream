export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Simple in-memory storage (resets on each function call in Vercel)
  const sessions = new Map();
  
  const { method, url } = req;
  const path = url.split('?')[0];
  
  if (method === 'POST' && path === '/api/sessions') {
    const sessionId = req.body.sessionId || Math.random().toString(36).substring(7);
    const session = {
      id: sessionId,
      videoUrl: req.body.videoUrl || null,
      videoSources: [],
      selectedSourceId: null,
      isPlaying: false,
      currentTime: 0,
      viewerCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return res.json(session);
  }
  
  if (method === 'GET' && path.startsWith('/api/sessions/')) {
    const sessionId = path.split('/')[3];
    const session = {
      id: sessionId,
      videoUrl: null,
      videoSources: [],
      selectedSourceId: null,
      isPlaying: false,
      currentTime: 0,
      viewerCount: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return res.json(session);
  }
  
  if (method === 'PATCH' && path.startsWith('/api/sessions/')) {
    const sessionId = path.split('/')[3];
    const session = {
      id: sessionId,
      ...req.body,
      updatedAt: new Date()
    };
    
    return res.json(session);
  }
  
  if (method === 'GET' && path.endsWith('/viewers')) {
    return res.json([]);
  }
  
  return res.status(404).json({ message: 'Not found' });
}