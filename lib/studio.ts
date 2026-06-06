export const STUDIO_CATEGORIES = [
  {
    id: 'photo',
    title: 'Photo studio',
    description: 'Portraits, events, product shoots, and brand photography.',
    services: ['Photography sessions', 'Product photography', 'Branding shoots'],
  },
  {
    id: 'music-video',
    title: 'Music & video studio',
    description: 'Recording, mixing, podcast, vlog, and music video production.',
    services: ['Podcast recording', 'Music video production', 'Voice-over recording'],
  },
  {
    id: 'branding',
    title: 'Branding & content',
    description: 'Corporate media, social content, and campaign creative.',
    services: ['Corporate media production', 'Social media content', 'Commercial shoots'],
  },
  {
    id: 'film',
    title: 'Film production',
    description: 'Documentaries, short films, commercials, and full productions.',
    services: ['Film production', 'Documentary productions', 'Event coverage'],
  },
] as const;

export const EQUIPMENT_CATEGORIES = [
  'Cameras',
  'Lenses',
  'Lighting',
  'Audio',
  'Gimbals & stabilizers',
  'Drones',
  'Monitors',
  'Tripods & rigs',
  'Podcast gear',
  'Storage',
] as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  pre_production: 'Pre-production',
  shooting: 'Shooting',
  editing: 'Editing',
  ready_for_delivery: 'Ready for delivery',
  delivered: 'Delivered',
};
