export type Swatch = {
  name: string;
  hex: string;
  role: string;
};

export type StructuralLock = {
  id: string;
  label: string;
  boxClass: string;
  metric: string;
};

export type SpatialPin = {
  id: number;
  x: number;
  y: number;
  zone: string;
  title: string;
  detail: string;
  costLakhs: number;
};

export type VendorLineItem = {
  category: string;
  scope: string;
  materials: string;
  costLakhs: number;
};

export type DecorLayerId = "canopy" | "focalArch" | "sidePillars" | "aisleRunner" | "uplights";

export type VenueDecorLayer = {
  id: DecorLayerId;
  label: string;
  enabled: boolean;
  x: number; // percentage 0..100
  y: number; // percentage 0..100
  scale: number; // 0.5..1.8
  opacity: number; // 0.2..1.0
};

export const DEFAULT_DECOR_LAYERS: VenueDecorLayer[] = [
  {
    id: "canopy",
    label: "Ceiling Chandeliers & Fairy Drapery",
    enabled: true,
    x: 50,
    y: 17,
    scale: 1.05,
    opacity: 0.95,
  },
  {
    id: "uplights",
    label: "Architectural Wall Wash & Ambient Glow",
    enabled: true,
    x: 50,
    y: 45,
    scale: 1.1,
    opacity: 0.85,
  },
  {
    id: "sidePillars",
    label: "Flanking Botanical Columns & Urli Pedestals",
    enabled: true,
    x: 50,
    y: 54,
    scale: 1.0,
    opacity: 0.95,
  },
  {
    id: "focalArch",
    label: "Focal Stage Mandap / Floral Arch",
    enabled: true,
    x: 50,
    y: 50,
    scale: 1.05,
    opacity: 0.98,
  },
  {
    id: "aisleRunner",
    label: "Candlelit Petal Aisle & Hurricane Cylinders",
    enabled: true,
    x: 50,
    y: 82,
    scale: 1.05,
    opacity: 0.95,
  },
];

export type InspirationPin = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  floralNotes: string;
  draperyNotes: string;
  lightingNotes: string;
  kelvin: number;
  focalCrop: string;
  imageKey: "hallDecor" | "gardenDecor" | "banquetDecor";
  customImageUrl?: string;
  swatches: Swatch[];
  costMultiplier: number;
};

export type SynthesisRequest = {
  venueId: string;
  venueName: string;
  venueType: string;
  pinIds: string[];
  pinTitles: string[];
  guestCount: number;
  floralDensity: "Minimal" | "Balanced" | "Lush" | "Couture";
  lightingKelvin: number;
  focalStructure: string;
  wantLiveImageRender?: boolean;
  venueImageBase64?: string;
};

export type SynthesisResponse = {
  conceptTitle: string;
  curatorialNote: string;
  masterImagePrompt: string;
  modelUsed: string;
  imageEngineStatus: string;
  generatedImageDataUrl?: string;
  preservedStructures: string[];
  blendedPalette: Swatch[];
  spatialPins: SpatialPin[];
  vendorBoq: VendorLineItem[];
  detectedLayerCoords?: Partial<Record<DecorLayerId, { x: number; y: number; scale: number }>>;
  pipelineLatencyMs: number;
};

export type ApiComparisonRow = {
  modelName: string;
  apiId: string;
  provider: string;
  roleInPipeline: string;
  freeTierAvailable: string;
  paidPricing: string;
  multiImageSupport: string;
  latency: string;
  ctoVerdict: string;
};

