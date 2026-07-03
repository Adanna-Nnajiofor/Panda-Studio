import type { Request, Response } from "express";
import Invoice from "../models/Invoice";
import Coupon from "../models/Coupon";
import type { AuthenticatedRequest } from "../types/auth";
import { canManageUsers, isPrivilegedRole } from "../utils/user";

const getAuth = (req: Request) => (req as AuthenticatedRequest).user;

// ─── Validate coupon ──────────────────────────────────────────────────────────
export const validateCoupon = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const { code, orderAmount } = req.body as {
      code?: string;
      orderAmount?: number;
    };
    if (!code)
      return res
        .status(400)
        .json({ success: false, message: "Coupon code is required" });

    const coupon = await Coupon.findOne({
      code: String(code).toUpperCase().trim(),
      isActive: true,
    });

    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Invalid or expired coupon code" });
    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      return res
        .status(400)
        .json({ success: false, message: "This coupon has expired" });
    }
    if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This coupon has reached its usage limit",
        });
    }
    if (
      coupon.minOrderAmount > 0 &&
      (orderAmount ?? 0) < coupon.minOrderAmount
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount for this coupon is ₦${coupon.minOrderAmount.toLocaleString()}`,
      });
    }

    const discount =
      coupon.discountType === "percentage"
        ? Math.round(((orderAmount ?? 0) * coupon.discountValue) / 100)
        : coupon.discountValue;

    return res.status(200).json({
      success: true,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        calculatedDiscount: discount,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// ─── Create invoice ───────────────────────────────────────────────────────────
export const createInvoice = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth || !isPrivilegedRole(auth.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const {
      clientId,
      bookingId,
      items,
      dueDate,
      notes,
      couponCode,
      tax = 0,
    } = req.body as {
      clientId: string;
      bookingId?: string;
      items: { description: string; quantity: number; unitPrice: number }[];
      dueDate: string;
      notes?: string;
      couponCode?: string;
      tax?: number;
    };

    if (!clientId || !items?.length || !dueDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "clientId, items, and dueDate are required",
        });
    }

    const invoiceItems = items.map((i) => ({
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      subtotal: i.quantity * i.unitPrice,
    }));

    const subtotal = invoiceItems.reduce((s, i) => s + i.subtotal, 0);
    let couponDiscount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
      });
      if (coupon) {
        couponDiscount =
          coupon.discountType === "percentage"
            ? Math.round((subtotal * coupon.discountValue) / 100)
            : coupon.discountValue;
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const taxAmount = Math.round(((subtotal - couponDiscount) * tax) / 100);
    const total = subtotal - couponDiscount + taxAmount;

    const invoice = await Invoice.create({
      client: clientId,
      booking: bookingId ?? undefined,
      createdBy: auth.id,
      items: invoiceItems,
      subtotal,
      discount: couponDiscount,
      tax: taxAmount,
      total,
      dueDate: new Date(dueDate),
      notes,
      couponCode: couponCode?.toUpperCase(),
      couponDiscount,
      status: "sent",
    });

    return res.status(201).json({ success: true, invoice });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// ─── Get my invoices ──────────────────────────────────────────────────────────
export const getMyInvoices = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const filter = isPrivilegedRole(auth.role) ? {} : { client: auth.id };
    const invoices = await Invoice.find(filter)
      .populate("client", "fullName email")
      .populate("booking", "referenceNumber bookingDate")
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, invoices });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// ─── Get invoice by ID ────────────────────────────────────────────────────────
export const getInvoiceById = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const invoice = await Invoice.findById(req.params.id)
      .populate("client", "fullName email phone")
      .populate("booking", "referenceNumber bookingDate bookingTime")
      .populate("createdBy", "fullName");

    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });

    const isOwner = String(invoice.client._id ?? invoice.client) === auth.id;
    if (!isOwner && !isPrivilegedRole(auth.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// ─── Mark invoice paid ────────────────────────────────────────────────────────
export const markInvoicePaid = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth || !isPrivilegedRole(auth.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: "paid", paidAt: new Date() },
      { new: true },
    );

    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });
    return res.status(200).json({ success: true, invoice });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// ─── Receipt HTML (printable) ─────────────────────────────────────────────────
export const getReceiptHtml = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth)
      return res
        .status(401)
        .json({ success: false, message: "Not authorized" });

    const invoice = await Invoice.findById(req.params.id)
      .populate<{
        client: { fullName: string; email: string; phone?: string };
      }>("client", "fullName email phone")
      .populate<{
        booking: {
          referenceNumber: string;
          bookingDate: Date;
          bookingTime: string;
        } | null;
      }>("booking", "referenceNumber bookingDate bookingTime")
      .populate<{ createdBy: { fullName: string } }>("createdBy", "fullName");

    if (!invoice)
      return res
        .status(404)
        .json({ success: false, message: "Invoice not found" });

    const isOwner =
      String((invoice.client as any)._id ?? invoice.client) === auth.id;
    if (!isOwner && !isPrivilegedRole(auth.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const rows = invoice.items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;">${item.description}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;">₦${item.unitPrice.toLocaleString()}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:600;">₦${item.subtotal.toLocaleString()}</td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Receipt ${invoice.referenceNumber}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:Arial,sans-serif;background:#f5f5f5;padding:32px 16px;color:#1a1a1a}
    .card{max-width:720px;margin:0 auto;background:#fff;border:4px solid #000;box-shadow:8px 8px 0 #000;padding:40px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:4px solid #000;padding-bottom:24px;margin-bottom:24px}
    .brand{font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:0.05em}
    .brand span{display:block;font-size:12px;font-weight:400;text-transform:none;color:#666;margin-top:4px}
    .badge{background:#000;color:#f2eadf;padding:6px 14px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.2em}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px}
    .meta-block p{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;color:#888;margin-bottom:4px}
    .meta-block span{font-size:14px;font-weight:600}
    table{width:100%;border-collapse:collapse;margin-bottom:24px}
    thead tr{background:#000;color:#f2eadf}
    thead th{padding:10px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:0.15em}
    thead th:last-child,thead th:nth-child(3){text-align:right}
    thead th:nth-child(2){text-align:center}
    .totals{margin-left:auto;width:280px}
    .totals tr td{padding:6px 0;font-size:14px}
    .totals tr td:last-child{text-align:right;font-weight:600}
    .totals .grand td{font-size:18px;font-weight:900;border-top:3px solid #000;padding-top:10px}
    .status{display:inline-block;padding:4px 12px;font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;border:2px solid #000}
    .status.paid{background:#d8f0dd}
    .status.sent{background:#fff8ea}
    .status.overdue{background:#ffcfbf}
    .footer{margin-top:32px;border-top:2px solid #eee;padding-top:16px;font-size:12px;color:#888;text-align:center}
    @media print{body{background:#fff;padding:0}.card{box-shadow:none;border:none}}
    @media(max-width:600px){.meta{grid-template-columns:1fr}.header{flex-direction:column;gap:12px}}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div>
        <div class="brand">🐼 Panda Studio<span>Creative Production Platform</span></div>
      </div>
      <div style="text-align:right">
        <div class="badge">${invoice.status}</div>
        <p style="margin-top:8px;font-size:13px;font-weight:700">${invoice.referenceNumber}</p>
      </div>
    </div>

    <div class="meta">
      <div class="meta-block">
        <p>Billed to</p>
        <span>${(invoice.client as any).fullName}</span><br/>
        <span style="font-size:13px;color:#555">${(invoice.client as any).email}</span>
        ${(invoice.client as any).phone ? `<br/><span style="font-size:13px;color:#555">${(invoice.client as any).phone}</span>` : ""}
      </div>
      <div class="meta-block">
        <p>Invoice details</p>
        <span>Issued: ${new Date(invoice.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span><br/>
        <span style="font-size:13px;color:#555">Due: ${new Date(invoice.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
        ${invoice.paidAt ? `<br/><span style="font-size:13px;color:#2e7d32;font-weight:700">Paid: ${new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>` : ""}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <table class="totals">
      <tr><td>Subtotal</td><td>₦${invoice.subtotal.toLocaleString()}</td></tr>
      ${invoice.discount > 0 ? `<tr><td>Discount${invoice.couponCode ? ` (${invoice.couponCode})` : ""}</td><td style="color:#2e7d32">-₦${invoice.discount.toLocaleString()}</td></tr>` : ""}
      ${invoice.tax > 0 ? `<tr><td>Tax</td><td>₦${invoice.tax.toLocaleString()}</td></tr>` : ""}
      <tr class="grand"><td>Total</td><td>₦${invoice.total.toLocaleString()}</td></tr>
    </table>

    ${invoice.notes ? `<div style="background:#fff8ea;border:2px solid #000;padding:14px;margin-top:8px;font-size:13px"><strong>Notes:</strong> ${invoice.notes}</div>` : ""}

    <div class="footer">
      <p>Thank you for choosing Panda Studio.</p>
      <p style="margin-top:4px">Questions? Contact us at pandastudiong@gmail.com</p>
      <button onclick="window.print()" style="margin-top:16px;background:#000;color:#f2eadf;border:none;padding:10px 24px;font-weight:900;font-size:12px;text-transform:uppercase;letter-spacing:0.2em;cursor:pointer">Print / Save as PDF</button>
    </div>
  </div>
</body>
</html>`;

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// ─── Coupon CRUD (admin) ──────────────────────────────────────────────────────
export const createCoupon = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth || !isPrivilegedRole(auth.role))
      return res.status(403).json({ success: false, message: "Forbidden" });

    const coupon = await Coupon.create(req.body);
    return res.status(201).json({ success: true, coupon });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

export const getCoupons = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth || !isPrivilegedRole(auth.role))
      return res.status(403).json({ success: false, message: "Forbidden" });

    const coupons = await Coupon.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, coupons });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

