interface InvoicePanelProps {
  bookings: Array<{
    _id: string;
    referenceNumber: string;
    bookingDate: string;
    bookingTime: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    service: { name: string } | string;
  }>;
}

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-slate-900",
  cancelled: "bg-rose-100 text-rose-800",
  unpaid: "bg-rose-100 text-rose-800",
  paid: "bg-emerald-100 text-emerald-800",
  refunded: "bg-slate-100 text-slate-900",
};

export default function InvoicePanel({ bookings }: InvoicePanelProps) {
  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-500">
            Invoices
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Recent receipts
          </h2>
        </div>
        <p className="text-sm text-slate-500">
          {bookings.length} {bookings.length === 1 ? "invoice" : "invoices"}
        </p>
      </div>

      <div className="mt-8 space-y-4">
        {bookings.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-600">
            No invoices yet. Book a session to generate your first receipt.
          </div>
        ) : (
          bookings.slice(0, 5).map((booking) => {
            const statusLabel = booking.paymentStatus || booking.status;
            const statusClass =
              statusStyles[statusLabel] || "bg-slate-100 text-slate-900";
            const serviceName =
              typeof booking.service === "string"
                ? booking.service
                : booking.service.name;
            return (
              <article
                key={booking._id}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">
                      {serviceName}
                    </p>
                    <p className="mt-1 text-xl font-semibold text-slate-950">
                      {booking.referenceNumber}
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusClass}`}
                  >
                    {statusLabel.replace("_", " ")}
                  </span>
                </div>
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Date
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {new Date(booking.bookingDate).toLocaleDateString(
                        undefined,
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Time
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {booking.bookingTime}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                      Amount
                    </p>
                    <p className="mt-2 text-sm font-semibold text-emerald-600">
                      ₦{booking.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}
