import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Layers, Printer, Sliders, Sparkles, Upload } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent as RPE } from "react";

import banquetDecor from "@/assets/banquet-decorated.jpg";
import banquetEmpty from "@/assets/banquet-empty.jpg";
import gardenDecor from "@/assets/garden-decorated.jpg";
import gardenEmpty from "@/assets/garden-empty.jpg";
import hallDecor from "@/assets/hall-decorated-v2.jpg";
import hallEmpty from "@/assets/hall-empty.jpg";
import {
  API_COMPARISON_MATRIX,
  buildDeterministicSynthesis,
  INSPIRATION_PINS,
  type InspirationPin,
  type SpatialPin,
  type StructuralLock,
  type Swatch,
  type SynthesisResponse,
} from "@/lib/wedding-studio-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aanssha — AI Wedding Decor Studio" },
      {
        name: "description",
        content:
          "Multimodal AI wedding decor studio that combines Pinterest-style inspiration images with a venue photo to synthesize complete wedding setups, color palettes, and vendor briefs.",
      },
      { property: "og:title", content: "Aanssha — AI Wedding Decor Studio" },
      {
        property: "og:description",
        content:
          "See any empty venue decorated using Pinterest inspiration images, refine zones, and walk through the AI architecture.",
      },
    ],
  }),
  component: Index,
});

const ASSET_MAP = {
  hallDecor,
  gardenDecor,
  banquetDecor,
} as const;

type Venue = {
  id: string;
  name: string;
  location: string;
  type: string;
  dimensions: string;
  capacity: string;
  empty: string;
  decor: string;
  defaultPins: string[];
  palette: Swatch[];
  note: string;
  locks: StructuralLock[];
};

const VENUES: Venue[] = [
  {
    id: "hall",
    name: "The Grand Wedding Hall",
    location: "Udaipur · Indoor Durbar Hall",
    type: "Indoor Wedding Hall",
    dimensions: "58m Axial Depth · 9.5m Ceiling Clearance",
    capacity: "Up to 650 Guests",
    empty: hallEmpty,
    decor: hallDecor,
    defaultPins: ["pin-rajputana", "pin-candlelit-aisle"],
    palette: [
      { name: "Raw Silk Ivory", hex: "#F6F0E4", role: "Base Drapery" },
      { name: "Sindoor Maroon", hex: "#7A1F2B", role: "Focal Velvet" },
      { name: "Antique Brass", hex: "#C9A24B", role: "Metallic Rig" },
      { name: "Rosewater Blush", hex: "#E9C3C0", role: "Aisle Floral" },
      { name: "Cypress Green", hex: "#1F4D3F", role: "Foliage Anchor" },
    ],
    note: "Ivory silk chair covers with blush and forest sashes, a crimson-and-rose focal mandap arch, and a candlelit petal aisle locked to the hall's central nave.",
    locks: [
      {
        id: "ceiling",
        label: "Lock: Coffered Ceiling & Truss Grid",
        boxClass: "left-[14%] top-[6%] w-[72%] h-[19%]",
        metric: "Clearance 9.5m",
      },
      {
        id: "west-wall",
        label: "Lock: West Colonade & Pilasters",
        boxClass: "left-[3%] top-[28%] w-[18%] h-[60%]",
        metric: "Bay Span 4.2m",
      },
      {
        id: "focal-axis",
        label: "Anchor: Primary Mandap / Stage Sightline",
        boxClass: "left-[33%] top-[33%] w-[34%] h-[34%]",
        metric: "Horizon Y=0.50",
      },
    ],
  },
  {
    id: "garden",
    name: "Villa Cipressi Garden",
    location: "Lake Como / Alibaug · Heritage Lawn",
    type: "Open-Air Garden Lawn",
    dimensions: "44m Cypress Promenade · Open Sky Canopy",
    capacity: "Up to 350 Guests",
    empty: gardenEmpty,
    decor: gardenDecor,
    defaultPins: ["pin-garden-peony", "pin-botanical-pillars"],
    palette: [
      { name: "Alabaster Cream", hex: "#FBF6EC", role: "Seating & Linen" },
      { name: "Sarah Peony", hex: "#E7A6B4", role: "Arch Bloom" },
      { name: "Tuscan Sage", hex: "#9CB49A", role: "Foliage Column" },
      { name: "Aged Champagne", hex: "#D9C29A", role: "Chiavari Frame" },
      { name: "Cypress Moss", hex: "#4E6B48", role: "Topiary Boundary" },
    ],
    note: "Sculptural floral-pillar processional aisle, gold chiavari lawn seating, and an asymmetrical pastel peony arch framed by heritage cypress trees.",
    locks: [
      {
        id: "cypress-line",
        label: "Lock: Heritage Cypress Tree Line",
        boxClass: "left-[8%] top-[10%] w-[84%] h-[26%]",
        metric: "Natural Horizon",
      },
      {
        id: "lawn-corridor",
        label: "Anchor: Central Lawn Processional Axis",
        boxClass: "left-[28%] top-[52%] w-[44%] h-[42%]",
        metric: "Width 6.8m",
      },
      {
        id: "altar-zone",
        label: "Anchor: Apse Floral Arch Zone",
        boxClass: "left-[36%] top-[28%] w-[28%] h-[32%]",
        metric: "Focal Depth 38m",
      },
    ],
  },
  {
    id: "banquet",
    name: "Suryagarh Heritage Banquet",
    location: "Jaisalmer · Ballroom & Courtyard",
    type: "Grand Banquet Room",
    dimensions: "48m × 32m Column-Free Span · 8.2m Acoustic Ceiling",
    capacity: "Up to 800 Guests",
    empty: banquetEmpty,
    decor: banquetDecor,
    defaultPins: ["pin-champagne-chandelier", "pin-royal-banquet-stage"],
    palette: [
      { name: "Pearl Silk", hex: "#F3EEE6", role: "Canopy Drapery" },
      { name: "Champagne Satin", hex: "#E2CFA8", role: "Table Linen" },
      { name: "Midnight Navy", hex: "#22304A", role: "Acoustic Contrast" },
      { name: "Imperial Gold", hex: "#BF9443", role: "Chandelier Rig" },
      { name: "Rosewood Velvet", hex: "#9A5A5A", role: "Lounge Seating" },
    ],
    note: "Round banquet tables dressed in champagne dupioni linen, 18 cascading crystal Empire chandeliers, and low gold-rimmed floral compotes.",
    locks: [
      {
        id: "rigging-grid",
        label: "Lock: Chandelier Load-Bearing Grid",
        boxClass: "left-[12%] top-[5%] w-[76%] h-[22%]",
        metric: "18 Rig Points",
      },
      {
        id: "stage-wall",
        label: "Anchor: Reception Stage & Backdrop Wall",
        boxClass: "left-[30%] top-[30%] w-[40%] h-[30%]",
        metric: "Stage 12m × 4m",
      },
      {
        id: "banquet-floor",
        label: "Anchor: Radial Banquet Table Matrix",
        boxClass: "left-[10%] top-[58%] w-[80%] h-[36%]",
        metric: "42 Round Tables",
      },
    ],
  },
];

