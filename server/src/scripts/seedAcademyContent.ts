import dotenv from "dotenv";
import { connectDB } from "../config/db";
import CourseCategory from "../models/CourseCategory";
import Course from "../models/Course";
import CourseModule from "../models/CourseModule";
import Lesson from "../models/Lesson";
import MembershipPlan from "../models/MembershipPlan";

dotenv.config();

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

type SeedCourse = {
  title: string;
  summary: string;
  description: string;
  categorySlug: string;
  level: "beginner" | "intermediate" | "advanced";
  pricingType: "free" | "paid" | "membership";
  price: number;
  currency: string;
  instructorName: string;
  tags: string[];
  modules: Array<{ title: string; lessons: string[] }>;
};

const categories = [
  {
    name: "Equipment Training",
    slug: "equipment-training",
    description:
      "Hands-on camera, lighting, audio, and gear operation courses.",
    order: 1,
  },
  {
    name: "Studio Training",
    slug: "studio-training",
    description:
      "In-studio production workflows for shoots, podcasts, and streaming.",
    order: 2,
  },
  {
    name: "Production Training",
    slug: "production-training",
    description:
      "Creative and technical production skills from script to post.",
    order: 3,
  },
  {
    name: "Business Courses",
    slug: "business-courses",
    description:
      "Freelance, pricing, proposal, and client-facing business skills.",
    order: 4,
  },
  {
    name: "Safety Courses",
    slug: "safety-courses",
    description:
      "Set safety, regulations, and equipment handling best practices.",
    order: 5,
  },
];

