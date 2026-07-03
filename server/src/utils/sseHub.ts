/**
 * Simple in-process SSE hub for real-time message delivery.
 * Each connected user gets a persistent SSE stream.
 * When a message is sent, the receiver's stream is pushed immediately.
 */

import type { Response } from "express";

type SSEClient = {
  userId: string;
  res: Response;
};

const clients: SSEClient[] = [];

export const addClient = (userId: string, res: Response): void => {
  clients.push({ userId, res });
};

export const removeClient = (res: Response): void => {
  const idx = clients.findIndex((c) => c.res === res);
  if (idx !== -1) clients.splice(idx, 1);
};

export const pushToUser = (userId: string, event: string, data: unknown): void => {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    if (client.userId === userId) {
      try {
        client.res.write(payload);
      } catch {
        // client disconnected
      }
    }
  }
};