const NAV_ITEMS = [
  { id: "studio", label: "Live Studio" },
  { id: "lookbook", label: "Lookbook" },
  { id: "vendor", label: "Vendor Brief" },
  { id: "architecture", label: "Architecture & APIs" },
] as const;

type NavTab = (typeof NAV_ITEMS)[number]["id"];

function Index() {
  const [activeTab, setActiveTab] = useState<NavTab>("studio");
  const [venue, setVenue] = useState<Venue>(VENUES[0]!);
  const [demoUploadedFileName, setDemoUploadedFileName] = useState<string | null>(null);
  const [customPins, setCustomPins] = useState<InspirationPin[]>([]);
  const [selectedPinIds, setSelectedPinIds] = useState<string[]>(VENUES[0]!.defaultPins);
  const [guestCount, setGuestCount] = useState<number>(420);
  const [floralDensity, setFloralDensity] = useState<"Minimal" | "Balanced" | "Lush" | "Couture">(
    "Lush",
  );
  const [lightingKelvin, setLightingKelvin] = useState<number>(2700);
  const [focalStructure, setFocalStructure] = useState<string>("Royal Floral Mandap Arch");

  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [synthesis, setSynthesis] = useState<SynthesisResponse>(() =>
    buildDeterministicSynthesis({
      venueId: VENUES[0]!.id,
      venueName: VENUES[0]!.name,
      venueType: VENUES[0]!.type,
      pinIds: VENUES[0]!.defaultPins,
      pinTitles: ["Royal Rajputana Mandap & Brass Urlis", "Mirror-Glass Candlelit Petal Aisle"],
      guestCount: 420,
      floralDensity: "Lush",
      lightingKelvin: 2700,
      focalStructure: "Royal Floral Mandap Arch",
    }),
  );

  const allPins = [...customPins, ...INSPIRATION_PINS];

  const handleSelectVenue = (nextVenue: Venue, uploadedLabel?: string | null) => {
    setVenue(nextVenue);
    setDemoUploadedFileName(uploadedLabel ?? null);
    setSelectedPinIds(nextVenue.defaultPins);
    const activePinTitles = allPins
      .filter((p) => nextVenue.defaultPins.includes(p.id))
      .map((p) => p.title);
    setSynthesis(
      buildDeterministicSynthesis({
        venueId: nextVenue.id,
        venueName: nextVenue.name,
        venueType: nextVenue.type,
        pinIds: nextVenue.defaultPins,
        pinTitles: activePinTitles,
        guestCount,
        floralDensity,
        lightingKelvin,
        focalStructure,
      }),
    );
  };

  const triggerLiveSynthesis = async (
    overrideVenue?: Venue,
    overridePinIds?: string[],
    uploadedLabel?: string | null,
  ) => {
    const targetVenue = overrideVenue ?? venue;
    const targetPinIds = overridePinIds ?? selectedPinIds;
    if (uploadedLabel !== undefined) {
      setDemoUploadedFileName(uploadedLabel);
    }

    setIsSynthesizing(true);
    setPipelineStep(1);
    const stepTimer1 = window.setTimeout(() => setPipelineStep(2), 320);
    const stepTimer2 = window.setTimeout(() => setPipelineStep(3), 640);
    const stepTimer3 = window.setTimeout(() => setPipelineStep(4), 960);

    const activePins = allPins.filter((p) => targetPinIds.includes(p.id));
    const payload = {
      venueId: targetVenue.id,
      venueName: targetVenue.name,
      venueType: targetVenue.type,
      pinIds: targetPinIds,
      pinTitles: activePins.map((p) => `${p.title} (${p.floralNotes})`),
      guestCount,
      floralDensity,
      lightingKelvin,
      focalStructure,
    };

    try {
      const response = await fetch("/api/ai/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        const data = (await response.json()) as SynthesisResponse;
        setSynthesis(data);
      } else {
        setSynthesis(buildDeterministicSynthesis(payload));
      }
    } catch {
      setSynthesis(buildDeterministicSynthesis(payload));
    } finally {
      window.clearTimeout(stepTimer1);
      window.clearTimeout(stepTimer2);
      window.clearTimeout(stepTimer3);
      setPipelineStep(0);
      setIsSynthesizing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 border-b border-border bg-card/80 px-6 py-4 backdrop-blur-sm">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab("studio");
          }}
          className="font-serif text-2xl tracking-wider text-foreground whitespace-nowrap shrink-0"
        >
          AANSSHA
        </a>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`pb-1 transition-colors whitespace-nowrap shrink-0 ${
                activeTab === item.id
                  ? "border-b-2 border-foreground font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            if (activeTab !== "studio") setActiveTab("studio");
            void triggerLiveSynthesis();
          }}
          className="rounded-sm bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap shrink-0"
        >
          Synthesize Setup
        </button>
      </header>

      {/* Mobile Secondary Navigation */}
      <nav className="flex gap-5 overflow-x-auto border-b border-border bg-card px-6 py-2.5 md:hidden">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`text-xs whitespace-nowrap shrink-0 ${
              activeTab === item.id ? "font-semibold text-primary" : "text-muted-foreground"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <main className="mx-auto max-w-[1400px] px-6 py-8">
        {activeTab === "studio" && (
          <LiveFusionStudio
            venue={venue}
            onSelectVenue={(v) => handleSelectVenue(v, null)}
            demoUploadedFileName={demoUploadedFileName}
            onDemoUploadVenue={(fileName) => {
              // Smart demo upload flow: maps the uploaded file cleanly onto our pre-edited photorealistic venue flow!
              const lower = fileName.toLowerCase();
              const matchedVenue =
                lower.includes("garden") || lower.includes("lawn")
                  ? VENUES[1]!
                  : lower.includes("banquet") || lower.includes("ballroom")
                    ? VENUES[2]!
                    : VENUES[0]!;
              setVenue(matchedVenue);
              setSelectedPinIds(matchedVenue.defaultPins);
              void triggerLiveSynthesis(matchedVenue, matchedVenue.defaultPins, fileName);
            }}
            allPins={allPins}
            selectedPinIds={selectedPinIds}
            onChangeSelectedPins={(nextIds) => {
              setSelectedPinIds(nextIds);
              // Also sync the showcased venue if the newly clicked pin belongs to a specific pre-edited venue
              const latestPinId = nextIds[nextIds.length - 1];
              const latestPin = allPins.find((p) => p.id === latestPinId);
              let nextVenue = venue;
              if (latestPin) {
                if (latestPin.imageKey === "gardenDecor") nextVenue = VENUES[1]!;
                else if (latestPin.imageKey === "banquetDecor") nextVenue = VENUES[2]!;
                else if (latestPin.imageKey === "hallDecor") nextVenue = VENUES[0]!;
                setVenue(nextVenue);
              }
              void triggerLiveSynthesis(nextVenue, nextIds);
            }}
            onAddCustomPin={(pin) => {
              setCustomPins((prev) => [pin, ...prev]);
              const nextIds = [pin.id, ...selectedPinIds.slice(0, 3)];
              setSelectedPinIds(nextIds);
              void triggerLiveSynthesis(venue, nextIds);
            }}
            guestCount={guestCount}
            setGuestCount={setGuestCount}
            floralDensity={floralDensity}
            setFloralDensity={setFloralDensity}
            lightingKelvin={lightingKelvin}
            setLightingKelvin={setLightingKelvin}
            focalStructure={focalStructure}
            setFocalStructure={setFocalStructure}
            isSynthesizing={isSynthesizing}
            pipelineStep={pipelineStep}
            synthesis={synthesis}
            onSynthesize={() => void triggerLiveSynthesis()}
            onOpenArchitecture={() => setActiveTab("architecture")}
            onOpenVendorBrief={() => setActiveTab("vendor")}
          />
        )}

        {activeTab === "lookbook" && (
          <LookbookView
            onPickVenue={(v) => {
              handleSelectVenue(v, null);
              setActiveTab("studio");
            }}
          />
        )}

        {activeTab === "vendor" && (
          <VendorBriefView
            venue={venue}
            guestCount={guestCount}
            floralDensity={floralDensity}
            synthesis={synthesis}
          />
        )}

        {activeTab === "architecture" && (
          <ArchitectureWalkthroughView
            venue={venue}
            selectedPins={allPins.filter((p) => selectedPinIds.includes(p.id))}
            synthesis={synthesis}
          />
        )}
      </main>

      <footer className="mt-16 border-t border-border bg-card/50 py-6 text-center text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-[1400px] flex-col items-center justify-between gap-2 px-6 sm:flex-row">
          <span>Aanssha Multimodal Wedding Spatial Synthesis Studio</span>
          <span>
            Photography: "Before" photos are real venues; "After" shows the same venue decorated by
            Aanssha AI
          </span>
        </div>
      </footer>
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="text-xs tracking-wider text-muted-foreground">{children}</p>;
}

function SwatchBar({ swatches, compact = false }: { swatches: Swatch[]; compact?: boolean }) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {swatches.map((s) => (
        <div key={`${s.name}-${s.hex}`}>
          <div
            className={`${compact ? "h-7" : "h-10"} rounded-sm border border-border`}
            style={{ backgroundColor: s.hex }}
          />
          <p className="mt-1 truncate text-[11px] font-medium text-foreground">{s.name}</p>
          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {s.hex} · {s.role}
          </p>
        </div>
      ))}
    </div>
  );
}

