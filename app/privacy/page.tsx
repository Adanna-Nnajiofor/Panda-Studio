"use client";

import CmsPublicPage from "../../components/CmsPublicPage";

export default function PrivacyPage() {
  return (
    <CmsPublicPage
      slug="privacy"
      fallback={{
        title: "Privacy",
        heroTitle: "Privacy policy",
        heroSubtitle:
          "Panda Studio protects account, booking, project, and communication data used on the platform.",
        sections: [
          {
            title: "Data we collect",
            bullets: [
              "Account and profile information",
              "Booking, payment, and invoice records",
              "Project files and communication metadata",
            ],
          },
          {
            title: "How we use data",
            content:
              "We use data to deliver services, secure accounts, prevent abuse, and improve production workflow reliability.",
          },
          {
            title: "Security",
            content:
              "Security controls include hashed passwords, role-based permissions, session controls, and audit-relevant activity tracking.",
          },
        ],
        ctaPrimaryLabel: "Ask a privacy question",
        ctaPrimaryHref: "/contact",
        ctaSecondaryLabel: "View terms",
        ctaSecondaryHref: "/terms",
      }}
    />
  );
}
