import type { Response } from 'express';
import Service from '../models/Service';
import { AuthRequest } from '../types/auth';
import { cacheAside, cacheDel } from '../utils/cache';
import logger from '../utils/logger';

const CACHE_KEY_ALL = 'services:all';
const CACHE_TTL = 60 * 10; // 10 minutes

export const createService = async (req: AuthRequest, res: Response) => {
  try {
    const service = await Service.create(req.body);
    await cacheDel(CACHE_KEY_ALL);
    res.status(201).json(service);
  } catch (error) {
    logger.error('createService error', { error });
    res.status(500).json({ message: 'Server error' });
  }
};

export const getServices = async (_req: AuthRequest, res: Response) => {
  try {
    const services = await cacheAside(
      CACHE_KEY_ALL,
      () => Service.find().lean(),
      CACHE_TTL,
    );
    res.json(services);
  } catch (error) {
    logger.error('getServices error', { error });
    res.status(500).json({ message: 'Server error' });
  }
};
