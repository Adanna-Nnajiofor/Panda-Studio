import { Suspense } from "react";
import HireClient from "./HireClient";

export default function HirePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f2eadf] px-4 py-10 text-black">
          <div className="mx-auto max-w-3xl rounded border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
            <p className="text-sm font-black uppercase">Loading hire page...</p>
          </div>
        </main>
      }
    >
      <HireClient />
    </Suspense>
  );
}
