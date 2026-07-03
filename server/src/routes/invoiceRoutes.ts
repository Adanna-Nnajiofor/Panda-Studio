import { Router } from "express";
import { protect, authorizeRoles } from "../middleware/authMiddleware";
import { validateOrigin } from "../middleware/csrfMiddleware";
import {
  createInvoice,
  getMyInvoices,
  getInvoiceById,
  markInvoicePaid,
  getReceiptHtml,
  validateCoupon,
  createCoupon,
  getCoupons,
  toggleCoupon,
} from "../controllers/invoiceController";

const router = Router();

// Coupon validation (any authenticated user)
router.post("/coupons/validate", validateOrigin, protect(), validateCoupon);

// Admin coupon management
router.get("/coupons", protect(), authorizeRoles("admin", "super_admin"), getCoupons);
router.post("/coupons", validateOrigin, protect(), authorizeRoles("admin", "super_admin"), createCoupon);
router.patch("/coupons/:id/toggle", validateOrigin, protect(), authorizeRoles("admin", "super_admin"), toggleCoupon);

// Invoice routes
router.get("/", protect(), getMyInvoices);
router.post("/", validateOrigin, protect(), authorizeRoles("admin", "super_admin", "staff"), createInvoice);
router.get("/:id", protect(), getInvoiceById);
router.get("/:id/receipt", protect(), getReceiptHtml);
router.patch("/:id/paid", validateOrigin, protect(), authorizeRoles("admin", "super_admin"), markInvoicePaid);

export default router;