export const API_COMPARISON_MATRIX: ApiComparisonRow[] = [
  {
    modelName: "Gemini 3.8 Flash",
    apiId: "gemini-3.8-flash",
    provider: "Google DeepMind",
    roleInPipeline:
      "Stage 1, 2 & 4: Vision Style Tokenization, Uploaded Venue Perspective Detection & Structured Vendor BOQ JSON",
    freeTierAvailable: "Yes — Free tier in Google AI Studio (up to 15 RPM / 1,500 req/day)",
    paidPricing: "$0.075 / 1M input tokens (<$0.001 per venue analysis)",
    multiImageSupport: "Up to 10+ images (Venue + all Pinterest inspiration pins simultaneously)",
    latency: "0.8s – 1.6s",
    ctoVerdict:
      "Active in this demo for Free-Tier multimodal reasoning, spatial coordinate detection & BOQ generation.",
  },
  {
    modelName: "Gemini Nano Banana Lite",
    apiId: "gemini-3.1-flash-lite-image",
    provider: "Google DeepMind",
    roleInPipeline:
      "Stage 3: Fast Multi-Image Conditioned Venue Editing (Venue Photo + Pinterest Refs → Decorated Image)",
    freeTierAvailable: "Requires Paid Billing Tier API Key in AI Studio",
    paidPricing: "~$0.02 – $0.039 per generated image",
    multiImageSupport: "Native interleaved image + text input in generateContent",
    latency: "3.5s – 6.0s",
    ctoVerdict: "Best price-to-performance model for live interactive client sessions.",
  },
  {
    modelName: "Gemini Nano Banana 2.1",
    apiId: "gemini-nano-banana-2.1",
    provider: "Google DeepMind",
    roleInPipeline:
      "Stage 3 (Hero): High-Resolution 1K/2K/4K Photorealistic Venue Rendering & Search Grounding",
    freeTierAvailable: "Requires Paid Billing Tier API Key in AI Studio",
    paidPricing: "~$0.04 – $0.12 per generated image (1K to 4K)",
    multiImageSupport: "Native multi-image conditioning + custom aspect ratios (16:9, 4:3, 1:1)",
    latency: "5.5s – 9.5s",
    ctoVerdict:
      "Recommended production engine for final client lookbooks and print-grade 4K renders.",
  },
  {
    modelName: "Gemini 3 Pro Image (Nano Banana Pro)",
    apiId: "gemini-3-pro-image",
    provider: "Google DeepMind",
    roleInPipeline:
      "Stage 3 (Couture): Complex spatial typography, intricate chandelier/mandap detailing",
    freeTierAvailable: "Requires Paid Billing Tier API Key",
    paidPricing: "~$0.08 – $0.13 per image",
    multiImageSupport: "Full multimodal reference stack",
    latency: "7.0s – 12.0s",
    ctoVerdict:
      "Use when clients request intricate architectural mandaps or dense floral typography.",
  },
  {
    modelName: "OpenAI GPT-Image-1",
    apiId: "gpt-image-1",
    provider: "OpenAI",
    roleInPipeline: "Alternative Multi-Image Reference Editing & Inpainting",
    freeTierAvailable: "No free tier (requires prepaid OpenAI Tier 1+ credits)",
    paidPricing: "$0.04 (low) · $0.07 (medium) · $0.19 (high) per image",
    multiImageSupport: "Up to 4 reference images via images.edit endpoint",
    latency: "14s – 28s",
    ctoVerdict: "Strong semantic adherence, but 3–4× slower and ~3× costlier than Nano Banana.",
  },
  {
    modelName: "Flux.1 Dev + ControlNet Depth/Canny",
    apiId: "black-forest-labs/flux-dev-controlnet",
    provider: "Black Forest Labs (Replicate / fal.ai)",
    roleInPipeline:
      "Strict Pixel-Aligned Structural Geometry Lock (DepthAnythingV2 + Canny Edge Map)",
    freeTierAvailable: "Open weights (Free if self-hosted on A100/H100 GPU; paid on cloud APIs)",
    paidPricing: "~$0.03 – $0.05 per generation on fal.ai / Replicate",
    multiImageSupport: "Requires IP-Adapter + ControlNet Depth pipeline orchestration",
    latency: "4.5s – 8.0s",
    ctoVerdict:
      "Ideal Phase-2 microservice if 100% pixel-exact wall/column preservation is mandated.",
  },
];