const courses: SeedCourse[] = [
  {
    title: "Sony FX6 Masterclass",
    summary:
      "Master Sony FX6 menus, codecs, color profiles, and real production setups.",
    description:
      "A practical Panda Academy flagship course for cinematographers and operators using the Sony FX6 in studio and location work.",
    categorySlug: "equipment-training",
    level: "intermediate",
    pricingType: "paid",
    price: 15000,
    currency: "NGN",
    instructorName: "Tolu Akin",
    tags: ["sony", "camera", "cinematography"],
    modules: [
      {
        title: "Introduction and Setup",
        lessons: [
          "FX6 body overview",
          "Media and power workflow",
          "Menu architecture",
        ],
      },
      {
        title: "Image and Recording",
        lessons: [
          "Codecs and frame rates",
          "S-Cinetone and S-Log3",
          "Monitoring and exposure",
        ],
      },
      {
        title: "Production Workflow",
        lessons: [
          "Run-and-gun setup",
          "Interview setup",
          "Data backup routine",
        ],
      },
    ],
  },
  {
    title: "Canon C70 Fundamentals",
    summary:
      "Build confidence operating Canon C70 for social campaigns and branded shoots.",
    description:
      "Learn practical setup, autofocus behavior, and recording options with Panda Studio camera standards.",
    categorySlug: "equipment-training",
    level: "beginner",
    pricingType: "paid",
    price: 12000,
    currency: "NGN",
    instructorName: "Tolu Akin",
    tags: ["canon", "camera"],
    modules: [
      {
        title: "Getting Started",
        lessons: ["Body controls", "Card and battery setup", "Project presets"],
      },
      {
        title: "Shooting Essentials",
        lessons: [
          "Exposure and white balance",
          "Autofocus tips",
          "Audio input setup",
        ],
      },
      {
        title: "Delivery",
        lessons: ["File management", "Basic LUT workflow", "Export checks"],
      },
    ],
  },
  {
    title: "RED Cinema Camera Workflow",
    summary: "Professional RED workflows from prep to post and color handoff.",
    description:
      "Designed for high-end production teams managing RAW and color-sensitive projects.",
    categorySlug: "equipment-training",
    level: "advanced",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["red", "raw", "postproduction"],
    modules: [
      {
        title: "Camera Prep",
        lessons: [
          "Media planning",
          "Sensor calibration",
          "Metadata discipline",
        ],
      },
      {
        title: "On-Set Execution",
        lessons: [
          "Monitoring chain",
          "Exposure strategy",
          "Backup verification",
        ],
      },
      {
        title: "Post Integration",
        lessons: [
          "Proxy generation",
          "Color pipeline",
          "Client review workflows",
        ],
      },
    ],
  },
  {
    title: "DJI Drone Operation for Productions",
    summary:
      "Safe and cinematic drone operation tailored to commercial shoots.",
    description:
      "Covering setup, flight planning, legal checks, and shot choreography.",
    categorySlug: "equipment-training",
    level: "intermediate",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Kelechi Duru",
    tags: ["drone", "dji", "safety"],
    modules: [
      {
        title: "Pre-Flight",
        lessons: [
          "Regulations and permits",
          "Battery strategy",
          "Weather checks",
        ],
      },
      {
        title: "Flight Control",
        lessons: ["Cinematic moves", "Safety boundaries", "Emergency handling"],
      },
      {
        title: "Post and Delivery",
        lessons: [
          "Footage management",
          "Color consistency",
          "Client-ready selects",
        ],
      },
    ],
  },
  {
    title: "Lighting Equipment Essentials",
    summary:
      "Core lighting gear operation for studio and on-location productions.",
    description:
      "An essential foundation for lighting assistants and creators.",
    categorySlug: "equipment-training",
    level: "beginner",
    pricingType: "free",
    price: 0,
    currency: "NGN",
    instructorName: "Nneka Umeh",
    tags: ["lighting", "equipment"],
    modules: [
      {
        title: "Gear Basics",
        lessons: ["Light types", "Modifiers", "Power options"],
      },
      {
        title: "Setup",
        lessons: ["Three-point setup", "Soft lighting", "Practical balancing"],
      },
      {
        title: "Troubleshooting",
        lessons: ["Color cast fixes", "Flicker prevention", "Safety checks"],
      },
    ],
  },
  {
    title: "Studio Lighting Mastery",
    summary:
      "Build premium lighting looks for interviews, products, and portraits.",
    description:
      "A practical studio-lighting system from setup templates to brand matching.",
    categorySlug: "studio-training",
    level: "intermediate",
    pricingType: "paid",
    price: 18000,
    currency: "NGN",
    instructorName: "Nneka Umeh",
    tags: ["studio", "lighting"],
    modules: [
      {
        title: "Foundations",
        lessons: [
          "Mood and contrast",
          "Key-fill-rim strategy",
          "Light shaping",
        ],
      },
      {
        title: "Use Cases",
        lessons: [
          "Interview scenes",
          "Product table setup",
          "Fashion portraits",
        ],
      },
      {
        title: "Optimization",
        lessons: [
          "Fast reset workflow",
          "Color consistency",
          "Team communication",
        ],
      },
    ],
  },
  {
    title: "Green Screen Production",
    summary:
      "Shoot cleaner keys with better lighting, framing, and post handoff.",
    description:
      "Avoid common green-screen mistakes and speed up post-production keying.",
    categorySlug: "studio-training",
    level: "intermediate",
    pricingType: "paid",
    price: 14000,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["green-screen", "studio"],
    modules: [
      {
        title: "Pre-Production",
        lessons: ["Wardrobe restrictions", "Set layout", "Camera distance"],
      },
      {
        title: "Lighting and Capture",
        lessons: ["Screen uniformity", "Subject separation", "Motion control"],
      },
      {
        title: "Post Handoff",
        lessons: ["Clean plate capture", "VFX notes", "Client previews"],
      },
    ],
  },
  {
    title: "Podcast Production Blueprint",
    summary:
      "Plan, shoot, and publish professional podcast episodes in studio.",
    description:
      "From multi-mic setup and camera switching to audio cleanup and distribution.",
    categorySlug: "studio-training",
    level: "beginner",
    pricingType: "free",
    price: 0,
    currency: "NGN",
    instructorName: "Kelechi Duru",
    tags: ["podcast", "audio", "studio"],
    modules: [
      {
        title: "Studio Setup",
        lessons: ["Mic placement", "Headphone routing", "Camera framing"],
      },
      {
        title: "Recording",
        lessons: ["Host prep checklist", "Live monitoring", "Backup capture"],
      },
      {
        title: "Post",
        lessons: ["Audio cleanup", "Episode packaging", "Publishing checklist"],
      },
    ],
  },
  {
    title: "Multi-Camera Live Streaming",
    summary:
      "Run reliable multi-camera live streams for events and brand activations.",
    description:
      "Practical signal flow, switching, and backup strategies for uninterrupted streaming.",
    categorySlug: "studio-training",
    level: "advanced",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["live-stream", "switching", "studio"],
    modules: [
      {
        title: "System Design",
        lessons: ["Signal map", "Encoder choices", "Network planning"],
      },
      {
        title: "Live Execution",
        lessons: ["Switching rhythm", "Audio monitoring", "Scene backups"],
      },
      {
        title: "Recovery",
        lessons: ["Failover plan", "Redundant capture", "Post-event review"],
      },
    ],
  },
  {
    title: "Directing for Social Campaigns",
    summary:
      "Direct short-form campaigns with clear story beats and production pace.",
    description:
      "A director-oriented playbook for social-first brand campaigns.",
    categorySlug: "production-training",
    level: "intermediate",
    pricingType: "paid",
    price: 16000,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["directing", "social"],
    modules: [
      {
        title: "Creative Prep",
        lessons: ["Brief interpretation", "Shot intention", "Talent prep"],
      },
      {
        title: "On Set",
        lessons: [
          "Blocking quickly",
          "Performance direction",
          "Coverage strategy",
        ],
      },
      {
        title: "Review",
        lessons: ["Selects strategy", "Revision loops", "Delivery confidence"],
      },
    ],
  },
  {
    title: "Cinematography Foundations",
    summary:
      "Core principles of framing, movement, and light for narrative clarity.",
    description:
      "A foundational cinematography track for emerging DPs and operators.",
    categorySlug: "production-training",
    level: "beginner",
    pricingType: "free",
    price: 0,
    currency: "NGN",
    instructorName: "Tolu Akin",
    tags: ["cinematography", "camera"],
    modules: [
      {
        title: "Frame Language",
        lessons: [
          "Composition basics",
          "Lens storytelling",
          "Movement purpose",
        ],
      },
      {
        title: "Lighting",
        lessons: ["Quality of light", "Practicals", "Night setups"],
      },
      {
        title: "Production Discipline",
        lessons: [
          "Slate and metadata",
          "Continuity",
          "Client monitor communication",
        ],
      },
    ],
  },
  {
    title: "Colour Grading for Brand Films",
    summary: "Build consistent, premium color looks for commercial projects.",
    description:
      "Color workflow from on-set profile choices to final delivery LUT matching.",
    categorySlug: "production-training",
    level: "advanced",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["color", "grading", "post"],
    modules: [
      {
        title: "Prep",
        lessons: [
          "Color-managed setup",
          "Reference stills",
          "Shot matching plan",
        ],
      },
      {
        title: "Primary Grade",
        lessons: [
          "Balance and contrast",
          "Skin tone control",
          "Highlight recovery",
        ],
      },
      {
        title: "Look Development",
        lessons: ["Brand look creation", "Export transforms", "QC checklist"],
      },
    ],
  },
  {
    title: "Editing for Speed and Story",
    summary:
      "Edit efficiently while maintaining emotional clarity and campaign goals.",
    description:
      "A practical editing workflow for social and commercial deliverables.",
    categorySlug: "production-training",
    level: "intermediate",
    pricingType: "paid",
    price: 13000,
    currency: "NGN",
    instructorName: "Kelechi Duru",
    tags: ["editing", "post"],
    modules: [
      {
        title: "Assembly",
        lessons: [
          "Media organization",
          "Rough cut strategy",
          "Pacing baseline",
        ],
      },
      {
        title: "Refinement",
        lessons: ["B-roll rhythm", "Audio polish", "Graphics handoff"],
      },
      {
        title: "Delivery",
        lessons: [
          "Multi-format exports",
          "Caption workflow",
          "Client approvals",
        ],
      },
    ],
  },
  {
    title: "Motion Graphics for Producers",
    summary:
      "Create practical motion assets that support storytelling and branding.",
    description:
      "Producer-friendly graphics workflows for lower thirds, titles, and animated callouts.",
    categorySlug: "production-training",
    level: "intermediate",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Nneka Umeh",
    tags: ["motion-graphics", "design"],
    modules: [
      {
        title: "Design Prep",
        lessons: ["Brand kit setup", "Hierarchy rules", "Template planning"],
      },
      {
        title: "Animation",
        lessons: ["Timing basics", "Easing choices", "Reusable presets"],
      },
      {
        title: "Integration",
        lessons: ["Edit handoff", "Version management", "Final output checks"],
      },
    ],
  },
  {
    title: "How to Price Creative Services",
    summary:
      "Price projects sustainably with transparent structure and margin awareness.",
    description:
      "A business-critical course for freelancers, crews, and small studios.",
    categorySlug: "business-courses",
    level: "beginner",
    pricingType: "free",
    price: 0,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["pricing", "business"],
    modules: [
      {
        title: "Foundations",
        lessons: ["Cost types", "Profit buffers", "Scope clarity"],
      },
      {
        title: "Quoting",
        lessons: ["Rate cards", "Packaging offers", "Change requests"],
      },
      {
        title: "Negotiation",
        lessons: [
          "Handling objections",
          "Value framing",
          "Closing confidently",
        ],
      },
    ],
  },
  {
    title: "Freelancing for Production Professionals",
    summary:
      "Build a stable freelance pipeline with repeat clients and better project systems.",
    description:
      "Practical client acquisition and operations for production freelancers.",
    categorySlug: "business-courses",
    level: "beginner",
    pricingType: "paid",
    price: 11000,
    currency: "NGN",
    instructorName: "Mina Ibe",
    tags: ["freelancing", "clients"],
    modules: [
      {
        title: "Positioning",
        lessons: ["Niche selection", "Portfolio narrative", "Offer clarity"],
      },
      {
        title: "Sales",
        lessons: ["Lead channels", "Discovery calls", "Proposal conversion"],
      },
      {
        title: "Operations",
        lessons: ["Contracts", "Invoicing habits", "Retention strategy"],
      },
    ],
  },
  {
    title: "Proposal Writing for Media Projects",
    summary:
      "Write compelling proposals that win production work and reduce revision cycles.",
    description:
      "Proposal frameworks for agencies, startups, and enterprise clients.",
    categorySlug: "business-courses",
    level: "intermediate",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Ada Okafor",
    tags: ["proposal", "business"],
    modules: [
      {
        title: "Structure",
        lessons: ["Executive summary", "Scope framing", "Timeline logic"],
      },
      {
        title: "Financials",
        lessons: ["Line-item clarity", "Payment terms", "Revision policy"],
      },
      {
        title: "Presentation",
        lessons: ["Visual formatting", "Client Q&A prep", "Follow-up cadence"],
      },
    ],
  },
  {
    title: "Set Safety Essentials",
    summary:
      "Essential safety routines for all production staff and crew members.",
    description:
      "Core safety protocol for pre-production, on-set operations, and wrap-down.",
    categorySlug: "safety-courses",
    level: "beginner",
    pricingType: "free",
    price: 0,
    currency: "NGN",
    instructorName: "Kelechi Duru",
    tags: ["safety", "set"],
    modules: [
      {
        title: "Preparation",
        lessons: ["Risk checklist", "Team briefing", "Emergency contacts"],
      },
      {
        title: "On Set",
        lessons: ["Cable safety", "Heat management", "Crowd control"],
      },
      {
        title: "After Action",
        lessons: ["Incident logs", "Debrief notes", "Process improvement"],
      },
    ],
  },
  {
    title: "Electrical Safety for Studio Teams",
    summary:
      "Prevent electrical hazards in studio setups and location power distribution.",
    description:
      "A practical electrical safety course for production environments.",
    categorySlug: "safety-courses",
    level: "intermediate",
    pricingType: "membership",
    price: 0,
    currency: "NGN",
    instructorName: "Kelechi Duru",
    tags: ["safety", "electrical"],
    modules: [
      {
        title: "Power Basics",
        lessons: ["Load calculation", "Circuit planning", "Grounding checks"],
      },
      {
        title: "Studio Application",
        lessons: ["Distribution boxes", "Cable routing", "Surge protection"],
      },
      {
        title: "Response",
        lessons: [
          "Fault isolation",
          "Equipment shutdown",
          "Incident escalation",
        ],
      },
    ],
  },
  {
    title: "Drone Regulations and Compliance",
    summary:
      "Understand local drone compliance requirements for commercial productions.",
    description:
      "Legal and safety requirements for drone operations in professional projects.",
    categorySlug: "safety-courses",
    level: "intermediate",
    pricingType: "paid",
    price: 9000,
    currency: "NGN",
    instructorName: "Ada Okafor",
    tags: ["drone", "compliance"],
    modules: [
      {
        title: "Regulatory Foundations",
        lessons: ["Permit pathways", "No-fly zones", "Privacy policies"],
      },
      {
        title: "Operational Planning",
        lessons: ["Flight logs", "Insurance basics", "Client disclosures"],
      },
      {
        title: "Audit Readiness",
        lessons: [
          "Documentation pack",
          "Incident reporting",
          "Renewal planning",
        ],
      },
    ],
  },
];