export const toggleCoupon = async (
  req: Request,
  res: Response,
): Promise<Response | void> => {
  try {
    const auth = getAuth(req);
    if (!auth || !isPrivilegedRole(auth.role))
      return res.status(403).json({ success: false, message: "Forbidden" });

    const coupon = await Coupon.findById(req.params.id);
    if (!coupon)
      return res
        .status(404)
        .json({ success: false, message: "Coupon not found" });

    coupon.isActive = !coupon.isActive;
    await coupon.save();
    return res.status(200).json({ success: true, coupon });
  } catch (error) {
    return res
      .status(500)
      .json({
        success: false,
        message: error instanceof Error ? error.message : "Server error",
      });
  }
};

// Generate an invoice for a booking programmatically. This is a best-effort
// helper used by payment flows; it must not throw on failure.
export const generateInvoiceForBooking = async (opts: {
  bookingId: string;
  paymentId?: string;
}): Promise<void> => {
  try {
    const Booking = (await import("../models/Booking")).default;
    const Invoice = (await import("../models/Invoice")).default;

    const booking = await Booking.findById(opts.bookingId).populate(
      "user",
      "_id",
    );
    if (!booking) return;

    const clientId =
      (booking.user && (booking.user as any)._id) || booking.user;

    const items = [
      {
        description: `Booking ${booking.referenceNumber}`,
        quantity: 1,
        unitPrice: booking.totalAmount,
        subtotal: booking.totalAmount,
      },
    ];

    const subtotal = booking.totalAmount;
    const total = subtotal;

    const invoice = await Invoice.create({
      client: clientId,
      booking: booking._id,
      createdBy: clientId,
      items,
      subtotal,
      discount: 0,
      tax: 0,
      total,
      dueDate: new Date(),
      status: opts.paymentId ? "paid" : "sent",
      paidAt: opts.paymentId ? new Date() : null,
    } as any);

    // no-op: invoice created successfully
    return;
  } catch (e) {
    // swallow errors — invoice generation is best-effort
    return;
  }
};
