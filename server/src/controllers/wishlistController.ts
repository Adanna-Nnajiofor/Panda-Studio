import { z } from "zod";
import type { Response } from "express";
import Wishlist from "../models/Wishlist";
import Cart from "../models/Cart";
import Equipment from "../models/Equipment";
import { AuthRequest } from "../types/auth";

const addWishlistItemSchema = z.object({
  equipmentId: z.string().min(1),
  quantity: z.number().int().min(1).optional().default(1),
  durationHours: z.number().positive().optional().default(2),
});

const updateWishlistItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  durationHours: z.number().positive().optional(),
});

const getWishlist = async (req: AuthRequest, res: Response) => {
  const wishlist = await Wishlist.findOne({ user: req.user!.id });
  if (!wishlist) {
    return res.status(200).json({ wishlist: { items: [] } });
  }

  const equipmentIds = wishlist.items.map((it) => it.equipment.toString());
  const equipments = await Equipment.find({
    _id: { $in: equipmentIds },
  }).select("_id name hourlyRate isActive quantity");

  const equipById = new Map(
    equipments.map((e) => [e._id.toString(), e] as const),
  );

  const items = wishlist.items.map((it) => {
    const eq = equipById.get(it.equipment.toString());
    return {
      _id: String(it._id),
      equipment: {
        _id: it.equipment,
        name: eq?.name,
        hourlyRate: (eq as any)?.hourlyRate,
        quantity: (eq as any)?.quantity,
        isActive: eq?.isActive,
      },
      quantity: it.quantity,
      durationHours: it.durationHours,
      savedAt: it.savedAt,
    };
  });

  return res.status(200).json({ wishlist: { items } });
};

const addWishlistItem = async (req: AuthRequest, res: Response) => {
  const parsed = addWishlistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { equipmentId, quantity, durationHours } = parsed.data;

  const equipment = await Equipment.findById(equipmentId).select(
    "_id isActive hourlyRate quantity",
  );
  if (!equipment || !equipment.isActive) {
    return res.status(404).json({ message: "Equipment not available" });
  }

  let wishlist = await Wishlist.findOne({ user: req.user!.id });
  if (!wishlist) {
    wishlist = await Wishlist.create({ user: req.user!.id, items: [] });
  }

  const existing = wishlist.items.find(
    (it) => it.equipment.toString() === equipmentId,
  );

  if (existing) {
    existing.quantity = quantity;
    existing.durationHours = durationHours;
    existing.savedAt = new Date();
  } else {
    wishlist.items.push({
      equipment: equipmentId as any,
      quantity,
      durationHours,
      savedAt: new Date(),
    } as any);
  }

  await wishlist.save();
  return getWishlist(req, res);
};

const updateWishlistItem = async (req: AuthRequest, res: Response) => {
  const parsed = updateWishlistItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { itemId } = req.params;
  const { quantity, durationHours } = parsed.data;

  const wishlist = await Wishlist.findOne({ user: req.user!.id });
  if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

  const item = wishlist.items.find((it) => String(it._id) === itemId);
  if (!item)
    return res.status(404).json({ message: "Wishlist item not found" });

  if (typeof quantity === "number") item.quantity = quantity;
  if (typeof durationHours === "number") item.durationHours = durationHours;

  await wishlist.save();
  return getWishlist(req, res);
};

const removeWishlistItem = async (req: AuthRequest, res: Response) => {
  const { itemId } = req.params;

  const wishlist = await Wishlist.findOne({ user: req.user!.id });
  if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

  wishlist.items = wishlist.items.filter((it) => String(it._id) !== itemId);
  await wishlist.save();

  return getWishlist(req, res);
};

const moveWishlistToCart = async (req: AuthRequest, res: Response) => {
  // Move all wishlist items to cart for now (simplest functional UX)
  const wishlist = await Wishlist.findOne({ user: req.user!.id });
  if (!wishlist || wishlist.items.length === 0) {
    return res.status(200).json({ message: "Wishlist is empty" });
  }

  let cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) cart = await Cart.create({ user: req.user!.id, items: [] });

  // Validate equipment availability before moving
  const equipmentIds = wishlist.items.map((it) => it.equipment.toString());
  const equipments = await Equipment.find({
    _id: { $in: equipmentIds },
  }).select("_id isActive");
  const valid = new Set(
    equipments.filter((e) => e.isActive).map((e) => e._id.toString()),
  );

  for (const it of wishlist.items) {
    if (!valid.has(it.equipment.toString())) continue;

    const existing = cart.items.find(
      (ci: any) => String(ci.equipment) === String(it.equipment),
    );

    if (existing) {
      existing.quantity = it.quantity;
      existing.durationHours = it.durationHours;
    } else {
      cart.items.push({
        equipment: it.equipment,
        quantity: it.quantity,
        durationHours: it.durationHours,
      } as any);
    }
  }

  wishlist.items = [];
  await wishlist.save();
  await cart.save();

  return res.status(200).json({ message: "Moved to cart" });
};

export {
  getWishlist,
  addWishlistItem,
  updateWishlistItem,
  removeWishlistItem,
  moveWishlistToCart,
};
