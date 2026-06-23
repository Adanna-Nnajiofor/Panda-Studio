"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type AuthActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
};

export default function AuthActionModal({
  isOpen,
  onClose,
  message = "You need to log in to continue this action.",
}: AuthActionModalProps) {
  const pathname = usePathname();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md border-4 border-black bg-[#fffef8] p-8 shadow-[12px_12px_0_0_#000]">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tight">
            Authentication Required
          </h2>
          <button
            onClick={onClose}
            className="text-2xl font-black hover:scale-110 transition-transform"
          >
            ✕
          </button>
        </div>

        <p className="mt-4 text-sm font-medium leading-relaxed text-gray-700">
          {message}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <Link
            href={`/login?next=${encodeURIComponent(pathname)}`}
            className="border-4 border-black bg-black px-6 py-3 text-center text-sm font-black uppercase tracking-[0.2em] text-[#f2eadf] hover:bg-gray-800 transition-colors"
          >
            Log In
          </Link>
          <Link
            href={`/register?next=${encodeURIComponent(pathname)}`}
            className="border-4 border-black bg-white px-6 py-3 text-center text-sm font-black uppercase tracking-[0.2em] text-black hover:bg-gray-100 transition-colors"
          >
            Create Account
          </Link>
          <button
            onClick={onClose}
            className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-gray-500 hover:text-black transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
}