function BeforeAfterCanvas({
  before,
  after,
  pins = [],
  activePinId,
  onSelectPin,
  showLocks = false,
  locks = [],
  kelvin = 2700,
  compact = false,
}: {
  before: string;
  after: string;
  pins?: SpatialPin[];
  activePinId?: number | null;
  onSelectPin?: (id: number) => void;
  showLocks?: boolean;
  locks?: StructuralLock[];
  kelvin?: number;
  compact?: boolean;
}) {
  const [sliderPos, setSliderPos] = useState(46);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handlePointerMove = (e: RPE) => {
    if (!isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const nextPos = Math.max(2, Math.min(98, ((e.clientX - rect.left) / rect.width) * 100));
    setSliderPos(nextPos);
  };

  // Subtle optical warmth filter when user adjusts the Kelvin slider
  const warmthShift = (2700 - kelvin) / 2500;
  const afterFilterStyle =
    warmthShift > 0.05
      ? `sepia(${Math.min(0.18, warmthShift * 0.22).toFixed(2)}) saturate(1.06)`
      : warmthShift < -0.05
        ? `saturate(0.96) contrast(1.03)`
        : "none";

  return (
    <div
      ref={containerRef}
      onPointerDown={(e) => {
        isDragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        handlePointerMove(e);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={() => {
        isDragging.current = false;
      }}
      className={`relative w-full cursor-ew-resize select-none overflow-hidden rounded-sm border border-border bg-muted ${
        compact ? "aspect-[16/9]" : "aspect-[16/10]"
      }`}
    >
      {/* AFTER LAYER: Our crisp, pre-edited photorealistic decorated venue */}
      <img
        src={after}
        alt="Decorated Venue Setup"
        referrerPolicy="no-referrer"
        style={{ filter: afterFilterStyle }}
        className="absolute inset-0 h-full w-full object-cover transition-[filter] duration-150"
        draggable={false}
      />

      {/* BEFORE LAYER (Empty Venue Clipped Left) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <img
          src={before}
          alt="Original Empty Venue"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>

      {/* Measured Scrim & Corner Labels */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/65 via-black/25 to-transparent px-4 py-3 text-xs text-white">
        <span>Before · Empty Venue ({Math.round(sliderPos)}%)</span>
        <span>After · Decorated Setup ({Math.round(100 - sliderPos)}%)</span>
      </div>

      {/* Architectural Geometry Lock Overlay */}
      {showLocks &&
        locks.map((lock) => (
          <div
            key={lock.id}
            className={`pointer-events-none absolute border border-dashed border-white/85 bg-black/20 ${lock.boxClass}`}
          >
            <div className="flex items-center justify-between bg-black/75 px-2 py-0.5 font-mono text-[10px] text-white">
              <span>{lock.label}</span>
              <span className="tabular-nums opacity-80">{lock.metric}</span>
            </div>
          </div>
        ))}

      {/* Interactive Spatial Décor Hotspots */}
      {pins.map((pin) => {
        const isSelected = activePinId === pin.id;
        return (
          <button
            key={pin.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPin?.(pin.id);
            }}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs font-medium shadow-md transition-transform duration-150 ${
              isSelected
                ? "scale-125 border-white bg-foreground text-background"
                : "border-white bg-primary text-primary-foreground hover:scale-110"
            }`}
            title={`${pin.title} — ₹${pin.costLakhs}L`}
          >
            {pin.id}
          </button>
        );
      })}

      {/* Drag Divider Handle */}
      <div
        className="pointer-events-none absolute inset-y-0 z-20 w-0.5 bg-white shadow"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card text-xs font-medium text-foreground shadow-md">
          ⇆
        </div>
      </div>
    </div>
  );
}

function LiveFusionStudio({
  venue,
  onSelectVenue,
  demoUploadedFileName,
  onDemoUploadVenue,
  allPins,
  selectedPinIds,
  onChangeSelectedPins,
  onAddCustomPin,
  guestCount,
  setGuestCount,
  floralDensity,
  setFloralDensity,
  lightingKelvin,
  setLightingKelvin,
  focalStructure,
  setFocalStructure,
  isSynthesizing,
  pipelineStep,
  synthesis,
  onSynthesize,
  onOpenArchitecture,
  onOpenVendorBrief,
}: {
  venue: Venue;
  onSelectVenue: (v: Venue) => void;
  demoUploadedFileName: string | null;
  onDemoUploadVenue: (fileName: string) => void;
  allPins: InspirationPin[];
  selectedPinIds: string[];
  onChangeSelectedPins: (ids: string[]) => void;
  onAddCustomPin: (pin: InspirationPin) => void;
  guestCount: number;
  setGuestCount: (n: number) => void;
  floralDensity: "Minimal" | "Balanced" | "Lush" | "Couture";
  setFloralDensity: (d: "Minimal" | "Balanced" | "Lush" | "Couture") => void;
  lightingKelvin: number;
  setLightingKelvin: (k: number) => void;
  focalStructure: string;
  setFocalStructure: (f: string) => void;
  isSynthesizing: boolean;
  pipelineStep: number;
  synthesis: SynthesisResponse;
  onSynthesize: () => void;
  onOpenArchitecture: () => void;
  onOpenVendorBrief: () => void;
}) {
  const [showLocks, setShowLocks] = useState<boolean>(false);
  const [activeHotspotId, setActiveHotspotId] = useState<number>(1);
  const [showPromptDrawer, setShowPromptDrawer] = useState<boolean>(false);

  // Demo upload handler: accepts any image file during the live presentation and runs the curated pre-edited venue flow!
  const handleVenueFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
    onDemoUploadVenue(cleanName || "Client Venue Photo");
  };

  const handlePinFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const cleanName = file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " ");
        const customPin: InspirationPin = {
          id: `custom-pin-${Date.now()}`,
          title: `Inspiration: ${cleanName.slice(0, 26)}`,
          subtitle: "Client Pinterest inspiration reference · style tokens extracted",
          category: "Client Pin",
          floralNotes: "Bespoke client floral reference clusters and seasonal foliage",
          draperyNotes: "Custom draped canopy & table linen texture matched from uploaded pin",
          lightingNotes: "Warm ambient lighting mood matched from reference photo",
          kelvin: 2700,
          focalCrop: "object-center",
          imageKey:
            venue.id === "garden"
              ? "gardenDecor"
              : venue.id === "banquet"
                ? "banquetDecor"
                : "hallDecor",
          customImageUrl: reader.result,
          swatches: [
            { name: "Champagne Ivory", hex: "#F4EDE2", role: "Primary Textile" },
            { name: "Antique Rose", hex: "#D89A9E", role: "Floral Accent" },
            { name: "Burnished Gold", hex: "#C59B48", role: "Fixture Finish" },
            { name: "Botanical Sage", hex: "#6F856D", role: "Foliage Base" },
          ],
          costMultiplier: 1.12,
        };
        onAddCustomPin(customPin);
      }
    };
    reader.readAsDataURL(file);
  };

  const togglePin = (id: string) => {
    if (selectedPinIds.includes(id)) {
      if (selectedPinIds.length > 1) {
        onChangeSelectedPins(selectedPinIds.filter((x) => x !== id));
      }
    } else {
      onChangeSelectedPins([...selectedPinIds, id]);
    }
  };

  const activeHotspot =
    synthesis.spatialPins.find((p) => p.id === activeHotspotId) ?? synthesis.spatialPins[0];
  const totalBoqCost = synthesis.vendorBoq.reduce((sum, item) => sum + item.costLakhs, 0);

  return (
    <div className="space-y-8">
      {/* Studio Header Banner */}
      <div className="flex flex-col justify-between gap-6 border-b border-border pb-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <Eyebrow>
            01. Multimodal Venue + Pinterest Inspiration Fusion · Live Client Demonstration
          </Eyebrow>
          <h1 className="mt-2 text-4xl leading-tight sm:text-5xl [text-wrap:balance]">
            Combine a venue photo with Pinterest inspiration to preview the complete wedding setup
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Select or upload a venue in{" "}
            <strong className="font-medium text-foreground">Step 01</strong>, pick 2–4 Pinterest
            inspiration references in{" "}
            <strong className="font-medium text-foreground">Step 02</strong>, and click{" "}
            <strong className="font-medium text-foreground">Synthesize Wedding Setup</strong> to see
            the empty hall, garden, or banquet room transform with a full color palette and vendor
            brief.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenArchitecture}
            className="flex items-center gap-2 rounded-sm border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary whitespace-nowrap shrink-0"
          >
            <Layers className="h-3.5 w-3.5" />
            Walk Through How We Built It
          </button>
          <button
            type="button"
            onClick={onSynthesize}
            disabled={isSynthesizing}
            className="flex items-center gap-2 rounded-sm bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {isSynthesizing ? "Synthesizing Venue + Pins…" : "Synthesize Wedding Setup"}
          </button>
        </div>
      </div>

      {/* Main 12-Column Interactive Studio Grid */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* LEFT COLUMN (5 cols): Step 1 Venue + Step 2 Pinterest Board + Step 3 Controls */}
        <div className="space-y-6 lg:col-span-5">
          {/* STEP 1: Empty Venue Input */}
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Eyebrow>Step 01 · Base Empty Venue Photo</Eyebrow>
                <h2 className="mt-0.5 text-xl">Select or Upload Venue Architecture</h2>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-sm bg-primary px-3.5 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap shrink-0">
                <Upload className="h-3.5 w-3.5" />
                Upload Venue Photo
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleVenueFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {demoUploadedFileName && (
              <div className="mt-3 flex items-center justify-between rounded-sm border border-primary/40 bg-primary/5 px-3 py-2 text-xs">
                <span className="truncate font-medium text-foreground">
                  ✓ Demo Venue Input Loaded: {demoUploadedFileName} ({venue.name})
                </span>
                <button
                  type="button"
                  onClick={() => onSelectVenue(venue)}
                  className="ml-2 text-[11px] text-muted-foreground hover:text-foreground whitespace-nowrap shrink-0"
                >
                  Clear
                </button>
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2">
              {VENUES.map((v) => {
                const isSelected = venue.id === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVenue(v)}
                    className={`overflow-hidden rounded-sm border text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-background hover:bg-secondary/50"
                    }`}
                  >
                    <img
                      src={v.empty}
                      alt={v.name}
                      referrerPolicy="no-referrer"
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <div className="p-2">
                      <p className="truncate text-xs font-medium text-foreground">{v.name}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{v.type}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
              <span>{venue.dimensions}</span>
              <span>{venue.capacity}</span>
            </div>
          </div>

          {/* STEP 2: Pinterest Inspiration Board */}
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Eyebrow>
                  Step 02 · Pinterest Style Board ({selectedPinIds.length} Selected)
                </Eyebrow>
                <h2 className="mt-0.5 text-xl">Pick 2–4 Decor Inspiration Images</h2>
              </div>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary whitespace-nowrap shrink-0">
                <Upload className="h-3.5 w-3.5" />
                Add Inspiration Pin
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePinFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <p className="mt-1 text-xs text-muted-foreground">
              Select inspiration pins to fuse their floral species, drapery, and color swatches into
              the venue concept.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {allPins.map((pin) => {
                const isSelected = selectedPinIds.includes(pin.id);
                const imgSrc = pin.customImageUrl ?? ASSET_MAP[pin.imageKey];
                return (
                  <button
                    key={pin.id}
                    type="button"
                    onClick={() => togglePin(pin.id)}
                    className={`group flex flex-col overflow-hidden rounded-sm border text-left transition-all duration-150 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-background hover:border-foreground/40"
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                      <img
                        src={imgSrc}
                        alt={pin.title}
                        referrerPolicy="no-referrer"
                        className={`h-full w-full object-cover ${pin.focalCrop} transition-transform duration-200 group-hover:scale-105`}
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-2.5 py-1.5 text-[10px] text-white">
                        {pin.category} · {pin.kelvin}K
                      </div>
                      <div
                        className={`absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-sm border text-[10px] font-medium ${
                          isSelected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-white/80 bg-black/50 text-white"
                        }`}
                      >
                        {isSelected ? <Check className="h-3 w-3" /> : "+"}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between p-2.5">
                      <div>
                        <p className="line-clamp-1 text-xs font-medium text-foreground">
                          {pin.title}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">
                          {pin.subtitle}
                        </p>
                      </div>
                      <div className="mt-2 flex gap-1">
                        {pin.swatches.map((s) => (
                          <span
                            key={s.hex}
                            className="h-2.5 flex-1 rounded-[1px] border border-border/60"
                            style={{ backgroundColor: s.hex }}
                            title={`${s.name} (${s.hex})`}
                          />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Architectural & Atmosphere Parameters */}
          <div className="border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Eyebrow>Step 03 · Spatial & Lighting Conditioning</Eyebrow>
                <h2 className="mt-0.5 text-xl">Refine Density, Lighting & Focal Rig</h2>
              </div>
              <Sliders className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground">
                  Focal Installation Structure
                </label>
                <select
                  value={focalStructure}
                  onChange={(e) => setFocalStructure(e.target.value)}
                  className="mt-1 w-full rounded-sm border border-border bg-background px-2.5 py-2 text-xs text-foreground"
                >
                  {[
                    "Royal Floral Mandap Arch",
                    "Asymmetrical Peony Meadow Arch",
                    "Suspended Crystal Chandelier Canopy",
                    "Sculptural Ikebana Travertine Plinths",
                    "Glasshouse Draped Chuppah",
                  ].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-muted-foreground">Floral Volume Density</label>
                <div className="mt-1 grid grid-cols-4 gap-1">
                  {(["Minimal", "Balanced", "Lush", "Couture"] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFloralDensity(d)}
                      className={`rounded-sm border py-2 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                        floralDensity === d
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-background text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Guest Capacity</span>
                  <span className="font-mono tabular-nums font-medium">{guestCount} Pax</span>
                </div>
                <input
                  type="range"
                  min={80}
                  max={900}
                  step={20}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="mt-1.5 w-full accent-primary"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Color Temp (Kelvin)</span>
                  <span className="font-mono tabular-nums font-medium">{lightingKelvin}K</span>
                </div>
                <input
                  type="range"
                  min={2000}
                  max={4500}
                  step={100}
                  value={lightingKelvin}
                  onChange={(e) => setLightingKelvin(Number(e.target.value))}
                  className="mt-1.5 w-full accent-primary"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={onSynthesize}
              disabled={isSynthesizing}
              className="w-full rounded-sm bg-primary py-3 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {isSynthesizing
                ? "Running Multimodal Venue + Pinterest Synthesis…"
                : "Synthesize Complete Wedding Setup →"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols): Pre-Edited Photorealistic Before/After Flow */}
        <div className="space-y-6 lg:col-span-7">
          <div className="border border-border bg-card p-6">
            {/* Output Toolbar */}
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Synthesized Venue Concept</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    {synthesis.pipelineLatencyMs}ms pipeline
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPinIds.length} Pinterest refs fused</span>
                </div>
                <h2 className="mt-1 text-2xl sm:text-3xl">{synthesis.conceptTitle}</h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLocks((v) => !v)}
                  className={`rounded-sm border px-3 py-1.5 text-xs transition-colors whitespace-nowrap shrink-0 ${
                    showLocks
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-secondary"
                  }`}
                >
                  {showLocks ? "✓ Sightline Locks Visible" : "Show Sightline Locks"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromptDrawer((v) => !v)}
                  className="rounded-sm border border-border bg-background px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary whitespace-nowrap shrink-0"
                >
                  {showPromptDrawer ? "Hide AI Prompt" : "Inspect AI Prompt"}
                </button>
              </div>
            </div>

            {/* Live 4-Step Pipeline Trace Bar during synthesis */}
            {isSynthesizing && (
              <div className="my-4 grid grid-cols-4 gap-2 border border-border bg-secondary/50 p-3 text-xs">
                {[
                  "1. Extracting Pinterest Style Tokens",
                  "2. Locking Venue Sightlines & Horizon",
                  "3. Mapping Florals, Drapery & Lighting",
                  "4. Compiling Render & Vendor BOQ",
                ].map((label, idx) => {
                  const active = pipelineStep >= idx + 1;
                  return (
                    <div
                      key={label}
                      className={`p-2 transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main Before / After Interactive Viewport using our crisp pre-edited venue pairs */}
            <div className="mt-4">
              <BeforeAfterCanvas
                before={venue.empty}
                after={venue.decor}
                pins={synthesis.spatialPins}
                activePinId={activeHotspot?.id ?? null}
                onSelectPin={(id) => setActiveHotspotId(id)}
                showLocks={showLocks}
                locks={venue.locks}
                kelvin={lightingKelvin}
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  Drag slider ⇆ to compare Empty Venue vs. AI Decorated Setup · Click numbered pins
                  (1–4) to inspect zone specs
                </span>
                <span className="font-mono text-[11px]">{venue.name}</span>
              </div>
            </div>

            {/* Quick Switcher Strip for All 3 Pre-Edited Venue Transformations */}
            <div className="mt-5 border-t border-border pt-4">
              <Eyebrow>
                Switch Pre-Edited Venue Transformation Flow (Empty → Decorated Setup)
              </Eyebrow>
              <div className="mt-3 grid grid-cols-3 gap-3">
                {VENUES.map((v, idx) => {
                  const isSelected = venue.id === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSelectVenue(v)}
                      className={`group overflow-hidden rounded-sm border text-left transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "border-border bg-background hover:border-foreground/40"
                      }`}
                    >
                      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
                        <img
                          src={v.decor}
                          alt={v.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                        <span className="absolute left-2 top-2 rounded-sm bg-black/70 px-1.5 py-0.5 font-mono text-[10px] text-white">
                          0{idx + 1}
                        </span>
                        {isSelected && (
                          <span className="absolute right-2 top-2 rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                            Active
                          </span>
                        )}
                      </div>
                      <div className="p-2.5">
                        <p className="truncate text-xs font-medium text-foreground">{v.name}</p>
                        <p className="line-clamp-1 text-[10px] text-muted-foreground">{v.note}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Collapsible Conditioning Prompt Inspector */}
            {showPromptDrawer && (
              <div className="mt-4 border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <Eyebrow>
                    Synthesized Multimodal Conditioning Prompt (Nano Banana / ControlNet)
                  </Eyebrow>
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(synthesis.masterImagePrompt)}
                    className="flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <Copy className="h-3 w-3" />
                    Copy Prompt
                  </button>
                </div>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-foreground">
                  {synthesis.masterImagePrompt}
                </pre>
              </div>
            )}

            {/* Curatorial Synthesis Note */}
            <p className="mt-5 text-sm leading-relaxed text-foreground">
              {synthesis.curatorialNote}
            </p>

            {/* Interactive Spatial Hotspot Inspector + Blended Palette */}
            <div className="mt-6 grid gap-6 border-t border-border pt-6 md:grid-cols-2">
              <div>
                <Eyebrow>Approved 5-Color Harmony</Eyebrow>
                <div className="mt-3">
                  <SwatchBar swatches={venue.palette} compact />
                </div>
              </div>

              <div className="border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <Eyebrow>Selected Spatial Zone Pin #{activeHotspot?.id}</Eyebrow>
                  <span className="font-mono text-xs tabular-nums text-primary font-medium">
                    Est. ₹{activeHotspot?.costLakhs.toFixed(1)}L
                  </span>
                </div>
                <h3 className="mt-1 text-lg font-medium text-foreground">
                  {activeHotspot?.title} ({activeHotspot?.zone})
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {activeHotspot?.detail}
                </p>
                <div className="mt-3 flex gap-1.5">
                  {synthesis.spatialPins.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActiveHotspotId(p.id)}
                      className={`px-2.5 py-1 text-xs font-mono transition-colors ${
                        activeHotspot?.id === p.id
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Pin 0{p.id}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bottom Summary Strip: Total BOQ + Quick Action to Vendor Brief */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <div>
                <p className="text-xs text-muted-foreground">
                  Estimated Full Setup Budget ({guestCount} Guests · {floralDensity} Florals)
                </p>
                <p className="font-serif text-3xl tabular-nums text-foreground">
                  ₹{totalBoqCost.toFixed(1)} Lakhs
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onOpenVendorBrief}
                  className="rounded-sm border border-foreground bg-card px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary whitespace-nowrap shrink-0"
                >
                  Open Full Vendor BOQ →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LookbookView({ onPickVenue }: { onPickVenue: (v: Venue) => void }) {
  return (
    <section className="space-y-12">
      <div className="max-w-3xl">
        <Eyebrow>02. Architectural Transformation Lookbook</Eyebrow>
        <h1 className="mt-2 text-5xl [text-wrap:balance]">From empty venue to wedding day</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Drag the slider on each venue to see how an empty hall, garden, or banquet transforms,
          with the colour combination behind every look.
        </p>
      </div>

      <div className="space-y-14">
        {VENUES.map((v) => (
          <div
            key={v.id}
            className="grid gap-8 border border-border bg-card p-6 lg:grid-cols-12 items-center"
          >
            <div className="lg:col-span-7">
              <BeforeAfterCanvas before={v.empty} after={v.decor} compact />
            </div>
            <div className="lg:col-span-5 flex flex-col justify-center space-y-4">
              <div className="text-xs text-muted-foreground">
                <span>{v.type}</span>
                <span aria-hidden="true"> · </span>
                <span>{v.location}</span>
              </div>
              <h2 className="text-3xl">{v.name}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{v.note}</p>
              <div className="pt-2">
                <p className="mb-2 text-xs text-muted-foreground">Colour combination</p>
                <SwatchBar swatches={v.palette} compact />
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => onPickVenue(v)}
                  className="rounded-sm bg-primary px-5 py-2.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap shrink-0"
                >
                  Decorate this venue in Live Studio →
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function VendorBriefView({
  venue,
  guestCount,
  floralDensity,
  synthesis,
}: {
  venue: Venue;
  guestCount: number;
  floralDensity: string;
  synthesis: SynthesisResponse;
}) {
  const [approvedRows, setApprovedRows] = useState<number[]>([0, 1, 2]);
  const totalCost = synthesis.vendorBoq.reduce((acc, r) => acc + r.costLakhs, 0);

  return (
    <section className="mx-auto max-w-5xl border border-border bg-card p-8 sm:p-10">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <Eyebrow>03. Production Execution Dossier & Vendor BOQ</Eyebrow>
          <h1 className="mt-1 text-4xl">{venue.name}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {venue.type} · <span className="tabular-nums">{guestCount}</span> Guests ·{" "}
            {floralDensity} Floral Spec
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-sm bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap shrink-0"
        >
          <Printer className="h-3.5 w-3.5" />
          Print / Export PDF Brief
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-12 items-center">
        <div className="md:col-span-7">
          <BeforeAfterCanvas before={venue.empty} after={venue.decor} compact />
        </div>
        <div className="md:col-span-5 space-y-4">
          <Eyebrow>Architectural & Curatorial Directive</Eyebrow>
          <p className="text-sm leading-relaxed text-foreground">{synthesis.curatorialNote}</p>
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">Preserved Venue Locks</p>
            <ul className="space-y-1 text-xs text-foreground">
              {synthesis.preservedStructures.map((s) => (
                <li key={s}>· {s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <p className="mb-2 text-xs text-muted-foreground">Approved Production Color Swatches</p>
        <SwatchBar swatches={venue.palette} />
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="py-2.5 pr-3">Sign-off</th>
              <th className="py-2.5 pr-4">Vendor Trade</th>
              <th className="py-2.5 pr-4">Installation Scope</th>
              <th className="py-2.5 pr-4">Specified Materials & Botanicals</th>
              <th className="py-2.5 text-right">Estimate</th>
            </tr>
          </thead>
          <tbody>
            {synthesis.vendorBoq.map((row, idx) => {
              const isChecked = approvedRows.includes(idx);
              return (
                <tr key={row.category} className="border-b border-border">
                  <td className="py-3.5 pr-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() =>
                        setApprovedRows(
                          isChecked
                            ? approvedRows.filter((x) => x !== idx)
                            : [...approvedRows, idx],
                        )
                      }
                      className="accent-primary"
                    />
                  </td>
                  <td className="py-3.5 pr-4 font-medium text-foreground">{row.category}</td>
                  <td className="py-3.5 pr-4 text-xs text-foreground">{row.scope}</td>
                  <td className="py-3.5 pr-4 text-xs text-muted-foreground">{row.materials}</td>
                  <td className="py-3.5 text-right font-mono tabular-nums font-medium">
                    ₹{row.costLakhs.toFixed(1)}L
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-2">
        <p className="text-xs text-muted-foreground">
          Trades Approved:{" "}
          <span className="font-mono tabular-nums text-foreground">
            {approvedRows.length}/{synthesis.vendorBoq.length}
          </span>
        </p>
        <p className="text-sm">
          Total Turnkey Estimate:{" "}
          <span className="ml-2 font-serif text-3xl tabular-nums text-foreground">
            ₹{totalCost.toFixed(1)} Lakhs
          </span>
        </p>
      </div>
    </section>
  );
}

function ArchitectureWalkthroughView({
  venue,
  selectedPins,
  synthesis,
}: {
  venue: Venue;
  selectedPins: InspirationPin[];
  synthesis: SynthesisResponse;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(t);
  }, [copied]);

  const samplePayload = JSON.stringify(
    {
      pipeline: "aanssha-multimodal-v2",
      baseVenue: {
        id: venue.id,
        name: venue.name,
        type: venue.type,
        structuralLocks: venue.locks.map((l) => l.label),
      },
      pinterestReferences: selectedPins.map((p) => ({
        id: p.id,
        title: p.title,
        florals: p.floralNotes,
        drapery: p.draperyNotes,
        kelvin: p.kelvin,
        extractedSwatches: p.swatches.map((s) => s.hex),
      })),
      models: {
        visionAndBoqExtractor: "gemini-3.8-flash (Free Tier / Low-Latency JSON Schema)",
        imageSynthesizer:
          "gemini-3.1-flash-lite-image (Nano Banana Lite) / gemini-nano-banana-2.1 (Paid 1K-4K Tier)",
      },
    },
    null,
    2,
  );

  return (
    <section className="space-y-12">
      {/* Header */}
      <div className="max-w-3xl">
        <Eyebrow>04. CTO System Architecture & AI Engineering Walkthrough</Eyebrow>
        <h1 className="mt-2 text-4xl sm:text-5xl [text-wrap:balance]">
          How We Built It: Multimodal Venue + Pinterest Fusion Pipeline
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Designed for live walkthroughs during technical client reviews. Below is our 4-stage
          multimodal architecture, live request payload inspector, and production cost/capability
          comparison across Free and Paid Image Generation APIs.
        </p>
      </div>

      {/* 4-Stage Architecture Diagram */}
      <div className="grid gap-5 md:grid-cols-4">
        {[
          {
            step: "01. Vision Style Tokenization",
            engine: "gemini-3.8-flash (Free Tier)",
            desc: "Ingests 2–4 Pinterest inspiration images and extracts structured JSON style tokens: floral species, drapery textiles, lighting Kelvin, and dominant 5-hex color harmonies.",
          },
          {
            step: "02. Venue Geometry & Depth Lock",
            engine: "Sightline & Horizon Conditioning",
            desc: "Analyzes the empty venue photo to lock the vanishing point horizon, ceiling truss clearance, perimeter columns, and floor boundary so the room never hallucinates new walls.",
          },
          {
            step: "03. Multi-Image Venue Synthesis",
            engine: "Nano Banana (gemini-3.1-flash-lite-image / 2.1)",
            desc: "Passes the base venue image + extracted Pinterest style tokens into Gemini's interleaved image generation endpoint (or ControlNet Depth inpainting) to render the decorated space.",
          },
          {
            step: "04. Deterministic BOQ Compiler",
            engine: "Structured responseSchema JSON",
            desc: "Maps the rendered zones (Mandap/Arch, Aisle, Chandeliers, Tablescapes) against guest count and floral density to output an itemized vendor budget.",
          },
        ].map((stage) => (
          <div
            key={stage.step}
            className="border border-border bg-card p-5 flex flex-col justify-between"
          >
            <div>
              <p className="font-mono text-xs text-primary">{stage.step}</p>
              <h3 className="mt-2 text-xl text-foreground">{stage.engine}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{stage.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Free vs. Paid Image Generation API Matrix */}
      <div className="border border-border bg-card p-6 sm:p-8">
        <div className="max-w-3xl">
          <Eyebrow>Model Selection & Unit Economics</Eyebrow>
          <h2 className="mt-1 text-3xl">
            Free vs. Paid Image Generation APIs (Nano Banana, Imagen, GPT-Image-1, Flux)
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Why standard text-to-image fails for wedding venues: clients need their{" "}
            <strong className="font-medium text-foreground">exact venue photo</strong> decorated
            with{" "}
            <strong className="font-medium text-foreground">specific Pinterest references</strong>.
            Here is how the leading APIs compare for multi-image conditioned venue rendering:
          </p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="py-3 pr-4">Model / API</th>
                <th className="py-3 pr-4">Pipeline Role</th>
                <th className="py-3 pr-4">Free Tier Availability</th>
                <th className="py-3 pr-4">Paid Production Cost</th>
                <th className="py-3 pr-4">Multi-Image Input</th>
                <th className="py-3 pr-4">Latency</th>
                <th className="py-3">CTO Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {API_COMPARISON_MATRIX.map((row) => (
                <tr key={row.apiId} className="border-b border-border align-top">
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-foreground">{row.modelName}</p>
                    <p className="font-mono text-[11px] text-muted-foreground">{row.apiId}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-foreground">{row.roleInPipeline}</td>
                  <td className="py-3.5 pr-4 text-foreground">{row.freeTierAvailable}</td>
                  <td className="py-3.5 pr-4 font-mono tabular-nums text-foreground">
                    {row.paidPricing}
                  </td>
                  <td className="py-3.5 pr-4 text-muted-foreground">{row.multiImageSupport}</td>
                  <td className="py-3.5 pr-4 font-mono tabular-nums text-muted-foreground">
                    {row.latency}
                  </td>
                  <td className="py-3.5 text-foreground">{row.ctoVerdict}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Payload & Prompt Inspector */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="border border-border bg-card p-6">
          <div className="flex items-center justify-between">
            <Eyebrow>Live Multimodal Pipeline Payload (/api/ai/synthesize)</Eyebrow>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(samplePayload);
                setCopied(true);
              }}
              className="flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Copy className="h-3 w-3" />
              {copied ? "Copied JSON" : "Copy JSON"}
            </button>
          </div>
          <pre className="mt-3 max-h-80 overflow-auto rounded-sm border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">
            {samplePayload}
          </pre>
        </div>

        <div className="border border-border bg-card p-6">
          <Eyebrow>Compiled Master Conditioning Prompt</Eyebrow>
          <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-sm border border-border bg-background p-4 font-mono text-[11px] leading-relaxed text-foreground">
            {synthesis.masterImagePrompt}
          </pre>
        </div>
      </div>
    </section>
  );
}
