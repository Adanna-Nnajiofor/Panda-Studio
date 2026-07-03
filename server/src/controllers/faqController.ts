import type { Request, Response } from "express";
import Faq from "../models/Faq";

export const getPublishedFaqs = async (_req: Request, res: Response) => {
  try {
    const faqs = await Faq.find({ isPublished: true }).sort({
      order: 1,
      createdAt: -1,
    });
    return res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch FAQs",
      });
  }
};

export const getAllFaqs = async (_req: Request, res: Response) => {
  try {
    const faqs = await Faq.find({}).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ success: true, count: faqs.length, faqs });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to fetch FAQs",
      });
  }
};

export const createFaq = async (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body as {
      question?: string;
      answer?: string;
    };
    if (!question?.trim() || !answer?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "question and answer are required" });
    }

    const faq = await Faq.create(req.body);
    return res.status(201).json({ success: true, faq });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to create FAQ",
      });
  }
};

export const updateFaq = async (req: Request, res: Response) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!faq)
      return res.status(404).json({ success: false, message: "FAQ not found" });
    return res.status(200).json({ success: true, faq });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update FAQ",
      });
  }
};

export const deleteFaq = async (req: Request, res: Response) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq)
      return res.status(404).json({ success: false, message: "FAQ not found" });
    return res.status(200).json({ success: true, message: "FAQ deleted" });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to delete FAQ",
      });
  }
};
