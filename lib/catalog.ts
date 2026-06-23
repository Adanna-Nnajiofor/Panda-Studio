import { apiJson } from "./api";
import { getErrorMessage } from "./errors";
import type { EquipmentPreview, ServicePreview } from "./shopping";

export type { EquipmentPreview, ServicePreview };

export async function fetchPublicEquipment(): Promise<{
  equipment: EquipmentPreview[];
  error: string | null;
}> {
  try {
    const data = await apiJson<{ equipment: EquipmentPreview[] }>("/equipment");
    return { equipment: data.equipment ?? [], error: null };
  } catch (err) {
    return {
      equipment: [],
      error: getErrorMessage(err, "Could not load equipment."),
    };
  }
}

export async function fetchPublicServices(): Promise<{
  services: ServicePreview[];
  error: string | null;
}> {
  try {
    const data = await apiJson<ServicePreview[] | { services: ServicePreview[] }>(
      "/services",
    );
    const services = Array.isArray(data) ? data : (data.services ?? []);
    return { services, error: null };
  } catch (err) {
    return {
      services: [],
      error: getErrorMessage(err, "Could not load services."),
    };
  }
}

export function equipmentRentPath(equipmentId: string) {
  return `/equipment/rent?equipmentId=${encodeURIComponent(equipmentId)}`;
}

export function loginNextPath(path: string) {
  return `/login?next=${encodeURIComponent(path)}`;
}

export function registerNextPath(path: string) {
  return `/register?next=${encodeURIComponent(path)}`;
}
