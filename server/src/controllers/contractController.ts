import type { Request, Response } from "express";
import Contract from "../models/Contract";
import type { AuthenticatedRequest } from "../types/auth";
import { logAudit } from "../utils/audit";

const getUserId = (req: Request) => (req as AuthenticatedRequest).user?.id;

export const createContract = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const contract = await Contract.create({ ...req.body, createdBy: userId });

    await logAudit({
      req,
      action: "create",
      entityType: "contract",
      entityId: String(contract._id),
      message: `Contract created: ${contract.title}`,
    });

    res.status(201).json({ success: true, contract });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create contract",
    });
  }
};

export const listContracts = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { status, contractType } = req.query as Record<string, string>;

    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    if (contractType) query.contractType = contractType;

    const contracts = await Contract.find(query)
      .populate("createdBy", "fullName email role")
      .populate("project", "_id progressStatus")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: contracts.length, contracts });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contracts" });
  }
};

export const getContractById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const contract = await Contract.findById(req.params.id)
      .populate("createdBy", "fullName email role")
      .populate("project", "_id progressStatus");

    if (!contract) {
      res.status(404).json({ success: false, message: "Contract not found" });
      return;
    }

    res.json({ success: true, contract });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch contract" });
  }
};

export const updateContract = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const contract = await Contract.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!contract) {
      res.status(404).json({ success: false, message: "Contract not found" });
      return;
    }

    await logAudit({
      req,
      action: "update",
      entityType: "contract",
      entityId: String(contract._id),
      message: `Contract updated: ${contract.title}`,
    });

    res.json({ success: true, contract });
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update contract",
    });
  }
};

export const sendContract = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      res.status(404).json({ success: false, message: "Contract not found" });
      return;
    }

    contract.status = "sent";
    contract.sentAt = new Date();
    await contract.save();

    await logAudit({
      req,
      action: "status_change",
      entityType: "contract",
      entityId: String(contract._id),
      message: `Contract sent: ${contract.title}`,
      metadata: { status: "sent" },
    });

    res.json({ success: true, contract });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to send contract" });
  }
};

export const signContract = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const userId = getUserId(req);
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404).json({ success: false, message: "Contract not found" });
      return;
    }

    contract.status = "signed";
    contract.signedAt = new Date();
    if (userId) contract.signedBy = userId as any;
    await contract.save();

    await logAudit({
      req,
      action: "status_change",
      entityType: "contract",
      entityId: String(contract._id),
      message: `Contract signed: ${contract.title}`,
      metadata: { status: "signed" },
    });

    res.json({ success: true, contract });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to sign contract" });
  }
};

export const cancelContract = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const contract = await Contract.findById(req.params.id);

    if (!contract) {
      res.status(404).json({ success: false, message: "Contract not found" });
      return;
    }

    contract.status = "cancelled";
    contract.cancellationReason =
      (req.body?.reason ?? "").toString().trim() || undefined;
    await contract.save();

    await logAudit({
      req,
      action: "status_change",
      entityType: "contract",
      entityId: String(contract._id),
      message: `Contract cancelled: ${contract.title}`,
      metadata: { status: "cancelled", reason: contract.cancellationReason },
    });

    res.json({ success: true, contract });
  } catch {
    res
      .status(500)
      .json({ success: false, message: "Failed to cancel contract" });
  }
};
