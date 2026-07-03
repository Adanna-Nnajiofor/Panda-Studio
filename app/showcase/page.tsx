import type { Metadata } from "next";
import ShowcaseClient from "./ShowcaseClient";

export const metadata: Metadata = {
  title: "Panda Studio Portfolio Showcase",
  description:
    "Project galleries, videos, testimonials, awards, and behind-the-scenes content from Panda Studio.",
  openGraph: {
    title: "Panda Studio Portfolio Showcase",
    description:
      "Explore Panda Studio projects, video highlights, testimonials, and production stories.",
    type: "website",
    url: "/showcase",
  },
  twitter: {
    card: "summary_large_image",
    title: "Panda Studio Portfolio Showcase",
    description:
      "Explore Panda Studio projects, video highlights, testimonials, and production stories.",
  },
};

export default function ShowcasePage() {
  return <ShowcaseClient />;
}
