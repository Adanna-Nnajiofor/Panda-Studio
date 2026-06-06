import type { Request, Response } from 'express';
import Quote from '../models/Quote';
import type { AuthenticatedRequest } from '../types/auth';
import { isPrivilegedRole } from '../utils/user';

const getUser = (req: Request) => (req as AuthenticatedRequest).user;

export const getMyQuotes = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const filter = isPrivilegedRole(user?.role) ? {} : { client: user?.id };
    const quotes = await Quote.find(filter)
      .populate('client', 'fullName email')
      .populate('createdBy', 'fullName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: quotes.length, quotes });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch quotes' });
  }
};

export const getQuoteById = async (req: Request, res: Response): Promise<void> => {
  try {
    const quote = await Quote.findById(req.params.id)
      .populate('client', 'fullName email phone')
      .populate('createdBy', 'fullName');
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }
    res.json({ success: true, quote });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch quote' });
  }
};

export const createQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = getUser(req);
    const { client, items, discount, tax, notes, validUntil, booking } = req.body as {
      client: string;
      items: { description: string; unitPrice: number; quantity: number }[];
      discount?: number;
      tax?: number;
      notes?: string;
      validUntil: string;
      booking?: string;
    };

    if (!client || !items?.length || !validUntil) {
      res.status(400).json({ success: false, message: 'client, items and validUntil are required' });
      return;
    }

    const computedItems = items.map((i) => ({
      ...i,
      subtotal: i.unitPrice * i.quantity,
    }));
    const subtotal = computedItems.reduce((s, i) => s + i.subtotal, 0);
    const discountAmt = discount ?? 0;
    const taxAmt = tax ?? 0;
    const total = subtotal - discountAmt + taxAmt;

    const quote = await Quote.create({
      client,
      createdBy: user?.id,
      items: computedItems,
      subtotal,
      discount: discountAmt,
      tax: taxAmt,
      total,
      notes,
      validUntil,
      booking,
    });

    res.status(201).json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to create quote' });
  }
};

export const updateQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }
    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update quote' });
  }
};

export const updateQuoteStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.body as { status: string };
    const quote = await Quote.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }
    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to update quote status' });
  }
};

export const deleteQuote = async (req: Request, res: Response): Promise<void> => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);
    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }
    res.json({ success: true, message: 'Quote deleted' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to delete quote' });
  }
};
