import { sessions, viewers, users, type Session, type Viewer, type User, type InsertSession, type InsertViewer, type InsertUser } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Session methods
  getSession(id: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined>;
  deleteSession(id: string): Promise<boolean>;
  
  // Viewer methods
  addViewer(viewer: InsertViewer): Promise<Viewer>;
  removeViewer(sessionId: string, viewerId: string): Promise<boolean>;
  getSessionViewers(sessionId: string): Promise<Viewer[]>;
  updateViewerLastSeen(sessionId: string, viewerId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<string, Session>;
  private viewers: Map<string, Viewer>;
  private currentUserId: number;
  private currentViewerId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.viewers = new Map();
    this.currentUserId = 1;
    this.currentViewerId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Session methods
  async getSession(id: string): Promise<Session | undefined> {
    return this.sessions.get(id);
  }

  async createSession(insertSession: InsertSession): Promise<Session> {
    const session: Session = {
      id: insertSession.id,
      videoSources: insertSession.videoSources || [],
      isPlaying: insertSession.isPlaying || null,
      currentTime: insertSession.currentTime || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.sessions.set(insertSession.id, session);
    return session;
  }

  async updateSession(id: string, updates: Partial<Session>): Promise<Session | undefined> {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  async deleteSession(id: string): Promise<boolean> {
    return this.sessions.delete(id);
  }

  // Viewer methods
  async addViewer(insertViewer: InsertViewer): Promise<Viewer> {
    const id = this.currentViewerId++;
    const viewer: Viewer = {
      id,
      ...insertViewer,
      lastSeen: new Date(),
    };
    const key = `${insertViewer.sessionId}-${insertViewer.viewerId}`;
    this.viewers.set(key, viewer);
    return viewer;
  }

  async removeViewer(sessionId: string, viewerId: string): Promise<boolean> {
    const key = `${sessionId}-${viewerId}`;
    return this.viewers.delete(key);
  }

  async getSessionViewers(sessionId: string): Promise<Viewer[]> {
    return Array.from(this.viewers.values()).filter(
      (viewer) => viewer.sessionId === sessionId
    );
  }

  async updateViewerLastSeen(sessionId: string, viewerId: string): Promise<void> {
    const key = `${sessionId}-${viewerId}`;
    const viewer = this.viewers.get(key);
    if (viewer) {
      viewer.lastSeen = new Date();
      this.viewers.set(key, viewer);
    }
  }
}

export const storage = new MemStorage();
