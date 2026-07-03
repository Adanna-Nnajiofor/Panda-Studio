"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import DashboardShell from "../../../../components/dashboard/DashboardShell";
import RoleGate from "../../../../components/dashboard/RoleGate";
import { apiJson } from "../../../../lib/api";
import { getErrorMessage } from "../../../../lib/errors";

export default function MembershipVerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Verifying membership payment...");

  useEffect(() => {
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const reference = new URLSearchParams(window.location.search).get(
          "reference",
        );
        if (!reference) {
          setStatus("error");
          setMessage("Missing payment reference.");
          return;
        }

        const response = await apiJson<{ message?: string }>(
          "/academy/memberships/verify",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reference }),
          },
        );

        setStatus("success");
        setMessage(response.message ?? "Membership activated successfully.");
      } catch (err) {
        setStatus("error");
        setMessage(
          getErrorMessage(err, "Failed to verify membership payment."),
        );
      }
    })();
  }, []);

  return (
    <RoleGate
      allowedRoles={["client", "crew", "staff", "admin", "super_admin"]}
    >
      <DashboardShell
        kicker="Panda Academy"
        title="Membership verification"
        summary="Finalizing your subscription and unlocking membership courses."
      >
        <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
          <p className="text-sm font-black uppercase tracking-[0.2em]">
            {status === "loading"
              ? "Processing"
              : status === "success"
                ? "Success"
                : "Error"}
          </p>
          <p className="mt-2 text-sm">{message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/academy/membership"
              className="border-2 border-black bg-black px-4 py-2 text-xs font-black uppercase text-[#f2eadf]"
            >
              Membership plans
            </Link>
            <Link
              href="/academy/my-courses"
              className="border-2 border-black bg-white px-4 py-2 text-xs font-black uppercase"
            >
              My courses
            </Link>
          </div>
        </section>
      </DashboardShell>
    </RoleGate>
  );
}