const membershipPlans = [
  {
    code: "PRO",
    name: "Pro",
    description: "Premium course access with certificates and resources.",
    price: 10000,
    currency: "NGN",
    interval: "monthly" as const,
    features: ["Premium courses", "Certificates", "Downloadable resources"],
    isActive: true,
    isPublic: true,
  },
  {
    code: "STUDIO",
    name: "Studio Membership",
    description: "Everything in Pro plus production ecosystem perks.",
    price: 20000,
    currency: "NGN",
    interval: "monthly" as const,
    features: [
      "Everything in Pro",
      "Booking discounts",
      "Equipment rental discounts",
      "Priority support",
    ],
    isActive: true,
    isPublic: true,
  },
];

async function seed() {
  await connectDB();

  const categoryMap = new Map<string, string>();

  for (const c of categories) {
    const category = await CourseCategory.findOneAndUpdate(
      { slug: c.slug },
      {
        $set: {
          name: c.name,
          slug: c.slug,
          description: c.description,
          order: c.order,
          isActive: true,
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    categoryMap.set(c.slug, String(category._id));
  }

  for (const p of membershipPlans) {
    await MembershipPlan.findOneAndUpdate(
      { code: p.code },
      { $set: p },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
  }

  for (const c of courses) {
    const categoryId = categoryMap.get(c.categorySlug);
    if (!categoryId) continue;

    const courseSlug = slugify(c.title);
    const course = await Course.findOneAndUpdate(
      { slug: courseSlug },
      {
        $set: {
          title: c.title,
          slug: courseSlug,
          summary: c.summary,
          description: c.description,
          category: categoryId,
          level: c.level,
          pricingType: c.pricingType,
          price: c.price,
          currency: c.currency,
          instructorName: c.instructorName,
          tags: c.tags,
          isPublished: true,
          publishedAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );

    for (
      let moduleIndex = 0;
      moduleIndex < c.modules.length;
      moduleIndex += 1
    ) {
      const moduleSeed = c.modules[moduleIndex];
      const moduleDoc = await CourseModule.findOneAndUpdate(
        { course: course._id, title: moduleSeed.title },
        {
          $set: {
            course: course._id,
            title: moduleSeed.title,
            order: moduleIndex + 1,
            isPublished: true,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );

      for (
        let lessonIndex = 0;
        lessonIndex < moduleSeed.lessons.length;
        lessonIndex += 1
      ) {
        const lessonTitle = moduleSeed.lessons[lessonIndex];
        await Lesson.findOneAndUpdate(
          {
            course: course._id,
            module: moduleDoc._id,
            slug: slugify(lessonTitle),
          },
          {
            $set: {
              course: course._id,
              module: moduleDoc._id,
              title: lessonTitle,
              slug: slugify(lessonTitle),
              order: lessonIndex + 1,
              isPreview: lessonIndex === 0,
              isPublished: true,
              durationMinutes: 8 + lessonIndex * 4,
            },
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
      }
    }
  }

  const [
    courseCount,
    categoryCount,
    moduleCount,
    lessonCount,
    membershipPlanCount,
  ] = await Promise.all([
    Course.countDocuments({}),
    CourseCategory.countDocuments({}),
    CourseModule.countDocuments({}),
    Lesson.countDocuments({}),
    MembershipPlan.countDocuments({}),
  ]);

  console.log("✅ Academy content seeded successfully");
  console.log(
    `Categories: ${categoryCount}, Courses: ${courseCount}, Modules: ${moduleCount}, Lessons: ${lessonCount}, Membership plans: ${membershipPlanCount}`,
  );
  process.exit(0);
}

seed().catch((error) => {
  console.error("Academy seed failed", error);
  process.exit(1);
});
