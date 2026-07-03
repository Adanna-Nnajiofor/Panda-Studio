"use client";

import CmsPublicPage from "../../components/CmsPublicPage";

export default function TermsPage() {
  return (
    <CmsPublicPage
      slug="terms"
      fallback={{
        title: "Terms",
        heroTitle: "Terms and conditions",
        heroSubtitle:
          "These terms govern your use of Panda Studio services, bookings, rentals, and digital workflows.",
        sections: [
          {
            title: "Bookings and payments",
            content:
              "Bookings are confirmed only after payment validation. Deposits, refunds, and rescheduling are subject to agreed service terms.",
          },
          {
            title: "User responsibilities",
            bullets: [
              "Provide accurate profile and project information",
              "Respect call times and equipment return timelines",
              "Use the platform lawfully and professionally",
            ],
          },
          {
            title: "Intellectual property",
            content:
              "Ownership and usage rights follow project-specific contracts and explicit client-crew agreements.",
          },
        ],
        ctaPrimaryLabel: "Contact support",
        ctaPrimaryHref: "/contact",
        ctaSecondaryLabel: "View privacy policy",
        ctaSecondaryHref: "/privacy",
      }}
    />
  );
}
