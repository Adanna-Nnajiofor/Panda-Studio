import { Router } from "express";
import Payment from "../models/Payment";
import type { AuthenticatedRequest } from "../types/auth";
import { isPrivilegedRole } from "../utils/user";
import { protect, requireAdmin } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";

const router = Router();

router.use(protect());

const paymentVisibilityFilter = (
  user: NonNullable<AuthenticatedRequest["user"]>,
) => {
  if (isPrivilegedRole(user.role)) {
    return {};
  }

  return {
    $or: [{ client: user.id }, { createdBy: user.id }, { user: user.id }],
  };
};

router.get("/", async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const payments = await Payment.find(paymentVisibilityFilter(user!)).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    success: true,
    count: payments.length,
    payments,
  });
});

router.get("/mine", async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const payments = await Payment.find(paymentVisibilityFilter(user!)).sort({
    createdAt: -1,
  });

  return res.status(200).json({
    success: true,
    count: payments.length,
    payments,
  });
});

router.get("/:id", async (req, res) => {
  const { user } = req as AuthenticatedRequest;
  const payment = await Payment.findById(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  if (!isPrivilegedRole(user!.role)) {
    const visiblePayment = await Payment.findOne({
      _id: payment._id,
      ...paymentVisibilityFilter(user!),
    });

    if (!visiblePayment) {
      return res.status(403).json({
        success: false,
        message: "You do not have access to this payment",
      });
    }
  }

  return res.status(200).json({
    success: true,
    payment,
  });
});

router.post("/", validateOrigin, requireAdmin(), async (req, res) => {
  const payment = await Payment.create(req.body);

  return res.status(201).json({
    success: true,
    payment,
  });
});

router.patch(
  "/:id/status",
  validateOrigin,
  requireAdmin(),
  async (req, res) => {
    const { status } = req.body as { status?: string };

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "status is required",
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  },
);

router.delete("/:id", validateOrigin, requireAdmin(), async (req, res) => {
  const payment = await Payment.findByIdAndDelete(req.params.id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Payment deleted successfully",
  });
});

export default router;
