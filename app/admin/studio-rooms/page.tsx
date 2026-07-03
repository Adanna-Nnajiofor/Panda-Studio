"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { apiJson, apiUpload } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

type StudioRoom = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  capacity: number;
  amenities?: string[];
  basePrice: number;
  isActive: boolean;
  isFeatured?: boolean;
  images?: string[];
  createdAt?: string;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  capacity: number;
  basePrice: number;
  amenitiesText: string;
  isActive: boolean;
  isFeatured: boolean;
};

const initialForm: FormState = {
  name: "",
  slug: "",
  description: "",
  capacity: 1,
  basePrice: 10000,
  amenitiesText: "",
  isActive: true,
  isFeatured: false,
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function AdminStudioRoomsPage() {
  const [rooms, setRooms] = useState<StudioRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [removingImageKey, setRemovingImageKey] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isEditing = Boolean(editingId);

  const loadRooms = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiJson<{ rooms: StudioRoom[] }>(
        "/studio-rooms/admin/list",
      );
      setRooms(result.rooms ?? []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to load studio rooms."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  const sortedRooms = useMemo(
    () => [...rooms].sort((a, b) => a.name.localeCompare(b.name)),
    [rooms],
  );

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  const onCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const amenities = form.amenitiesText
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim(),
        description: form.description.trim() || undefined,
        capacity: Number(form.capacity),
        basePrice: Number(form.basePrice),
        amenities,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      if (!payload.name || !payload.slug) {
        throw new Error("Name and slug are required.");
      }

      if (isEditing && editingId) {
        await apiJson(`/studio-rooms/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
        setMessage("Studio room updated.");
      } else {
        await apiJson("/studio-rooms", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Studio room created.");
      }

      resetForm();
      await loadRooms();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save studio room."));
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (room: StudioRoom) => {
    setEditingId(room._id);
    setForm({
      name: room.name,
      slug: room.slug,
      description: room.description ?? "",
      capacity: room.capacity,
      basePrice: room.basePrice,
      amenitiesText: (room.amenities ?? []).join(", "),
      isActive: room.isActive,
      isFeatured: Boolean(room.isFeatured),
    });
    setMessage(null);
    setError(null);
  };

  const removeRoom = async (id: string) => {
    if (!confirm("Delete this studio room? This action cannot be undone.")) {
      return;
    }

    setError(null);
    setMessage(null);

    try {
      await apiJson(`/studio-rooms/${id}`, { method: "DELETE" });
      setMessage("Studio room deleted.");
      if (editingId === id) resetForm();
      await loadRooms();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to delete studio room."));
    }
  };

  const onUploadImages = async (
    roomId: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingId(roomId);
    setError(null);
    setMessage(null);

    try {
      const formData = new FormData();
      Array.from(files)
        .slice(0, 10)
        .forEach((file) => formData.append("images", file));

      await apiUpload(`/studio-rooms/${roomId}/images`, formData);
      setMessage("Images uploaded.");
      await loadRooms();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to upload images."));
    } finally {
      setUploadingId(null);
      e.target.value = "";
    }
  };

  const onRemoveImage = async (roomId: string, imageUrl: string) => {
    if (!confirm("Remove this image from the room gallery?")) return;

    const key = `${roomId}:${imageUrl}`;
    setRemovingImageKey(key);
    setError(null);
    setMessage(null);

    try {
      await apiJson(`/studio-rooms/${roomId}/images`, {
        method: "DELETE",
        body: JSON.stringify({ url: imageUrl }),
      });
      setMessage("Image removed.");
      await loadRooms();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to remove image."));
    } finally {
      setRemovingImageKey(null);
    }
  };

  const onMoveImage = async (
    roomId: string,
    images: string[],
    index: number,
    direction: -1 | 1,
  ) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;

    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);

    setReorderingId(roomId);
    setError(null);
    setMessage(null);

    try {
      await apiJson(`/studio-rooms/${roomId}/images/reorder`, {
        method: "PATCH",
        body: JSON.stringify({ images: next }),
      });
      setMessage("Image order updated.");
      await loadRooms();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to reorder images."));
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <RoleGate allowedRoles={["admin", "super_admin"]}>
      <DashboardShell
        kicker="Admin"
        title="Studio Rooms"
        summary="Create, update, and publish studio room inventory for booking and studio map discovery."
      >
        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <form
            onSubmit={onCreateOrUpdate}
            className="space-y-4 border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]"
          >
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              {isEditing ? "Edit studio room" : "Create studio room"}
            </p>

            {error ? (
              <p className="border-2 border-black bg-[#ffcfbf] p-2 text-xs font-black">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="border-2 border-black bg-[#d8f0dd] p-2 text-xs font-black">
                {message}
              </p>
            ) : null}

            <label className="block">
              <span className="text-xs font-black uppercase">Name</span>
              <input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    slug: prev.slug || toSlug(name),
                  }));
                }}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase">Slug</span>
              <input
                value={form.slug}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, slug: toSlug(e.target.value) }))
                }
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                required
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="text-xs font-black uppercase">Capacity</span>
                <input
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      capacity: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                  required
                />
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase">
                  Base Price (NGN/hr)
                </span>
                <input
                  type="number"
                  min={0}
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      basePrice: Number(e.target.value),
                    }))
                  }
                  className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                  required
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-black uppercase">
                Amenities (comma-separated)
              </span>
              <input
                value={form.amenitiesText}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    amenitiesText: e.target.value,
                  }))
                }
                placeholder="Lighting grid, Cyclorama wall, Soundproofing"
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase">Description</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                rows={3}
                className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
              />
            </label>

            <label className="flex items-center gap-2 text-xs font-black uppercase">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isActive: e.target.checked }))
                }
              />
              Visible to users
            </label>

            <label className="flex items-center gap-2 text-xs font-black uppercase">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, isFeatured: e.target.checked }))
                }
              />
              Featured on homepage
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="border-4 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf] disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : isEditing
                    ? "Update room"
                    : "Create room"}
              </button>
              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="border-4 border-black bg-white px-4 py-2 text-xs font-black uppercase"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
          </form>

          <section className="space-y-3 border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
            <p className="text-xs font-black uppercase tracking-[0.2em]">
              Existing rooms
            </p>

            {loading ? (
              <p className="text-sm">Loading rooms...</p>
            ) : sortedRooms.length === 0 ? (
              <p className="text-sm text-slate-500">No rooms created yet.</p>
            ) : (
              sortedRooms.map((room) => (
                <article
                  key={room._id}
                  className="border-2 border-black bg-[#fff8ea] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-black">{room.name}</p>
                      <p className="text-[11px] text-slate-600">/{room.slug}</p>
                      <p className="text-[11px] text-slate-600">
                        ₦{room.basePrice.toLocaleString()}/hr · Capacity{" "}
                        {room.capacity}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`border-2 border-black px-2 py-1 text-[10px] font-black uppercase ${
                          room.isActive ? "bg-green-100" : "bg-slate-200"
                        }`}
                      >
                        {room.isActive ? "Active" : "Hidden"}
                      </span>
                      {room.isFeatured ? (
                        <span className="border-2 border-black bg-[#fff2b8] px-2 py-1 text-[10px] font-black uppercase">
                          Featured
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {room.description ? (
                    <p className="mt-2 text-xs text-slate-700">
                      {room.description}
                    </p>
                  ) : null}

                  {room.amenities?.length ? (
                    <p className="mt-1 text-[11px] text-slate-600">
                      {room.amenities.join(" · ")}
                    </p>
                  ) : null}

                  {room.images?.length ? (
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {room.images.map((url) => {
                        const key = `${room._id}:${url}`;
                        const removing = removingImageKey === key;
                        const imageIndex = room.images?.indexOf(url) ?? -1;
                        const isFirst = imageIndex <= 0;
                        const isLast =
                          imageIndex === (room.images?.length ?? 0) - 1;
                        const isReordering = reorderingId === room._id;

                        return (
                          <div
                            key={url}
                            className="border border-black bg-white p-1"
                          >
                            <a href={url} target="_blank" rel="noreferrer">
                              <img
                                src={url}
                                alt={`${room.name} gallery`}
                                className="h-20 w-full border border-black object-cover"
                                loading="lazy"
                              />
                            </a>
                            <button
                              type="button"
                              onClick={() => void onRemoveImage(room._id, url)}
                              disabled={removing || isReordering}
                              className="mt-1 w-full border border-black bg-[#fff8ea] px-1 py-1 text-[10px] font-black uppercase disabled:opacity-60"
                            >
                              {removing ? "Removing..." : "Remove"}
                            </button>
                            <div className="mt-1 grid grid-cols-2 gap-1">
                              <button
                                type="button"
                                onClick={() =>
                                  void onMoveImage(
                                    room._id,
                                    room.images ?? [],
                                    imageIndex,
                                    -1,
                                  )
                                }
                                disabled={isFirst || removing || isReordering}
                                className="w-full border border-black bg-white px-1 py-1 text-[10px] font-black uppercase disabled:opacity-60"
                              >
                                Up
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  void onMoveImage(
                                    room._id,
                                    room.images ?? [],
                                    imageIndex,
                                    1,
                                  )
                                }
                                disabled={isLast || removing || isReordering}
                                className="w-full border border-black bg-white px-1 py-1 text-[10px] font-black uppercase disabled:opacity-60"
                              >
                                Down
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : null}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(room)}
                      className="border-2 border-black bg-white px-2 py-1 text-[11px] font-black uppercase"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void removeRoom(room._id)}
                      className="border-2 border-black bg-white px-2 py-1 text-[11px] font-black uppercase"
                    >
                      Delete
                    </button>
                    <label className="cursor-pointer border-2 border-black bg-white px-2 py-1 text-[11px] font-black uppercase">
                      {uploadingId === room._id
                        ? "Uploading..."
                        : "Upload images"}
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void onUploadImages(room._id, e)}
                        disabled={uploadingId === room._id}
                      />
                    </label>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>
      </DashboardShell>
    </RoleGate>
  );
}
