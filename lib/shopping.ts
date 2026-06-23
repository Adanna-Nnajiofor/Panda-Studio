export type CartItem = {
  _id: string;
  equipment: {
    _id: string;
    name?: string;
    hourlyRate?: number;
    quantity?: number;
    isActive?: boolean;
  };
  quantity: number;
  durationHours: number;
};

export type WishlistItem = CartItem & {
  savedAt?: string | Date;
};

export type CartResponse = {
  cart: {
    items: CartItem[];
    totalAmount: number;
  };
};

export type WishlistResponse = {
  wishlist: {
    items: WishlistItem[];
  };
};

export type EquipmentPreview = {
  _id: string;
  name: string;
  type: string;
  hourlyRate: number;
  description?: string;
  images?: string[];
};

export type ServicePreview = {
  _id: string;
  name: string;
  basePrice: number;
  durationInHours: number;
  description?: string;
};

export type AddItemOptions = {
  quantity?: number;
  durationHours?: number;
  label?: string;
};

export function formatNaira(amount: number) {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function lineTotal(
  hourlyRate: number,
  quantity: number,
  durationHours: number,
) {
  return hourlyRate * quantity * durationHours;
}
