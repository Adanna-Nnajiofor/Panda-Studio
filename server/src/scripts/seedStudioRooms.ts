import dotenv from "dotenv";
import mongoose from "mongoose";
import StudioRoom from "../models/StudioRoom";

dotenv.config();

type SeedRoom = {
  name: string;
  slug: string;
  description: string;
  capacity: number;
  amenities: string[];
  basePrice: number;
  isActive: boolean;
  isFeatured: boolean;
  images: string[];
};

const seedRooms: SeedRoom[] = [
  {
    name: "Infinity Cove Soundstage",
    slug: "infinity-cove-soundstage",
    description:
      "A premium cyclorama stage designed for commercials, branded content, and fashion campaigns. Includes high-ceiling rigging points, blackout control, and isolated power circuits for quiet audio capture.",
    capacity: 18,
    amenities: [
      "White infinity cove",
      "12m lighting truss",
      "Blackout curtains",
      "Dedicated makeup corner",
      "3-phase power",
      "Air-conditioned prep zone",
    ],
    basePrice: 120000,
    isActive: true,
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1495567720989-cebdbdd97913?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1505771215590-c5fa0aec29b8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Podcast Vault",
    slug: "podcast-vault",
    description:
      "An acoustically treated podcast suite built for interviews, livestreams, and branded talk formats. Plug-and-record routing with clean monitoring for hosts and guests.",
    capacity: 6,
    amenities: [
      "Acoustic wall treatment",
      "4x dynamic broadcast mics",
      "Rodecaster workflow",
      "Live streaming uplink",
      "Guest waiting nook",
      "Mood lighting presets",
    ],
    basePrice: 55000,
    isActive: true,
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1478737270239-2f02b77fc618?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1589903308904-1010c2294adc?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Color Lab Edit Suite",
    slug: "color-lab-edit-suite",
    description:
      "A supervised post-production room for edit reviews, color sessions, and final delivery prep. Calibrated displays and controlled ambient light make this ideal for agency sign-off sessions.",
    capacity: 5,
    amenities: [
      "Dual calibrated 4K monitors",
      "DaVinci Resolve station",
      "Reference audio monitors",
      "Client review couch",
      "Fast NAS access",
      "UPS backup power",
    ],
    basePrice: 70000,
    isActive: true,
    isFeatured: true,
    images: [
      "https://images.unsplash.com/photo-1527443195645-1133f7f28990?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Daylight Loft",
    slug: "daylight-loft",
    description:
      "A natural-light creative loft with flexible furniture and wall textures for lifestyle shoots, social media sets, and creator-first campaigns.",
    capacity: 10,
    amenities: [
      "North-facing windows",
      "Movable furniture",
      "Textured backdrop walls",
      "Portable diffusion frames",
      "Styling rail",
      "Refreshment station",
    ],
    basePrice: 65000,
    isActive: true,
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1493666438817-866a91353ca9?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80",
    ],
  },
  {
    name: "Rooftop Scene Deck",
    slug: "rooftop-scene-deck",
    description:
      "An open-air rooftop setup for sunset portraits, fashion scenes, and performance snippets with skyline views and controlled access.",
    capacity: 14,
    amenities: [
      "Rooftop skyline backdrop",
      "Night practical lighting",
      "Power outlets on deck",
      "Safety rails",
      "Grip anchor points",
      "Weather canopy option",
    ],
    basePrice: 80000,
    isActive: true,
    isFeatured: false,
    images: [
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80",
    ],
  },
];

async function seed(): Promise<void> {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI is not set. Cannot run studio room seed.");
  }

  await mongoose.connect(mongoUri);

  try {
    const operations = seedRooms.map((room) => ({
      updateOne: {
        filter: { slug: room.slug },
        update: {
          $set: {
            name: room.name,
            description: room.description,
            capacity: room.capacity,
            amenities: room.amenities,
            basePrice: room.basePrice,
            isActive: room.isActive,
            isFeatured: room.isFeatured,
            images: room.images,
          },
          $setOnInsert: {
            slug: room.slug,
          },
        },
        upsert: true,
      },
    }));

    const result = await StudioRoom.bulkWrite(operations, { ordered: false });

    const featuredCount = await StudioRoom.countDocuments({
      isActive: true,
      isFeatured: true,
    });

    console.log("Studio room seed complete.");
    console.log(
      JSON.stringify(
        {
          matched: result.matchedCount,
          modified: result.modifiedCount,
          inserted: result.upsertedCount,
          activeFeaturedRooms: featuredCount,
        },
        null,
        2,
      ),
    );
  } finally {
    await mongoose.disconnect();
  }
}

seed()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Studio room seed failed:", error);
    process.exit(1);
  });
