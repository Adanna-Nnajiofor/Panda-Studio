/**
 * Seeds the full Panda Studio catalog — services and equipment.
 *
 * Run from the server folder:
 *   npx ts-node src/scripts/seedStudioCatalog.ts
 *
 * Safe to re-run — uses upsert so existing records are updated, not duplicated.
 */
import dotenv from 'dotenv';
import { connectDB } from '../config/db';
import Service from '../models/Service';
import Equipment from '../models/Equipment';

dotenv.config();

// ─── Services ─────────────────────────────────────────────────────────────────

const services = [
  // Photography
  { name: 'Portrait Photography', slug: 'portrait-photography', description: 'Professional studio portraits and headshots for individuals and teams.', basePrice: 85000, durationInHours: 2 },
  { name: 'Product Photography', slug: 'product-photography', description: 'High-quality e-commerce and catalog product shoots.', basePrice: 120000, durationInHours: 4 },
  { name: 'Branding Shoot', slug: 'branding-shoot', description: 'Brand visuals, team photography, and corporate identity shoots.', basePrice: 200000, durationInHours: 6 },
  { name: 'Event Coverage', slug: 'event-coverage', description: 'Professional photography and videography coverage for events.', basePrice: 250000, durationInHours: 8 },

  // Video Production
  { name: 'Music Video Production', slug: 'music-video', description: 'Full concept-to-delivery music video production package.', basePrice: 450000, durationInHours: 8 },
  { name: 'Commercial & Ad Shoot', slug: 'commercial-ad-shoot', description: 'Professional commercial and advertisement video production.', basePrice: 380000, durationInHours: 8 },
  { name: 'Documentary Production', slug: 'documentary', description: 'Documentary planning, filming, and production day.', basePrice: 350000, durationInHours: 10 },
  { name: 'Corporate Media Production', slug: 'corporate-media', description: 'Corporate videos, training content, and internal communications.', basePrice: 300000, durationInHours: 6 },
  { name: 'YouTube Production Session', slug: 'youtube-production', description: 'Full YouTube video production — filming, lighting, and audio.', basePrice: 95000, durationInHours: 3 },
  { name: 'Vlog Session', slug: 'vlog-session', description: 'Studio vlog recording session with professional setup.', basePrice: 60000, durationInHours: 2 },

  // Audio & Podcast
  { name: 'Podcast Recording Session', slug: 'podcast-recording', description: 'Multi-mic podcast recording session in a professional studio.', basePrice: 95000, durationInHours: 3 },
  { name: 'Voice-Over Recording', slug: 'voice-over-recording', description: 'Professional voice-over recording for ads, films, and content.', basePrice: 75000, durationInHours: 2 },
  { name: 'Talk Show Production', slug: 'talk-show-production', description: 'Full talk show production with multi-camera setup.', basePrice: 280000, durationInHours: 6 },

  // Live & Streaming
  { name: 'Live Streaming Session', slug: 'live-streaming', description: 'Professional live streaming setup and broadcast management.', basePrice: 150000, durationInHours: 4 },

  // Post Production
  { name: 'Video Editing & Post-Production', slug: 'video-editing', description: 'Professional video editing, colour grading, and delivery.', basePrice: 120000, durationInHours: 8 },
  { name: 'Motion Graphics & Animation', slug: 'motion-graphics', description: 'Custom motion graphics, animations, and visual effects.', basePrice: 180000, durationInHours: 10 },

  // Content & Social Media
  { name: 'Social Media Content Creation', slug: 'social-media-content', description: 'Batch content creation for Instagram, TikTok, and other platforms.', basePrice: 150000, durationInHours: 5 },
  { name: 'Content Creation Session', slug: 'content-creation', description: 'General content creation session for digital platforms.', basePrice: 80000, durationInHours: 3 },

  // Writing & Strategy
  { name: 'Script Writing', slug: 'script-writing', description: 'Professional script writing for films, ads, and productions.', basePrice: 100000, durationInHours: 0 },

  // Studio Rental
  { name: 'Studio Rehearsal Session', slug: 'studio-rehearsal', description: 'Studio space rental for rehearsals and practice sessions.', basePrice: 50000, durationInHours: 3 },
  { name: 'Film Production Day', slug: 'film-production', description: 'Full film production day with crew and equipment.', basePrice: 600000, durationInHours: 12 },
];

// ─── Equipment ────────────────────────────────────────────────────────────────