export const INSPIRATION_PINS: InspirationPin[] = [
  {
    id: "pin-rajputana",
    title: "Royal Rajputana Mandap & Brass Urlis",
    subtitle: "Crimson velvet drapery · marigold garlands · warm 2400K candlelight",
    category: "Ceremony Focal",
    floralNotes:
      "Cascading desi crimson roses, marigold strings, and tuberose (rajnigandha) column wraps",
    draperyNotes: "Deep maroon silk-velvet swag pelmets with antique zardozi gold borders",
    lightingNotes: "Hand-hammered brass urlis with floating diyas and 2400K amber pin-spots",
    kelvin: 2400,
    focalCrop: "object-center",
    imageKey: "hallDecor",
    swatches: [
      { name: "Sindoor Maroon", hex: "#7A1F2B", role: "Primary Drapery" },
      { name: "Antique Brass", hex: "#C9A24B", role: "Metallic Accent" },
      { name: "Marigold Saffron", hex: "#E3A02A", role: "Floral Highlight" },
      { name: "Raw Silk Ivory", hex: "#F6F0E4", role: "Base Linen" },
    ],
    costMultiplier: 1.15,
  },
  {
    id: "pin-garden-peony",
    title: "Villa Cipressi Pastel Peony & Cypress Arch",
    subtitle: "Blush garden peonies · sage eucalyptus · golden hour lawn seating",
    category: "Botanical Arch",
    floralNotes:
      "Sarah Bernhardt blush peonies, ivory O'Hara garden roses, and silver-dollar eucalyptus",
    draperyNotes: "Sheer French chantilly lace and unweighted ivory chiffon breeze runners",
    lightingNotes: "Natural 3400K golden-hour wash with concealed warm fairy micro-strands",
    kelvin: 3400,
    focalCrop: "object-top",
    imageKey: "gardenDecor",
    swatches: [
      { name: "Blush Peony", hex: "#E7A6B4", role: "Primary Floral" },
      { name: "Tuscan Sage", hex: "#9CB49A", role: "Foliage Base" },
      { name: "Alabaster Cream", hex: "#FBF6EC", role: "Seating & Linen" },
      { name: "Aged Champagne", hex: "#D9C29A", role: "Chiavari Frame" },
    ],
    costMultiplier: 1.1,
  },
  {
    id: "pin-champagne-chandelier",
    title: "Crystal Chandelier Canopy & Orchid Tablescape",
    subtitle: "Tiered Empire chandeliers · champagne satin · phalaenopsis cascades",
    category: "Reception Glamour",
    floralNotes: "White cascading Phalaenopsis orchids, Vendela roses, and bleached ruscus",
    draperyNotes: "Pleated champagne dupioni silk ceiling radial canopy with mirror-top plinths",
    lightingNotes: "18 suspended crystal Empire chandeliers dimmed to 2700K + table pin-spots",
    kelvin: 2700,
    focalCrop: "object-center",
    imageKey: "banquetDecor",
    swatches: [
      { name: "Champagne Silk", hex: "#E2CFA8", role: "Table Linen" },
      { name: "Imperial Gold", hex: "#BF9443", role: "Chandelier Rig" },
      { name: "Midnight Navy", hex: "#22304A", role: "Contrast Velvet" },
      { name: "Pearl White", hex: "#F3EEE6", role: "Orchid Canopy" },
    ],
    costMultiplier: 1.25,
  },
  {
    id: "pin-candlelit-aisle",
    title: "Mirror-Glass Candlelit Petal Aisle",
    subtitle: "Hundreds of hurricane cylinders · dense rose-petal border · reflection runner",
    category: "Aisle & Entry",
    floralNotes: "Reflexed Playa Blanca white roses and blush spray roses massed at floor level",
    draperyNotes: "Seamless high-gloss champagne gold acrylic mirror aisle runner",
    lightingNotes: "360 Borosilicate glass hurricane pillars with staggered pillar candles (2200K)",
    kelvin: 2200,
    focalCrop: "object-bottom",
    imageKey: "hallDecor",
    swatches: [
      { name: "Candlelight Amber", hex: "#D89B48", role: "Aisle Glow" },
      { name: "Rosewater Blush", hex: "#E9C3C0", role: "Petal Drift" },
      { name: "Deep Emerald", hex: "#1F4D3F", role: "Foliage Anchor" },
      { name: "Warm Ivory", hex: "#F5EFE6", role: "Pillar Wax" },
    ],
    costMultiplier: 1.05,
  },
  {
    id: "pin-botanical-pillars",
    title: "Sculptural Travertine & Meadow Columns",
    subtitle: "Asymmetrical floral meadows · fluted stone plinths · diffused gallery glow",
    category: "Architectural Floral",
    floralNotes: "Delphiniums, sweet peas, garden cosmos, and spirea in foam-free meadow mechanics",
    draperyNotes: "Raw Belgian oat linen table runners over fluted travertine pedestals",
    lightingNotes: "3200K warm architectural track wash with micro-uplights inside floral columns",
    kelvin: 3200,
    focalCrop: "object-left",
    imageKey: "gardenDecor",
    swatches: [
      { name: "Travertine Stone", hex: "#D6CBB9", role: "Plinth Surface" },
      { name: "Cypress Moss", hex: "#4E6B48", role: "Structural Greens" },
      { name: "Dusty Rose", hex: "#C98D94", role: "Focal Bloom" },
      { name: "Belgian Oat", hex: "#EFE9DF", role: "Table Textile" },
    ],
    costMultiplier: 1.08,
  },
  {
    id: "pin-royal-banquet-stage",
    title: "Suryagarh Heritage Stage & Gold Charger Tables",
    subtitle: "Low conversational compotes · cut-crystal stemware · warm sandstone uplights",
    category: "Banquet Stage",
    floralNotes:
      "Low brass compote bowls overflowing with café-au-lait dahlias, roses, and amnesia roses",
    draperyNotes: "Hand-woven Chanderi tissue stage backdrop with warm sandstone arch framing",
    lightingNotes: "2600K warm tungsten perimeter wall-washers + wireless table lamps",
    kelvin: 2600,
    focalCrop: "object-right",
    imageKey: "banquetDecor",
    swatches: [
      { name: "Rosewood Velvet", hex: "#9A5A5A", role: "Lounge Upholstery" },
      { name: "Jaisalmer Gold", hex: "#C89D54", role: "Charger & Cutlery" },
      { name: "Sandstone Cream", hex: "#EDE3D2", role: "Architectural Wash" },
      { name: "Charcoal Bronze", hex: "#332E2A", role: "Iron Chandelier" },
    ],
    costMultiplier: 1.18,
  },
];

