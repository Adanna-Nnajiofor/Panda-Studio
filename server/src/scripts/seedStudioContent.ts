import dotenv from "dotenv";
import { connectDB } from "../config/db";
import BlogPost from "../models/BlogPost";
import Event from "../models/Event";
import Portfolio from "../models/Portfolio";
import Quote from "../models/Quote";
import User from "../models/User";

dotenv.config();

const password = "PandaStudio2024!";

async function upsertUser(input: {
  fullName: string;
  email: string;
  role: "client" | "crew" | "staff" | "admin" | "super_admin";
  department?: string;
  position?: string;
  bio?: string;
  availability?: "available" | "busy" | "on_project" | "offline";
  avatar?: string;
  phone?: string;
  isActive?: boolean;
  approvalStatus?: "pending" | "approved" | "rejected" | "suspended";
  isApproved?: boolean;
}) {
  const existing = await User.findOne({ email: input.email.toLowerCase() });
  if (existing) {
    const updated = await User.findByIdAndUpdate(
      existing._id,
      {
        $set: {
          ...input,
          email: input.email.toLowerCase(),
          isActive: input.isActive ?? true,
          approvalStatus: input.approvalStatus ?? "approved",
          isApproved: input.isApproved ?? true,
        },
      },
      { new: true, runValidators: true },
    );
    return updated!;
  }

  return User.create({
    ...input,
    email: input.email.toLowerCase(),
    password,
    isActive: input.isActive ?? true,
    approvalStatus: input.approvalStatus ?? "approved",
    isApproved: input.isApproved ?? true,
  });
}

