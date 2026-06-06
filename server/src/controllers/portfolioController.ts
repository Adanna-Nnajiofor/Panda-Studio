import type { Request, Response } from 'express';
import Portfolio from '../models/Portfolio';
import User from '../models/User';
import type { AuthenticatedRequest } from '../types/auth';

const getUser = (req: Request) => (req as AuthenticatedRequest).user;

export const getAllPortfolios = async (_req: Request, res: Response): Promise<void> => {
  try {
    const portfolios = await Portfolio.find({ isPublic: true })
      .populate('user', 'fullName avatar position department availability')
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: portfolios.length, portfolios });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch portfolios' });
  }
};

export const getPortfolioByUserId = async (req: Request, res: Response): Promise<void> => {
  try {
    const portfolio = await Portfolio.findOne({ user: req.params.userId })
      .populate('user', 'fullName avatar position department bio availability');
    if (!portfolio) {
      res.status(404).json({ success: false, message: 'Portfolio not found' });
      return;
    }
    res.json({ success: true, portfolio });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch portfolio' });
  }
};

export const getMyPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    let portfolio = await Portfolio.findOne({ user: user?.id });
    if (!portfolio) {
      // Auto-create empty portfolio for crew
      portfolio = await Portfolio.create({ user: user?.id, items: [], specialties: [] });
    }
    res.json({ success: true, portfolio });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch your portfolio' });
  }
};

export const updateMyPortfolio = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const { bio, showreelUrl, isPublic, specialties, experienceYears, hourlyRate, location, website, socialLinks } = req.body as Record<string, unknown>;

    const portfolio = await Portfolio.findOneAndUpdate(
      { user: user?.id },
      { bio, showreelUrl, isPublic, specialties, experienceYears, hourlyRate, location, website, socialLinks },
      { new: true, upsert: true, runValidators: true },
    );
    res.json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update portfolio' });
  }
};

export const addPortfolioItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: user?.id },
      { $push: { items: req.body } },
      { new: true, upsert: true },
    );
    res.status(201).json({ success: true, portfolio });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to add portfolio item' });
  }
};

export const removePortfolioItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const portfolio = await Portfolio.findOneAndUpdate(
      { user: user?.id },
      { $pull: { items: { _id: req.params.itemId } } },
      { new: true },
    );
    if (!portfolio) {
      res.status(404).json({ success: false, message: 'Portfolio not found' });
      return;
    }
    res.json({ success: true, portfolio });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to remove item' });
  }
};

export const incrementPortfolioItemView = async (req: Request, res: Response): Promise<void> => {
  try {
    await Portfolio.updateOne(
      { 'items._id': req.params.itemId },
      { $inc: { 'items.$.views': 1 } },
    );
    res.json({ success: true });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to track view' });
  }
};

export const getCrewDirectory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { specialty, availability, minRate, maxRate } = req.query as Record<string, string>;
    const filter: Record<string, unknown> = { role: 'crew', isActive: true, isApproved: true };
    if (availability) filter.availability = availability;

    const crewUsers = await User.find(filter).select('-password').lean();

    // Enrich with portfolios
    const userIds = crewUsers.map((u) => u._id);
    const portfolios = await Portfolio.find({ user: { $in: userIds }, isPublic: true }).lean();
    const portfolioMap = new Map(portfolios.map((p) => [String(p.user), p]));

    let enriched = crewUsers.map((u) => ({
      ...u,
      portfolio: portfolioMap.get(String(u._id)) ?? null,
    }));

    if (specialty) {
      enriched = enriched.filter((u) =>
        u.portfolio?.specialties?.some((s: string) => s.toLowerCase().includes(specialty.toLowerCase())),
      );
    }
    if (minRate) {
      enriched = enriched.filter((u) => (u.portfolio?.hourlyRate ?? 0) >= Number(minRate));
    }
    if (maxRate) {
      enriched = enriched.filter((u) => (u.portfolio?.hourlyRate ?? Infinity) <= Number(maxRate));
    }

    res.json({ success: true, count: enriched.length, crew: enriched });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch crew directory' });
  }
};