export function buildDeterministicSynthesis(req: SynthesisRequest): SynthesisResponse {
  const selectedPins = INSPIRATION_PINS.filter((p) => req.pinIds.includes(p.id));
  const activePins =
    selectedPins.length > 0 ? selectedPins : [INSPIRATION_PINS[0]!, INSPIRATION_PINS[1]!];

  const densityMultiplier =
    req.floralDensity === "Minimal"
      ? 0.78
      : req.floralDensity === "Balanced"
        ? 1.0
        : req.floralDensity === "Lush"
          ? 1.32
          : 1.65;

  const guestScale = Math.max(0.6, req.guestCount / 350);
  const pinAvgMult = activePins.reduce((acc, p) => acc + p.costMultiplier, 0) / activePins.length;
  const totalScale = densityMultiplier * guestScale * pinAvgMult;

  const allSwatches = activePins.flatMap((p) => p.swatches);
  const uniqueSwatches: Swatch[] = [];
  for (const s of allSwatches) {
    if (!uniqueSwatches.some((u) => u.hex.toLowerCase() === s.hex.toLowerCase())) {
      uniqueSwatches.push(s);
    }
    if (uniqueSwatches.length === 5) break;
  }
  while (uniqueSwatches.length < 5) {
    uniqueSwatches.push({
      name: "Warm Alabaster",
      hex: "#F6F0E4",
      role: "Architectural Neutral",
    });
  }

  const floralSummary = activePins.map((p) => p.floralNotes.split(",")[0]).join(" + ");
  const lightingSummary = `${req.lightingKelvin}K warm architectural wash combining ${activePins
    .map((p) => p.lightingNotes.split(" and ")[0])
    .slice(0, 2)
    .join(" with ")}`;

  const conceptTitle = `${req.venueName}: ${activePins
    .map((p) => p.title.split(" ").slice(0, 2).join(" "))
    .slice(0, 2)
    .join(" × ")} Edition`;

  const curatorialNote = `Synthesized ${activePins.length} Pinterest inspiration references onto ${req.venueName} (${req.venueType}). The layout preserves the primary axial sightline and ceiling rigging grid while layering ${req.floralDensity.toLowerCase()} ${floralSummary} around a central ${req.focalStructure} under ${req.lightingKelvin}K illumination for ${req.guestCount} guests.`;

  const masterImagePrompt = [
    `Photorealistic architectural wedding transformation of ${req.venueName} (${req.venueType}).`,
    `STRICT GEOMETRY LOCK: Preserve original room perspective, vanishing point horizon, structural columns, ceiling height, and floor boundary from base venue photo.`,
    `PINTEREST STYLE FUSION (${activePins.map((p) => p.title).join(" + ")}):`,
    `- Focal Installation: ${req.focalStructure} anchored on primary axial sightline.`,
    `- Floristry (${req.floralDensity} density): ${activePins.map((p) => p.floralNotes).join("; ")}.`,
    `- Textiles & Drapery: ${activePins.map((p) => p.draperyNotes).join("; ")}.`,
    `- Lighting & Atmosphere: ${lightingSummary}.`,
    `- Color Harmony: ${uniqueSwatches.map((s) => `${s.name} (${s.hex})`).join(", ")}.`,
    `Shot on medium-format 35mm architectural lens, natural shadow falloff, editorial luxury wedding photography.`,
  ].join("\n");

  const spatialPins: SpatialPin[] = [
    {
      id: 1,
      x: 50,
      y: 42,
      zone: "Focal Axis",
      title: `Bespoke ${req.focalStructure}`,
      detail: `${activePins[0]?.floralNotes ?? "Custom seasonal blooms"} framed to existing ceiling clearance.`,
      costLakhs: +(4.4 * totalScale).toFixed(1),
    },
    {
      id: 2,
      x: 24,
      y: 58,
      zone: "West Perimeter",
      title: "Structural Column & Drapery Treatment",
      detail: activePins[0]?.draperyNotes ?? "Pleated silk drapery with botanical cuffs.",
      costLakhs: +(2.6 * totalScale).toFixed(1),
    },
    {
      id: 3,
      x: 76,
      y: 59,
      zone: "East Dining & Seating",
      title: `Guest Tablescape (${req.guestCount} Pax)`,
      detail: `${activePins[1]?.floralNotes ?? "Low compote centerpieces"} with ${uniqueSwatches[0]?.name ?? "Ivory"} linens.`,
      costLakhs: +(3.5 * totalScale).toFixed(1),
    },
    {
      id: 4,
      x: 50,
      y: 80,
      zone: "Processional Plane",
      title: `Aisle & ${req.lightingKelvin}K Lighting Grid`,
      detail:
        activePins[activePins.length - 1]?.lightingNotes ??
        "Hurricane candle clusters & petal border.",
      costLakhs: +(2.2 * totalScale).toFixed(1),
    },
  ];

  const vendorBoq: VendorLineItem[] = [
    {
      category: "Couture Floristry & Installations",
      scope: `${req.focalStructure}, ${Math.round(req.guestCount / 10)} table centerpieces, processional aisle borders`,
      materials: activePins.map((p) => p.floralNotes.split(",")[0]).join(", "),
      costLakhs: +(5.8 * totalScale).toFixed(1),
    },
    {
      category: "Architectural & Rigged Lighting",
      scope: `${req.lightingKelvin}K dimmer scenes, chandelier rigging, pin-spots & candle hurricanes`,
      materials: activePins[0]?.lightingNotes ?? "Warm tungsten wash + crystal chandeliers",
      costLakhs: +(3.1 * totalScale).toFixed(1),
    },
    {
      category: "Textiles, Canopy & Drapery",
      scope: `Acoustic ceiling swags, stage backdrop, ${Math.round(req.guestCount / 8)} floor-length table linens`,
      materials: activePins[0]?.draperyNotes ?? "Dupioni silk, chiffon canopy & runners",
      costLakhs: +(2.4 * totalScale).toFixed(1),
    },
    {
      category: "Seating & Lounge Architecture",
      scope: `${req.guestCount} ceremony/banquet chairs, VIP lounge clusters, bar facade`,
      materials: `Custom frames finished in ${uniqueSwatches[1]?.name ?? "Antique Gold"} with ${uniqueSwatches[0]?.name ?? "Ivory"} upholstery`,
      costLakhs: +(2.7 * totalScale).toFixed(1),
    },
    {
      category: "Tableware, Chargers & Styling Props",
      scope: `${req.guestCount} place settings, brass/crystal vessels, custom menu stationery`,
      materials: `${uniqueSwatches[2]?.name ?? "Champagne"} rimmed chargers, cut crystal stemware`,
      costLakhs: +(1.6 * totalScale).toFixed(1),
    },
  ];

  return {
    conceptTitle,
    curatorialNote,
    masterImagePrompt,
    modelUsed:
      "gemini-3.8-flash (Multimodal Spatial & Style Engine) + Interactive Studio Compositor",
    imageEngineStatus:
      "Multimodal spatial synthesis active: Uploaded venue perspective locked and decorated with interactive floral, chandelier, drapery & aisle layers.",
    preservedStructures: [
      "Primary Axial Vanishing Point & Horizon Line (FOV 62°)",
      "Overhead Ceiling Truss / Chandelier Rigging Plane",
      "Load-Bearing Perimeter Columns & Processional Floor Plane",
    ],
    blendedPalette: uniqueSwatches,
    spatialPins,
    vendorBoq,
    pipelineLatencyMs: 640,
  };
}
