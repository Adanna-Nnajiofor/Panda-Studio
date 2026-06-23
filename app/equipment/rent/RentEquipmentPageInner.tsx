"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import DashboardShell from "../../../components/dashboard/DashboardShell";
import RoleGate from "../../../components/dashboard/RoleGate";
import { useShopping } from "../../../components/shopping/ShoppingProvider";

import { apiJson, apiUpload } from "../../../lib/api";
import { getErrorMessage } from "../../../lib/errors";

import Image from "next/image";

type Equipment = {
  _id: string;
  name: string;
  dailyRate?: number;
  hourlyRate?: number;
};

export default function RentEquipmentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const equipmentId = searchParams.get("equipmentId") ?? "";

  const [equipment, setEquipment] = useState<Equipment | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [durationType, setDurationType] = useState<
    "daily" | "weekly" | "monthly"
  >("daily");

  const [totalAmount, setTotalAmount] = useState(0);
  const [notes, setNotes] = useState("");
  const [renterName, setRenterName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [renterOccupation, setRenterOccupation] = useState("");
  const [renterAddress, setRenterAddress] = useState("");
  const [renterLocation, setRenterLocation] = useState("");
  const [productionType, setProductionType] = useState<
    | "Music video"
    | "Brand content"
    | "Corporate"
    | "Wedding"
    | "Personal project"
    | "Documentary"
    | "Other"
  >("Brand content");
  const [shootPurpose, setShootPurpose] = useState("");
  const [identityType, setIdentityType] = useState<
    | "NIN"
    | "Voters Card"
    | "International Passport"
    | "Driver License"
    | "Other"
  >("NIN");
  const [identityNumber, setIdentityNumber] = useState("");
  const [idDocument, setIdDocument] = useState<File | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);

  const [idDocumentPreviewUrl, setIdDocumentPreviewUrl] = useState<
    string | null
  >(null);
  const [profilePhotoPreviewUrl, setProfilePhotoPreviewUrl] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!idDocument || !idDocument.type.startsWith("image/")) {
      setIdDocumentPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(idDocument);
    setIdDocumentPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [idDocument]);

  useEffect(() => {
    if (!profilePhoto || !profilePhoto.type.startsWith("image/")) {
      setProfilePhotoPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(profilePhoto);
    setProfilePhotoPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [profilePhoto]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [savingToCart, setSavingToCart] = useState(false);
  const [savingToWishlist, setSavingToWishlist] = useState(false);
  const { addToCart, addToWishlist } = useShopping();

  useEffect(() => {
    if (!equipmentId) return;

    apiJson<{ equipment: Equipment }>(`/equipment/${equipmentId}`)
      .then((data) => {
        setEquipment(data.equipment);
        // Price is per day for equipment rentals
        const daily = data.equipment.dailyRate ?? 0;
        const hourly = data.equipment.hourlyRate ?? 0;
        setTotalAmount(daily > 0 ? daily : hourly);
      })
      .catch(() => setError("Could not load equipment."));
  }, [equipmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!equipmentId || !equipment) {
      setError("Unable to submit rental: missing equipment selection.");
      return;
    }

    if (totalAmount <= 0) {
      setError("Please confirm the rental total before submitting.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("equipment", equipmentId);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("durationType", durationType);
      formData.append("totalAmount", String(totalAmount));
      if (notes.trim()) formData.append("notes", notes.trim());
      if (renterName.trim()) formData.append("renterName", renterName.trim());
      if (contactPhone.trim())
        formData.append("contactPhone", contactPhone.trim());
      if (renterOccupation.trim())
        formData.append("renterOccupation", renterOccupation.trim());
      if (renterAddress.trim())
        formData.append("renterAddress", renterAddress.trim());
      if (renterLocation.trim())
        formData.append("renterLocation", renterLocation.trim());
      if (productionType) formData.append("productionType", productionType);
      if (shootPurpose.trim())
        formData.append("shootPurpose", shootPurpose.trim());
      if (identityType) formData.append("identityType", identityType);
      if (identityNumber.trim())
        formData.append("identityNumber", identityNumber.trim());
      if (idDocument) formData.append("identityDocument", idDocument);
      if (profilePhoto) formData.append("profilePhoto", profilePhoto);

      await apiUpload("/rentals", formData);
      router.push("/equipment/rentals");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Rental request failed."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleGate allowedRoles={["client", "admin", "super_admin"]}>
      <DashboardShell
        kicker="Equipment rental"
        title={equipment ? `Rent ${equipment.name}` : "Rent equipment"}
        summary="Select dates and confirm rental. A 30% deposit is calculated automatically."
      >
        <form
          onSubmit={handleSubmit}
          className="max-w-6xl space-y-6 border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]"
        >
          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="space-y-6">
              <div className="rounded-3xl border-4 border-black bg-[#f9f1e5] p-5 shadow-[8px_8px_0_0_#000]">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d673d]">
                  Rental overview
                </p>
                <h2 className="mt-4 text-2xl font-black uppercase">
                  Booking details
                </h2>
                <p className="mt-3 text-sm opacity-80">
                  Add your dates, rental length, and production context so the
                  studio can approve your booking fast.
                </p>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase">Start</span>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">End</span>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-xs font-black uppercase">
                    Duration type
                  </span>
                  <select
                    value={durationType}
                    onChange={(e) =>
                      setDurationType(e.target.value as typeof durationType)
                    }
                    className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase">
                    Total (₦)
                  </span>
                  <input
                    type="number"
                    min={0}
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-black uppercase">
                    What are you shooting?
                  </span>
                  <textarea
                    value={shootPurpose}
                    onChange={(e) => setShootPurpose(e.target.value)}
                    placeholder="Describe the production use case"
                    className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    rows={4}
                  />
                </label>
              </div>

              <div className="rounded-3xl border-4 border-black bg-[#fff7ec] p-5 shadow-[8px_8px_0_0_#000]">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d673d]">
                  Production profile
                </p>
                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Production type
                    </span>
                    <select
                      value={productionType}
                      onChange={(e) =>
                        setProductionType(
                          e.target.value as typeof productionType,
                        )
                      }
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    >
                      <option value="Brand content">Brand content</option>
                      <option value="Music video">Music video</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Wedding">Wedding</option>
                      <option value="Documentary">Documentary</option>
                      <option value="Personal project">Personal project</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Additional notes
                    </span>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Share anything the crew should know"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                      rows={3}
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border-4 border-black bg-[#f0e7d6] p-5 shadow-[8px_8px_0_0_#000]">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d673d]">
                  Identity verification
                </p>
                <h3 className="mt-4 text-xl font-black uppercase">
                  Your credentials
                </h3>
                <p className="mt-2 text-sm opacity-80">
                  Upload an official ID and a live photo so the studio can
                  verify the rental request quickly.
                </p>

                <div className="mt-6 space-y-4">
                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Full name
                    </span>
                    <input
                      type="text"
                      value={renterName}
                      onChange={(e) => setRenterName(e.target.value)}
                      placeholder="John Doe"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Occupation
                    </span>
                    <input
                      type="text"
                      value={renterOccupation}
                      onChange={(e) => setRenterOccupation(e.target.value)}
                      placeholder="Photographer / Producer"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Location
                    </span>
                    <input
                      type="text"
                      value={renterLocation}
                      onChange={(e) => setRenterLocation(e.target.value)}
                      placeholder="Lagos, Nigeria"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Address
                    </span>
                    <input
                      type="text"
                      value={renterAddress}
                      onChange={(e) => setRenterAddress(e.target.value)}
                      placeholder="123 Creative Lane"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Phone / WhatsApp
                    </span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+234 801 234 5678"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl border-4 border-black bg-[#fff7f0] p-5 shadow-[8px_8px_0_0_#000]">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-[#7d673d]">
                  ID upload options
                </p>
                <div className="mt-5 grid gap-4">
                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      ID type
                    </span>
                    <select
                      value={identityType}
                      onChange={(e) =>
                        setIdentityType(
                          e.target.value as
                            | "NIN"
                            | "Voters Card"
                            | "International Passport"
                            | "Driver License"
                            | "Other",
                        )
                      }
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    >
                      <option value="NIN">NIN</option>
                      <option value="Voters Card">Voter&apos;s Card</option>
                      <option value="International Passport">
                        International Passport
                      </option>
                      <option value="Driver License">
                        Driver&apos;s License
                      </option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      ID number
                    </span>
                    <input
                      type="text"
                      value={identityNumber}
                      onChange={(e) => setIdentityNumber(e.target.value)}
                      placeholder="1234 5678 9012"
                      className="mt-1 w-full border-2 border-black px-3 py-2 text-sm"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Upload ID document
                    </span>
                    <input
                      id="idDocumentInput"
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => {
                        setIdDocument(e.target.files?.[0] ?? null);
                      }}
                      className="mt-1 w-full text-sm"
                    />

                    {idDocument ? (
                      <div className="mt-3 space-y-2">
                        {idDocumentPreviewUrl ? (
                          <Image
                            src={idDocumentPreviewUrl}
                            alt="ID document preview"
                            width={96}
                            height={96}
                            className="h-24 w-24 rounded border-2 border-black object-cover"
                          />
                        ) : (
                          <p className="text-xs opacity-70">
                            PDF selected: {idDocument.name}
                          </p>
                        )}

                        <p className="text-xs opacity-70">
                          Selected: {idDocument.name}
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(
                                "idDocumentInput",
                              ) as HTMLInputElement | null;
                              el?.click();
                            }}
                            className="rounded border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase"
                          >
                            Replace
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIdDocument(null);
                              setIdDocumentPreviewUrl(null);
                              const inputs =
                                document.querySelectorAll<HTMLInputElement>(
                                  'input[type="file"][accept="image/*,application/pdf"]',
                                );
                              const input = inputs[0];
                              if (input) input.value = "";
                            }}
                            className="rounded border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="text-xs font-black uppercase">
                      Upload your photo
                    </span>
                    <input
                      id="profilePhotoInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setProfilePhoto(e.target.files?.[0] ?? null);
                      }}
                      className="mt-1 w-full text-sm"
                    />
                    {profilePhoto ? (
                      <div className="mt-3 space-y-2">
                        {profilePhotoPreviewUrl ? (
                          <Image
                            src={profilePhotoPreviewUrl}
                            alt="Profile photo preview"
                            width={96}
                            height={96}
                            className="h-24 w-24 rounded border-2 border-black object-cover"
                          />
                        ) : (
                          <p className="text-xs opacity-70">
                            Selected image: {profilePhoto.name}
                          </p>
                        )}

                        <p className="text-xs opacity-70">
                          Selected: {profilePhoto.name}
                        </p>

                        <div className="flex flex-wrap gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(
                                "profilePhotoInput",
                              ) as HTMLInputElement | null;
                              el?.click();
                            }}
                            className="rounded border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase"
                          >
                            Replace
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setProfilePhoto(null);
                              setProfilePhotoPreviewUrl(null);
                              const el = document.getElementById(
                                "profilePhotoInput",
                              ) as HTMLInputElement | null;
                              if (el) el.value = "";
                            }}
                            className="rounded border-2 border-black bg-white px-3 py-1 text-xs font-black uppercase"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </label>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    if (!equipmentId) return;
                    setSavingToCart(true);
                    setError(null);
                    try {
                      await addToCart(equipmentId, {
                        quantity: 1,
                        durationHours: 2,
                        label: equipment?.name,
                      });
                    } catch (err: unknown) {
                      setError(getErrorMessage(err, "Failed to add to cart"));
                    } finally {
                      setSavingToCart(false);
                    }
                  }}
                  disabled={savingToCart || !equipmentId}
                  className="flex-1 rounded border-2 border-black bg-[#f2eadf] px-4 py-3 text-sm font-black uppercase tracking-[0.08em] disabled:opacity-60"
                >
                  {savingToCart ? "Adding..." : "Add to cart"}
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    if (!equipmentId) return;
                    setSavingToWishlist(true);
                    setError(null);
                    try {
                      await addToWishlist(equipmentId, {
                        quantity: 1,
                        durationHours: 2,
                        label: equipment?.name,
                      });
                    } catch (err: unknown) {
                      setError(
                        getErrorMessage(err, "Failed to add to wishlist"),
                      );
                    } finally {
                      setSavingToWishlist(false);
                    }
                  }}
                  disabled={savingToWishlist || !equipmentId}
                  className="flex-1 rounded border-2 border-black bg-white px-4 py-3 text-sm font-black uppercase tracking-[0.08em] disabled:opacity-60"
                >
                  {savingToWishlist ? "Saving..." : "Add to wishlist"}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading || !equipmentId}
                className="w-full rounded-[1.5rem] border-4 border-black bg-black px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-[#f2eadf] disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Send rental request"}
              </button>
            </div>
          </div>
        </form>
      </DashboardShell>
    </RoleGate>
  );
}
