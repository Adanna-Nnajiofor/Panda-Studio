interface BookingItem {
  bookingDate: string;
  bookingTime: string;
  status: string;
}

interface ScheduleCalendarProps {
  bookings: BookingItem[];
}

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ScheduleCalendar({ bookings }: ScheduleCalendarProps) {
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    return date;
  });

  const itemsByDate = dates.map((date) => {
    const normalized = date.toISOString().slice(0, 10);
    const items = bookings.filter((booking) =>
      booking.bookingDate.startsWith(normalized),
    );
    return { date, items };
  });

  return (
    <section className="rounded-4xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-900/5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-emerald-500">
            Schedule
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Weekly calendar preview
          </h2>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {itemsByDate.map(({ date, items }) => (
          <div
            key={date.toISOString()}
            className="rounded-[1.75rem] border border-slate-200/60 bg-slate-50 p-5"
          >
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              {weekdays[date.getDay()]}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {date.getDate()}
            </p>
            <p className="text-sm text-slate-500">
              {date.toLocaleString("en-US", { month: "short" })}
            </p>
            <div className="mt-5 space-y-3">
              {items.length > 0 ? (
                items.slice(0, 2).map((booking, index) => (
                  <div
                    key={`${booking.bookingTime}-${index}`}
                    className="rounded-2xl bg-slate-900/5 p-3"
                  >
                    <p className="text-sm font-semibold text-slate-900">
                      {booking.bookingTime}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                      {booking.status.replace("_", " ")}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl bg-white/80 p-3 text-sm text-slate-500">
                  Free slot
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
