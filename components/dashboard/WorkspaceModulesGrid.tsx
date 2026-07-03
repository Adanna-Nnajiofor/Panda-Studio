import Link from "next/link";

type WorkspaceModule = {
  href: string;
  title: string;
  description: string;
  badge: string;
};

const modules: WorkspaceModule[] = [
  {
    href: "/projects",
    title: "Projects",
    description: "Track finalized deliverables, approvals, and shared assets.",
    badge: "Deliverables",
  },
  {
    href: "/timeline",
    title: "Timeline",
    description: "Follow milestones, deadlines, and production progress.",
    badge: "Planning",
  },
  {
    href: "/moodboard",
    title: "Mood Boards",
    description:
      "Collect references, palettes, and inspiration for each shoot.",
    badge: "Creative",
  },
  {
    href: "/discover",
    title: "Discover Crew",
    description: "Browse and hire the right production talent for the job.",
    badge: "Talent",
  },
  {
    href: "/hire/mine",
    title: "Hire Requests",
    description: "Manage incoming and outgoing collaboration requests.",
    badge: "Ops",
  },
  {
    href: "/quotes",
    title: "Quotes",
    description: "Review proposals and keep client pricing aligned.",
    badge: "Finance",
  },
  {
    href: "/invoices",
    title: "Invoices",
    description: "Monitor billing, payments, and payment status.",
    badge: "Billing",
  },
  {
    href: "/referrals",
    title: "Referrals",
    description: "Grow your studio network and reward successful referrals.",
    badge: "Growth",
  },
  {
    href: "/events",
    title: "Events",
    description:
      "Join workshops, masterclasses, and studio networking sessions.",
    badge: "Community",
  },
  {
    href: "/blog",
    title: "Blog",
    description: "Read studio insights, production tips, and updates.",
    badge: "Insights",
  },
  {
    href: "/studio-map",
    title: "Studio Map",
    description: "Explore the studio layout, spaces, and facilities.",
    badge: "Visit",
  },
  {
    href: "/ai",
    title: "AI Tools",
    description:
      "Turn scripts into breakdowns and generate ready-to-use contracts.",
    badge: "AI",
  },
];

export default function WorkspaceModulesGrid() {
  return (
    <section className="border-4 border-black bg-white p-5 shadow-[8px_8px_0_0_#000]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-gray-500">
            Studio workspace
          </p>
          <h2 className="mt-1 text-2xl font-black uppercase">
            Everything in one place
          </h2>
        </div>
        <p className="max-w-xl text-sm text-gray-600">
          Use these modules to run the full production lifecycle from booking to
          delivery.
        </p>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="group border-2 border-black bg-[#f8efe1] p-4 transition-transform hover:-translate-y-1 hover:bg-[#f2eadf]"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="border border-black px-2 py-0.5 text-[0.6rem] font-black uppercase tracking-[0.18em]">
                {module.badge}
              </span>
              <span className="text-sm font-black transition-transform group-hover:translate-x-1">
                →
              </span>
            </div>
            <h3 className="mt-3 text-lg font-black uppercase">
              {module.title}
            </h3>
            <p className="mt-2 text-sm text-gray-700">{module.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
