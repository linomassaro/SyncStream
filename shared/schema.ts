import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  videoUrl: text("video_url"),
  videoSources: jsonb("video_sources").$type<VideoSource[]>().default([]),
  isPlaying: boolean("is_playing").default(false),
  currentTime: integer("current_time").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export interface VideoSource {
  id: string;
  url: string;
  title: string;
  addedBy?: string;
}

export const viewers = pgTable("viewers", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().references(() => sessions.id),
  viewerId: text("viewer_id").notNull(),
  lastSeen: timestamp("last_seen").defaultNow(),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  id: true,
  videoUrl: true,
  isPlaying: true,
  currentTime: true,
});

export const insertViewerSchema = createInsertSchema(viewers).pick({
  sessionId: true,
  viewerId: true,
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type InsertViewer = z.infer<typeof insertViewerSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Session = typeof sessions.$inferSelect;
export type Viewer = typeof viewers.$inferSelect;
export type User = typeof users.$inferSelect;

// WebSocket message types
export interface SyncMessage {
  type: 'sync' | 'play' | 'pause' | 'seek' | 'video-change' | 'viewer-join' | 'viewer-leave' | 'source-add' | 'source-remove' | 'viewer-source-change';
  sessionId: string;
  data?: {
    currentTime?: number;
    isPlaying?: boolean;
    videoUrl?: string;
    viewerId?: string;
    videoSource?: VideoSource;
    selectedSourceId?: string;
    videoSources?: VideoSource[];
  };
}
