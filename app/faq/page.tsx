"use client";

import CmsPublicPage from "../../components/CmsPublicPage";

export default function FaqPage() {
  return (
    <CmsPublicPage
      slug="faq"
      fallback={{
        title: "FAQ",
        heroTitle: "Frequently asked questions",
        heroSubtitle:
          "Common questions about studio bookings, crew hiring, equipment rentals, and payments.",
        sections: [
          {
            title: "How do I confirm a booking?",
            content:
              "Create a booking request, review pricing, and complete payment through supported gateways to confirm your slot.",
          },
          {
            title: "Can I hire crew directly?",
            content:
              "Yes. Browse crew profiles, send a hire request, and track acceptance through your dashboard.",
          },
          {
            title: "How do refunds work?",
            content:
              "Refund eligibility depends on service terms and cancellation timing. Approved refunds are processed through the original payment method.",
          },
        ],
        ctaPrimaryLabel: "Talk to support",
        ctaPrimaryHref: "/contact",
        ctaSecondaryLabel: "Start booking",
        ctaSecondaryHref: "/bookings/new",
      }}
    />
  );
}
