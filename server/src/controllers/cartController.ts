import { z } from "zod";
import type { Response } from "express";
import Cart from "../models/Cart";
import Equipment from "../models/Equipment";
import { AuthRequest } from "../types/auth";

const addItemSchema = z.object({
  equipmentId: z.string().min(1),
  quantity: z.number().int().min(1).optional().default(1),
  durationHours: z.number().positive().optional().default(2),
});

const updateItemSchema = z.object({
  quantity: z.number().int().min(1).optional(),
  durationHours: z.number().positive().optional(),
});

const computeCartTotal = async (
  items: {
    equipment: { _id: string };
    quantity: number;
    durationHours: number;
  }[],
) => {
  const equipmentIds = Array.from(new Set(items.map((i) => i.equipment._id)));
  const equipments = await Equipment.find({
    _id: { $in: equipmentIds },
  }).select("hourlyRate quantity name isActive");

  const rateById = new Map(
    equipments.map((e) => [e._id.toString(), e.hourlyRate] as const),
  );

  return items.reduce((sum, item) => {
    const rate = rateById.get(item.equipment._id) ?? 0;
    return sum + rate * item.durationHours * item.quantity;
  }, 0);
};

export const getCart = async (req: AuthRequest, res: Response) => {
  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) {
    return res.status(200).json({ cart: { items: [], totalAmount: 0 } });
  }

  // Resolve equipment for totals + validation-friendly response
  const equipmentIds = cart.items.map((it) => it.equipment.toString());
  const equipments = await Equipment.find({
    _id: { $in: equipmentIds },
  }).select("hourlyRate quantity name isActive");
  const equipById = new Map(
    equipments.map((e) => [e._id.toString(), e] as const),
  );

  const enrichedItems = cart.items.map((it) => {
    const eq = equipById.get(it.equipment.toString());
    return {
      _id: String(it._id),
      equipment: {
        _id: it.equipment,
        name: eq?.name,
        hourlyRate: eq?.hourlyRate,
        quantity: eq?.quantity,
        isActive: eq?.isActive,
      },
      quantity: it.quantity,
      durationHours: it.durationHours,
    };
  });

  const totalAmount = await computeCartTotal(
    enrichedItems.map((i) => ({
      equipment: { _id: i.equipment._id.toString() },
      quantity: i.quantity,
      durationHours: i.durationHours,
    })),
  );

  return res.status(200).json({
    cart: {
      items: enrichedItems,
      totalAmount,
    },
  });
};

export const addItemToCart = async (req: AuthRequest, res: Response) => {
  const parsed = addItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { equipmentId, quantity, durationHours } = parsed.data;

  const equipment = await Equipment.findById(equipmentId).select(
    "_id hourlyRate quantity isActive",
  );
  if (!equipment || !equipment.isActive) {
    return res.status(404).json({ message: "Equipment not available" });
  }

  let cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) {
    cart = await Cart.create({ user: req.user!.id, items: [] });
  }

  const existing = cart.items.find(
    (it) => it.equipment.toString() === equipmentId,
  );
  if (existing) {
    existing.quantity = quantity;
    existing.durationHours = durationHours;
  } else {
    cart.items.push({
      equipment: equipmentId,
      quantity,
      durationHours,
    } as any);
  }

  await cart.save();
  return getCart(req, res);
};

export const updateCartItem = async (req: AuthRequest, res: Response) => {
  const parsed = updateItemSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const itemId = req.params.itemId;
  const { quantity, durationHours } = parsed.data;

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.find((it: any) => String(it._id) === itemId);

  if (!item) return res.status(404).json({ message: "Cart item not found" });

  if (typeof quantity === "number") item.quantity = quantity;
  if (typeof durationHours === "number") item.durationHours = durationHours;

  await cart.save();
  return getCart(req, res);
};

export const removeCartItem = async (req: AuthRequest, res: Response) => {
  const itemId = req.params.itemId;

  const cart = await Cart.findOne({ user: req.user!.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  // Mongoose subdocuments keep an _id, but our ICartItem interface does not model it.
  cart.items = (cart.items as Array<{ _id?: unknown }>).filter(
    (it) => String(it._id) !== itemId,
  ) as any;

  await cart.save();
  return getCart(req, res);
};