async function upsertPortfolio(userId: string, data: Record<string, unknown>) {
  return Portfolio.findOneAndUpdate(
    { user: userId },
    { $set: { user: userId, ...data } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertBlogPost(data: Record<string, unknown>) {
  const slug = typeof data.slug === "string" ? data.slug : "";
  return BlogPost.findOneAndUpdate(
    { slug },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertEvent(data: Record<string, unknown>) {
  const title = typeof data.title === "string" ? data.title : "";
  return Event.findOneAndUpdate(
    { title },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function upsertQuote(data: Record<string, unknown>) {
  const referenceNumber =
    typeof data.referenceNumber === "string" ? data.referenceNumber : "";
  return Quote.findOneAndUpdate(
    { referenceNumber },
    { $set: data },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
}

async function seed() {
  await connectDB();

  const admin = await upsertUser({
    fullName: "Mina Ibe",
    email: "mina@pandastudio.ng",
    role: "admin",
    department: "Studio Leadership",
    position: "Founder & Creative Director",
    bio: "Panda Studio founder shaping brand stories through production and strategy.",
    availability: "available",
    avatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    phone: "+2348031112233",
    isActive: true,
    approvalStatus: "approved",
    isApproved: true,
  });

  const client = await upsertUser({
    fullName: "Ada Okafor",
    email: "ada@pandastudio.ng",
    role: "client",
    department: "Brand",
    position: "Marketing Lead",
    bio: "Client partner focused on elevated campaigns and launch-ready content.",
    availability: "available",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80",
    phone: "+2348092223344",
    isActive: true,
    approvalStatus: "approved",
    isApproved: true,
  });

  const crewMembers = await Promise.all([
    upsertUser({
      fullName: "Tolu Akin",
      email: "tolu@pandastudio.ng",
      role: "crew",
      department: "Camera",
      position: "Director of Photography",
      bio: "Visual storyteller with a cinematic eye for fashion, music videos, and branded content.",
      availability: "available",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      phone: "+2348053334455",
      isActive: true,
      approvalStatus: "approved",
      isApproved: true,
    }),
    upsertUser({
      fullName: "Nneka Umeh",
      email: "nneka@pandastudio.ng",
      role: "crew",
      department: "Production Design",
      position: "Art Director",
      bio: "Conceptual designer crafting immersive sets and polished on-screen worlds.",
      availability: "on_project",
      avatar:
        "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=400&q=80",
      phone: "+2348064445566",
      isActive: true,
      approvalStatus: "approved",
      isApproved: true,
    }),
    upsertUser({
      fullName: "Kelechi Duru",
      email: "kelechi@pandastudio.ng",
      role: "crew",
      department: "Sound",
      position: "Sound Engineer",
      bio: "Audio specialist known for crisp dialogue, premium music mixes, and podcast-ready clarity.",
      availability: "available",
      avatar:
        "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80",
      phone: "+2348075556677",
      isActive: true,
      approvalStatus: "approved",
      isApproved: true,
    }),
  ]);

  await Promise.all([
    upsertPortfolio(String(crewMembers[0]._id), {
      bio: "I build cinematic campaigns that translate ideas into visuals people remember.",
      showreelUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      isPublic: true,
      specialties: ["Cinematography", "Music Videos", "Commercials"],
      experienceYears: 9,
      hourlyRate: 180000,
      location: "Lagos, Nigeria",
      website: "https://pandastudio.ng",
      socialLinks: [
        { platform: "Instagram", url: "https://instagram.com/pandastudio" },
      ],
      items: [
        {
          title: "Astra Launch",
          description: "A high-energy launch film for a luxury skincare brand.",
          mediaUrl:
            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
          type: "image",
          tags: ["Brand", "Film"],
          views: 242,
          isFeatured: true,
        },
      ],
    }),
    upsertPortfolio(String(crewMembers[1]._id), {
      bio: "I design worlds that make every frame feel intentional and premium.",
      showreelUrl: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
      isPublic: true,
      specialties: ["Production Design", "Set Styling", "Art Direction"],
      experienceYears: 7,
      hourlyRate: 150000,
      location: "Abuja, Nigeria",
      website: "https://pandastudio.ng",
      socialLinks: [
        { platform: "Instagram", url: "https://instagram.com/pandastudio" },
      ],
      items: [
        {
          title: "House of Noon",
          description: "Luxury set design for a fashion editorial campaign.",
          mediaUrl:
            "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
          type: "image",
          tags: ["Editorial", "Set"],
          views: 186,
          isFeatured: true,
        },
      ],
    }),
    upsertPortfolio(String(crewMembers[2]._id), {
      bio: "I make every voice, room tone, and mix feel cinematic and clean.",
      showreelUrl: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
      isPublic: true,
      specialties: ["Podcast Audio", "Mixing", "Sound Design"],
      experienceYears: 6,
      hourlyRate: 120000,
      location: "Lagos, Nigeria",
      website: "https://pandastudio.ng",
      socialLinks: [
        { platform: "Instagram", url: "https://instagram.com/pandastudio" },
      ],
      items: [
        {
          title: "The Quiet Room",
          description: "Immersive audio treatment for a documentary series.",
          mediaUrl:
            "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1200&q=80",
          type: "image",
          tags: ["Audio", "Documentary"],
          views: 143,
          isFeatured: true,
        },
      ],
    }),
  ]);

  await Promise.all([
    upsertBlogPost({
      title: "How we built a premium launch set in 72 hours",
      slug: "how-we-built-a-premium-launch-set-in-72-hours",
      excerpt:
        "A behind-the-scenes look at the timeline, team choreography, and styling choices that made a last-minute shoot feel effortless.",
      content:
        "The Panda Studio team transformed a raw warehouse into a polished launch environment in just 72 hours. We balanced practical production needs with a luxury finish, which made the final content feel bigger than the space itself.",
      author: admin._id,
      coverImage:
        "https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1200&q=80",
      tags: ["Behind the Scenes", "Production Design"],
      category: "behind_the_scenes",
      isPublished: true,
      publishedAt: new Date("2026-06-18T10:00:00.000Z"),
      views: 182,
    }),
    upsertBlogPost({
      title: "The 5 camera choices that elevate everyday content",
      slug: "the-5-camera-choices-that-elevate-everyday-content",
      excerpt:
        "A practical guide to choosing lenses, movement, and lighting setups that make everyday campaigns feel cinematic.",
      content:
        "The difference between ordinary and elevated content often comes down to a few locked-in choices: composition, lens selection, timing, and light. We break down what matters most.",
      author: admin._id,
      coverImage:
        "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
      tags: ["Tutorial", "Cinematography"],
      category: "tutorial",
      isPublished: true,
      publishedAt: new Date("2026-06-22T09:30:00.000Z"),
      views: 121,
    }),
    upsertBlogPost({
      title: "Why premium brands are returning to in-person storytelling",
      slug: "why-premium-brands-are-returning-to-in-person-storytelling",
      excerpt:
        "As digital fatigue grows, audiences are responding to real, tactile production more than polished but impersonal content.",
      content:
        "In-person storytelling gives brands a chance to create energy, spontaneity, and human connection that is hard to fake online. That has become our strongest differentiator.",
      author: admin._id,
      coverImage:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80",
      tags: ["News", "Branding"],
      category: "news",
      isPublished: true,
      publishedAt: new Date("2026-06-28T14:15:00.000Z"),
      views: 97,
    }),
  ]);

  await Promise.all([
    upsertEvent({
      title: "Studio Open Day: Lighting & Motion Lab",
      description:
        "Visit our Lagos studio for a guided walkthrough, live demos, and direct access to our camera and lighting setups.",
      type: "open_day",
      host: admin._id,
      coverImage:
        "https://images.unsplash.com/photo-1517602302552-471fe67acf66?auto=format&fit=crop&w=1200&q=80",
      date: new Date("2026-07-18T10:00:00.000Z"),
      endDate: new Date("2026-07-18T16:00:00.000Z"),
      durationMinutes: 360,
      location: "Panda Studio, Lekki Phase 1",
      isVirtual: false,
      maxAttendees: 75,
      price: 0,
      currency: "NGN",
      isPublished: true,
      tags: ["Open House", "Creative Community"],
    }),
    upsertEvent({
      title: "Masterclass: Directing for Social Content",
      description:
        "A practical masterclass on planning, framing, and directing short-form content that actually converts.",
      type: "masterclass",
      host: admin._id,
      coverImage:
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
      date: new Date("2026-07-25T12:00:00.000Z"),
      endDate: new Date("2026-07-25T15:00:00.000Z"),
      durationMinutes: 180,
      location: "Virtual Studio Link",
      isVirtual: true,
      virtualLink: "https://meet.google.com/abc-defg-hij",
      maxAttendees: 120,
      price: 15000,
      currency: "NGN",
      isPublished: true,
      tags: ["Masterclass", "Content"],
    }),
  ]);

  await Promise.all([
    upsertQuote({
      client: client._id,
      createdBy: admin._id,
      referenceNumber: "QT-ALPHA-001",
      items: [
        {
          description: "Creative strategy workshop",
          unitPrice: 120000,
          quantity: 1,
          subtotal: 120000,
        },
        {
          description: "2-day production package",
          unitPrice: 450000,
          quantity: 1,
          subtotal: 450000,
        },
      ],
      subtotal: 570000,
      discount: 25000,
      tax: 28500,
      total: 572500,
      currency: "NGN",
      status: "sent",
      validUntil: new Date("2026-08-15T00:00:00.000Z"),
      notes: "Includes editing turnaround within 5 business days.",
    }),
    upsertQuote({
      client: client._id,
      createdBy: admin._id,
      referenceNumber: "QT-ALPHA-002",
      items: [
        {
          description: "Brand storytelling reel",
          unitPrice: 280000,
          quantity: 1,
          subtotal: 280000,
        },
        {
          description: "Social content batch",
          unitPrice: 90000,
          quantity: 3,
          subtotal: 270000,
        },
      ],
      subtotal: 550000,
      discount: 0,
      tax: 27500,
      total: 577500,
      currency: "NGN",
      status: "accepted",
      validUntil: new Date("2026-08-01T00:00:00.000Z"),
      notes: "Approved for launch week coverage.",
    }),
  ]);

  console.log("✅ Studio content seeded successfully");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed", error);
  process.exit(1);
});