const equipment = [
  // Cameras
  { name: 'Sony FX6 Cinema Kit', type: 'Cameras', description: 'Full-frame cinema camera with lenses and accessories.', hourlyRate: 25000, quantity: 2 },
  { name: 'Sony A7S III', type: 'Cameras', description: 'Mirrorless camera ideal for low-light and video.', hourlyRate: 15000, quantity: 3 },
  { name: 'Canon EOS R5', type: 'Cameras', description: 'High-resolution mirrorless camera for photo and video.', hourlyRate: 18000, quantity: 2 },
  { name: 'Blackmagic Pocket 6K', type: 'Cameras', description: 'Compact cinema camera with RAW recording.', hourlyRate: 20000, quantity: 2 },

  // Lenses
  { name: 'Sony 24-70mm f/2.8 GM', type: 'Lenses', description: 'Professional standard zoom lens.', hourlyRate: 8000, quantity: 3 },
  { name: 'Canon 50mm f/1.2L', type: 'Lenses', description: 'Fast prime lens for portraits and low light.', hourlyRate: 6000, quantity: 2 },
  { name: 'Sigma 18-35mm f/1.8 Art', type: 'Lenses', description: 'Wide-angle zoom with fast aperture.', hourlyRate: 7000, quantity: 2 },

  // Lighting
  { name: 'Aputure 600D Pro', type: 'Lighting', description: 'High-output LED key light with Bowens mount.', hourlyRate: 8000, quantity: 4 },
  { name: 'Aputure 300X Bi-Color', type: 'Lighting', description: 'Bi-color LED panel for versatile lighting setups.', hourlyRate: 6000, quantity: 4 },
  { name: 'Godox SL200W', type: 'Lighting', description: 'Continuous LED studio light.', hourlyRate: 4000, quantity: 6 },
  { name: 'Softbox Kit (90x120cm)', type: 'Lighting', description: 'Large softbox for soft, diffused lighting.', hourlyRate: 2000, quantity: 4 },
  { name: 'RGB LED Panel Set', type: 'Lighting', description: 'Colour RGB LED panels for creative lighting.', hourlyRate: 5000, quantity: 3 },

  // Audio
  { name: 'Rode NTG5 Shotgun + Boom', type: 'Audio', description: 'Professional location sound kit with boom pole.', hourlyRate: 5000, quantity: 3 },
  { name: 'Shure SM7B Microphone', type: 'Audio', description: 'Industry-standard dynamic mic for podcasts and vocals.', hourlyRate: 4000, quantity: 4 },
  { name: 'Rode PodMic USB', type: 'Audio', description: 'USB podcast microphone for studio recording.', hourlyRate: 2500, quantity: 4 },
  { name: 'Zoom H6 Audio Recorder', type: 'Audio', description: 'Portable multi-track audio recorder.', hourlyRate: 3500, quantity: 3 },
  { name: 'Wireless Lavalier Set (Rode)', type: 'Audio', description: 'Wireless clip-on microphone system.', hourlyRate: 4500, quantity: 4 },
  { name: 'Audio Mixer (Yamaha MG10)', type: 'Audio', description: '10-channel audio mixer for live and studio use.', hourlyRate: 5000, quantity: 2 },

  // Stabilizers & Rigs
  { name: 'DJI RS3 Pro Gimbal', type: 'Gimbals', description: '3-axis motorized gimbal for smooth camera movement.', hourlyRate: 8000, quantity: 3 },
  { name: 'Zhiyun Crane 4 Gimbal', type: 'Gimbals', description: 'Professional 3-axis gimbal stabilizer.', hourlyRate: 7000, quantity: 2 },
  { name: 'Shoulder Rig Kit', type: 'Rigs', description: 'Full shoulder rig with follow focus and matte box.', hourlyRate: 6000, quantity: 2 },

  // Drones
  { name: 'DJI Mavic 3 Pro', type: 'Drones', description: 'Professional aerial drone with Hasselblad camera.', hourlyRate: 20000, quantity: 2 },
  { name: 'DJI Mini 3 Pro', type: 'Drones', description: 'Compact aerial drone for lightweight coverage.', hourlyRate: 12000, quantity: 2 },

  // Monitors
  { name: 'SmallHD 702 Touch Monitor', type: 'Monitors', description: '7-inch on-camera field monitor with touchscreen.', hourlyRate: 5000, quantity: 3 },
  { name: 'Atomos Shogun 7 Recorder', type: 'Monitors', description: '7-inch HDR monitor and recorder.', hourlyRate: 7000, quantity: 2 },

  // Tripods & Support
  { name: 'Manfrotto 504X Fluid Head + Tripod', type: 'Tripods', description: 'Professional video tripod with fluid head.', hourlyRate: 4000, quantity: 4 },
  { name: 'C-Stand Set (x3)', type: 'Tripods', description: 'Heavy-duty C-stands for lighting and accessories.', hourlyRate: 3000, quantity: 4 },

  // Streaming & Podcast
  { name: 'Elgato Stream Deck XL', type: 'Streaming', description: 'Stream controller for live productions.', hourlyRate: 3000, quantity: 2 },
  { name: 'Blackmagic ATEM Mini Pro', type: 'Streaming', description: 'Live production switcher for multi-camera streaming.', hourlyRate: 8000, quantity: 2 },

  // Storage
  { name: 'Samsung T7 SSD 2TB', type: 'Storage', description: 'Fast portable SSD for on-set data storage.', hourlyRate: 2000, quantity: 6 },
  { name: 'CFexpress Card 256GB', type: 'Storage', description: 'High-speed memory card for cinema cameras.', hourlyRate: 1500, quantity: 8 },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────

async function seed() {
  await connectDB();

  console.log('Seeding services...');
  for (const svc of services) {
    await Service.updateOne({ slug: svc.slug }, { $set: svc }, { upsert: true });
  }
  console.log(`✅ ${services.length} services seeded`);

  console.log('Seeding equipment...');
  for (const item of equipment) {
    await Equipment.updateOne({ name: item.name }, { $set: item }, { upsert: true });
  }
  console.log(`✅ ${equipment.length} equipment items seeded`);

  console.log('\n🎉 Catalog seeded successfully!');
  process.exit(0);
}

seed().catch((err) => {
  const message = (err instanceof Error ? `${err.name}: ${err.message}` : String(err))
    .replace(/[\r\n\t\0]/g, ' ')
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
    .slice(0, 500);
  console.error('[seed] Error:', message);
  process.exit(1);
});
