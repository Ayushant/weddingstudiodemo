import { createFileRoute } from "@tanstack/react-router";
import hallEmpty from "@/assets/hall-empty.jpg";
import hallDecor from "@/assets/hall-decorated-v2.jpg";
import gardenEmpty from "@/assets/garden-empty.jpg";
import gardenDecor from "@/assets/garden-decorated.jpg";
import banquetEmpty from "@/assets/banquet-empty.jpg";
import banquetDecor from "@/assets/banquet-decorated.jpg";
import { useRef, useState, type PointerEvent as RPE } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Aanssha — AI Wedding Decor Studio" },
      { name: "description", content: "Transform empty halls, gardens and banquets into styled wedding decor concepts with palettes, style profiles and vendor briefs." },
      { property: "og:title", content: "Aanssha — AI Wedding Decor Studio" },
      { property: "og:description", content: "See any empty venue decorated, pick palettes, refine zones and export a vendor brief." },
    ],
  }),
  component: Index,
});

const u = (id: string, w = 1400) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

type Venue = { id: string; name: string; type: string; empty: string; decor: string; palette: { n: string; c: string }[]; note: string };
const VENUES: Venue[] = [
  { id: "hall", name: "The Grand Wedding Hall", type: "Indoor Wedding Hall", empty: hallEmpty, decor: hallDecor,
    palette: [{ n: "Ivory", c: "#F6F0E4" }, { n: "Maroon", c: "#7A1F2B" }, { n: "Antique Gold", c: "#C9A24B" }, { n: "Blush", c: "#E9C3C0" }, { n: "Deep Green", c: "#1F4D3F" }],
    note: "Ivory chair covers with blush and green sashes, a rose arch and a candlelit petal aisle." },
  { id: "garden", name: "Villa Cipressi Garden", type: "Garden Lawn", empty: gardenEmpty, decor: gardenDecor,
    palette: [{ n: "Cream", c: "#FBF6EC" }, { n: "Peony", c: "#E7A6B4" }, { n: "Sage", c: "#9CB49A" }, { n: "Champagne", c: "#D9C29A" }, { n: "Moss", c: "#4E6B48" }],
    note: "Flower-pillar aisle, gold chiavari seating and a pastel peony arch framed by cypress." },
  { id: "banquet", name: "Suryagarh Banquet", type: "Banquet Room", empty: banquetEmpty, decor: banquetDecor,
    palette: [{ n: "Pearl", c: "#F3EEE6" }, { n: "Champagne", c: "#E2CFA8" }, { n: "Navy", c: "#22304A" }, { n: "Gold", c: "#BF9443" }, { n: "Rosewood", c: "#9A5A5A" }],
    note: "Round tables in champagne linen, cascading chandeliers and low gold-rimmed centrepieces." },
];
const SECTIONS = ["Lookbook", "Venue & Brief", "Style Profile", "Workspace", "Vendor Brief"];

function Index() {
  const [sec, setSec] = useState(0);
  const [venue, setVenue] = useState<Venue>(VENUES[0]!);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border px-6 py-5">
        <span className="font-serif text-2xl tracking-wide">AANSSHA</span>
        <nav className="hidden gap-7 md:flex">
          {SECTIONS.map((s, i) => (
            <button key={s} onClick={() => setSec(i)} className={`pb-1 text-sm ${sec === i ? "border-b border-foreground text-foreground" : "text-muted-foreground"}`}>
              0{i + 1}. {s}
            </button>
          ))}
        </nav>
        <button onClick={() => setSec(3)} className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">Start a Concept</button>
      </header>
      <nav className="flex gap-4 overflow-x-auto border-b border-border px-6 py-3 md:hidden">
        {SECTIONS.map((s, i) => <button key={s} onClick={() => setSec(i)} className={`whitespace-nowrap text-sm ${sec === i ? "text-primary" : "text-muted-foreground"}`}>{s}</button>)}
      </nav>
      <main className="mx-auto max-w-[1400px] px-6 py-10">
        {sec === 0 && <Lookbook onPick={(v) => { setVenue(v); setSec(3); }} />}
        {sec === 1 && <VenueBrief venue={venue} setVenue={setVenue} />}
        {sec === 2 && <StyleProfile />}
        {sec === 3 && <Workspace venue={venue} setVenue={setVenue} />}
        {sec === 4 && <VendorBrief venue={venue} />}
      </main>
      <p className="pb-6 text-center text-xs text-muted-foreground">Photography: "Before" photos are real venues (Wikimedia Commons); "After" shows the same venue decorated by Aanssha AI.</p>
    </div>
  );
}

const Eyebrow = ({ children }: { children: React.ReactNode }) => <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{children}</p>;
const Swatches = ({ p, size = "h-10" }: { p: { n: string; c: string }[]; size?: string }) => (
  <div className="flex gap-2">{p.map((s) => <div key={s.n} className="flex-1"><div className={`${size} rounded-sm border border-border`} style={{ background: s.c }} /><p className="mt-1 text-[11px] text-muted-foreground">{s.n}</p></div>)}</div>
);

function BeforeAfter({ before, after, pins = [] as { x: number; y: number }[], tall = false, compact = false }: { before: string; after: string; pins?: { x: number; y: number }[]; tall?: boolean; compact?: boolean }) {
  const [pos, setPos] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const drag = useRef(false);
  const move = (e: RPE) => {
    if (!drag.current || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos(Math.max(0, Math.min(100, ((e.clientX - r.left) / r.width) * 100)));
  };
  return (
    <div ref={ref} onPointerDown={(e) => { drag.current = true; (e.target as HTMLElement).setPointerCapture?.(e.pointerId); move(e); }} onPointerMove={move} onPointerUp={() => (drag.current = false)}
      className={`relative w-full cursor-ew-resize select-none overflow-hidden rounded-sm ${tall ? "aspect-[16/10]" : compact ? "aspect-[16/9] max-h-64" : "aspect-[3/2]"}`}>
      <img src={after} alt="Decorated venue" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <img src={before} alt="Empty venue" className="h-full w-full object-cover" draggable={false} />
      </div>
      <span className="absolute left-3 top-3 rounded-sm bg-card/90 px-2 py-1 text-[11px]">Before · Empty</span>
      <span className="absolute right-3 top-3 rounded-sm bg-primary px-2 py-1 text-[11px] text-primary-foreground">After · Decorated</span>
      {pins.map((p, i) => (
        <span key={i} className="absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-card bg-primary text-xs text-primary-foreground" style={{ left: `${p.x}%`, top: `${p.y}%` }}>{i + 1}</span>
      ))}
      <div className="absolute inset-y-0 w-0.5 bg-card" style={{ left: `${pos}%` }}>
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-card px-2 py-1 text-xs text-foreground shadow">⇆</div>
      </div>
    </div>
  );
}

function Lookbook({ onPick }: { onPick: (v: Venue) => void }) {
  return (
    <section>
      <Eyebrow>01 · Lookbook</Eyebrow>
      <h1 className="mt-2 text-5xl">From empty venue to wedding day</h1>
      <p className="mt-3 max-w-3xl text-muted-foreground">
        Drag the slider on each venue to see how an empty hall, garden or banquet transforms, with the colour combination behind every look.
        Every concept is crafted by Aanssha's AI — pairing your chosen palette with seasonal florals, lighting and furniture that suit the architecture of your space.
      </p>

      <div className="mt-10 space-y-14">
        {VENUES.map((v) => (
          <div key={v.id} className="grid gap-8 md:grid-cols-[1fr_1fr]">
            <BeforeAfter before={v.empty} after={v.decor} compact />
            <div className="flex flex-col justify-center">
              <Eyebrow>{v.type}</Eyebrow>
              <h2 className="mt-1 text-3xl">{v.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{v.note}</p>
              <p className="mb-2 mt-6 text-sm">Colour combination</p>
              <Swatches p={v.palette} />
              <button onClick={() => onPick(v)} className="mt-6 self-start rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">Decorate this venue →</button>
            </div>
          </div>
        ))}
      </div>

      {/* Aanssha brand stats — shown below the venue cards */}
      <div className="mt-14 grid grid-cols-2 gap-4 border border-border bg-card p-6 sm:grid-cols-4">
        {[
          { stat: "200+", label: "Venues Styled" },
          { stat: "50+", label: "Decor Themes" },
          { stat: "1,200+", label: "Happy Couples" },
          { stat: "98%", label: "Client Satisfaction" },
        ].map(({ stat, label }) => (
          <div key={label} className="text-center">
            <p className="font-serif text-3xl text-primary">{stat}</p>
            <p className="mt-1 text-xs text-muted-foreground uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function VenueBrief({ venue, setVenue }: { venue: Venue; setVenue: (v: Venue) => void }) {
  const types = ["Indoor Wedding Hall", "Garden Lawn", "Banquet Room", "Heritage Courtyard", "Botanical Glasshouse"];
  const [type, setType] = useState(venue.type);
  const [step, setStep] = useState(0);
  const [guests, setGuests] = useState(420);
  const steps = [["Venue Architecture", "1 sightline · " + type.toLowerCase()], ["Editorial References", "4 saves · swatches extracted"], ["Function & Brief", `${guests} guests · couture`]];
  return (
    <section className="grid gap-8 md:grid-cols-[300px_1fr]">
      <aside>
        <Eyebrow>Concept Dossier Setup</Eyebrow>
        <h1 className="mt-2 text-3xl leading-tight">{venue.name}</h1>
        <div className="mt-6 space-y-2 border-t border-border pt-6">
          {steps.map(([t, s], i) => (
            <button key={t} onClick={() => setStep(i)} className={`w-full border p-4 text-left ${step === i ? "border-foreground bg-card" : "border-border bg-muted"}`}>
              <div className="flex justify-between font-mono text-[11px]"><span>STEP 0{i + 1}</span>{step === i && <span>ACTIVE</span>}</div>
              <p className="mt-1">{t}</p><p className="text-xs text-muted-foreground">{s}</p>
            </button>
          ))}
        </div>
        <div className="mt-4 border border-border bg-card p-4">
          <p className="mb-2 text-sm">Switch Demo Venue</p>
          {VENUES.map((v) => (
            <button key={v.id} onClick={() => { setVenue(v); setType(v.type); }} className={`mb-1 block w-full px-3 py-2 text-left text-xs ${venue.id === v.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{v.name}</button>
          ))}
        </div>
      </aside>
      <div className="border border-border bg-card p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div><p className="text-xs text-muted-foreground">Step 01 · Architectural Geometry & Sightline Preservation</p><h2 className="mt-1 text-3xl">Upload Venue Photography & Confirm Space Type</h2></div>
          <label className="cursor-pointer rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">⇪ Upload Venue Photo<input type="file" accept="image/*" className="hidden" /></label>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">Detected venue architecture (click to confirm or override):</p>
        <div className="mt-2 flex flex-wrap gap-2">{types.map((t) => <button key={t} onClick={() => setType(t)} className={`border px-3 py-2 text-sm ${type === t ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{t}</button>)}</div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="relative">
            <img src={venue.empty} alt="Empty venue" className="aspect-[3/2] w-full rounded-sm object-cover" />
            {[["Preserve: Ceiling & Rigging Grid", "left-[15%] top-[6%] w-[70%] h-[20%]"], ["Preserve: West Wall", "left-[3%] top-[30%] w-[18%] h-[62%]"], ["Preserve: Focal Axis", "left-[35%] top-[35%] w-[30%] h-[30%]"]].map(([l, c]) => (
              <div key={l} className={`absolute border border-dashed border-card ${c}`}><span className="bg-foreground/80 px-1 text-[10px] text-background">{l}</span></div>
            ))}
            <p className="mt-2 flex justify-between font-mono text-[11px] text-muted-foreground"><span>Axial master sightline</span><span>FOV 62° · Horizon Y=0.5</span></p>
          </div>
          <div className="border border-border p-5">
            <p className="text-xs text-muted-foreground">Architectural Scan</p><h3 className="text-xl">Preserved Structural Locks</h3>
            <div className="mt-4 grid grid-cols-2 gap-2">{[["Ceiling Clearance", "9.5m"], ["Axial Depth", "58m"]].map(([a, b]) => <div key={a} className="border border-border p-3"><p className="text-xs text-muted-foreground">{a}</p><p className="font-mono">{b}</p></div>)}</div>
            <label className="mt-5 block text-xs text-muted-foreground">Guest count: {guests}</label>
            <input type="range" min={50} max={1200} value={guests} onChange={(e) => setGuests(+e.target.value)} className="w-full accent-primary" />
            <p className="mt-4 text-sm">Floor: polished marble · Walls: warm plaster · Daylight from right (2700K)</p>
          </div>
        </div>
      </div>
    </section>
  );
}

const STYLES = [
  { n: "Royal Rajputana", img: u("1587271407850-8d438ca9fdf2", 700), d: "Marigold, maroon drapes, brass urlis", p: ["#7A1F2B", "#E3A02A", "#C9A24B", "#F6F0E4"] },
  { n: "Garden Romance", img: u("1523438885200-e635ba2c371e", 700), d: "Peonies, columns, soft pastels", p: ["#E7A6B4", "#9CB49A", "#FBF6EC", "#D9C29A"] },
  { n: "Modern Minimal", img: u("1530023367847-a683933f4172", 700), d: "White linen, glass, single stems", p: ["#FFFFFF", "#E8E2D6", "#B8A48A", "#2B2B2B"] },
  { n: "Champagne Glam", img: u("1519167758481-83f550bb49b3", 700), d: "Chandeliers, gold chiavari, sparkle", p: ["#E2CFA8", "#BF9443", "#F3EEE6", "#22304A"] },
  { n: "Boho Tablescape", img: u("1511795409834-ef04bbd61622", 700), d: "Wildflowers, wood, candlelight", p: ["#D96C3B", "#E8B04A", "#6E7F4E", "#F4EADB"] },
  { n: "Coastal Breeze", img: u("1507504031003-b417219a0fde", 700), d: "Linen runners, coral, open air", p: ["#E04E4E", "#F4F1EA", "#3E4A3C", "#C7B79B"] },
];
function StyleProfile() {
  const [sel, setSel] = useState<string[]>(["Garden Romance"]);
  const [vals, setVals] = useState({ Traditional: 60, Opulence: 45, Floral: 75, Warmth: 55 });
  return (
    <section>
      <Eyebrow>03 · Style Profile</Eyebrow>
      <h1 className="mt-2 text-5xl">Your decor style profile</h1>
      <p className="mt-3 text-muted-foreground">Pick looks you love; we blend them into one profile.</p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {STYLES.map((s) => {
          const on = sel.includes(s.n);
          return (
            <button key={s.n} onClick={() => setSel(on ? sel.filter((x) => x !== s.n) : [...sel, s.n])} className={`overflow-hidden border bg-card text-left ${on ? "border-primary ring-2 ring-primary" : "border-border"}`}>
              <img src={s.img} alt={s.n} loading="lazy" className="aspect-[3/2] w-full object-cover" />
              <div className="p-4">
                <div className="flex justify-between"><h3 className="text-xl">{s.n}</h3><span className="text-sm text-primary">{on ? "✓ Saved" : "+ Save"}</span></div>
                <p className="text-sm text-muted-foreground">{s.d}</p>
                <div className="mt-3 flex gap-1">{s.p.map((c) => <span key={c} className="h-5 flex-1 rounded-sm border border-border" style={{ background: c }} />)}</div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-10 grid gap-6 border border-border bg-card p-6 md:grid-cols-2">
        {Object.entries(vals).map(([k, v]) => (
          <div key={k}><div className="flex justify-between text-sm"><span>{k}</span><span className="font-mono">{v}</span></div>
            <input type="range" value={v} onChange={(e) => setVals({ ...vals, [k]: +e.target.value })} className="w-full accent-primary" /></div>
        ))}
        <p className="md:col-span-2 text-sm text-muted-foreground">Profile: <span className="text-foreground">{sel.join(" + ") || "None selected"}</span> · {vals.Floral > 60 ? "flower-forward" : "restrained florals"} · {vals.Opulence > 60 ? "high glamour" : "understated luxury"}</p>
      </div>
    </section>
  );
}

const ZONES = [
  { n: "Ceremony", cost: 4.2 }, { n: "Tablescape", cost: 3.1 }, { n: "Entrance", cost: 1.6 }, { n: "Stage", cost: 3.8 },
  { n: "Aisle", cost: 1.4 }, { n: "Lounge", cost: 1.9 }, { n: "Photo Wall", cost: 0.9 },
];
const CANDIDATES = [u("1519167758481-83f550bb49b3", 600), u("1464366400600-7168b8af9bc3", 600), u("1530023367847-a683933f4172", 600)];
const DENS = ["Minimal", "Balanced", "Lush", "Abundant"];

function Workspace({ venue, setVenue }: { venue: Venue; setVenue: (v: Venue) => void }) {
  const [zone, setZone] = useState("Ceremony");
  const [synced, setSynced] = useState<string[]>([]);
  const [tab, setTab] = useState("2D Before/After");
  const [cand, setCand] = useState(-1);
  const [ratio, setRatio] = useState("16:9");
  const [engine, setEngine] = useState("Photoreal");
  const [pal, setPal] = useState(venue.palette.map((p) => p.c));
  const [dens, setDens] = useState("Balanced");
  const [light, setLight] = useState(2700);
  const [intensity, setIntensity] = useState(65);
  const [focal, setFocal] = useState("Floral Arch");
  const [rendering, setRendering] = useState(false);
  const [renders, setRenders] = useState(0);
  const pins = [{ x: 50, y: 45 }, { x: 22, y: 60 }, { x: 78, y: 62 }, { x: 50, y: 82 }];
  const mult = [0.7, 1, 1.35, 1.7][DENS.indexOf(dens)] ?? 1;
  const total = ZONES.reduce((a, z) => a + z.cost, 0) * mult;
  const after = (cand >= 0 ? CANDIDATES[cand] : undefined) ?? venue.decor;

  return (
    <section className="grid gap-6 lg:grid-cols-[260px_1fr_300px]">
      <aside className="space-y-4">
        <div>
          <Eyebrow>Venue</Eyebrow>
          <select value={venue.id} onChange={(e) => { const v = VENUES.find((x) => x.id === e.target.value)!; setVenue(v); setPal(v.palette.map((p) => p.c)); setCand(-1); }} className="mt-1 w-full border border-border bg-card px-3 py-2 text-sm">
            {VENUES.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
        </div>
        <div className="border border-border bg-card">
          {ZONES.map((z, i) => (
            <button key={z.n} onClick={() => setZone(z.n)} className={`flex w-full items-center justify-between border-b border-border px-3 py-2.5 text-left text-sm last:border-0 ${zone === z.n ? "bg-primary text-primary-foreground" : ""}`}>
              <span><span className="mr-2 font-mono text-xs opacity-60">0{i + 1}</span>{z.n}</span>
              {synced.includes(z.n) && <span className="text-xs">●</span>}
            </button>
          ))}
        </div>
        <button onClick={() => setSynced(ZONES.map((z) => z.n))} className="w-full border border-primary px-3 py-2 text-sm text-primary hover:bg-primary hover:text-primary-foreground">
          {synced.length === 7 ? "✓ All Zones Synchronized" : "Synchronize All Zones"}
        </button>
        <div className="border border-border bg-card p-4">
          <Eyebrow>Estimate</Eyebrow>
          <p className="mt-1 font-serif text-3xl">₹{total.toFixed(1)}L</p>
          <p className="text-xs text-muted-foreground">{dens} density · 7 zones</p>
          <div className="mt-3 space-y-1 text-xs">{ZONES.slice(0, 4).map((z) => <div key={z.n} className="flex justify-between"><span>{z.n}</span><span className="font-mono">₹{(z.cost * mult).toFixed(1)}L</span></div>)}</div>
        </div>
      </aside>

      <div>
        <div className="mb-3 flex flex-wrap gap-1 border-b border-border">
          {["2D Before/After", "3D Rig", "Arch Locks", "Pins"].map((t) => <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 text-sm ${tab === t ? "border-b-2 border-primary text-primary" : "text-muted-foreground"}`}>{t}</button>)}
        </div>
        <div className={rendering ? "animate-pulse" : ""}>
          {tab === "2D Before/After" && <BeforeAfter before={venue.empty} after={after} pins={pins} tall />}
          {tab === "3D Rig" && <div className="relative aspect-[16/10] overflow-hidden rounded-sm"><img src={after} alt="" className="h-full w-full object-cover opacity-40" /><div className="absolute inset-0 bg-[linear-gradient(var(--border)_1px,transparent_1px),linear-gradient(90deg,var(--border)_1px,transparent_1px)] bg-[size:40px_40px]" /><p className="absolute bottom-3 left-3 font-mono text-xs">Rig · camera 1.6m · FOV 62°</p></div>}
          {tab === "Arch Locks" && <div className="relative aspect-[16/10]"><img src={venue.empty} alt="" className="h-full w-full rounded-sm object-cover" /><div className="absolute left-[10%] top-[8%] h-[80%] w-[80%] border-2 border-dashed border-primary" /></div>}
          {tab === "Pins" && <ol className="space-y-2">{["Floral arch on focal axis", "Column garlands (west)", "Column garlands (east)", "Aisle petal runner"].map((p, i) => <li key={p} className="border border-border bg-card p-3 text-sm"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{i + 1}</span>{p}</li>)}</ol>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Zone: {zone} · {ratio} · {engine} · renders: {renders}</p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {CANDIDATES.map((c, i) => (
            <button key={c} onClick={() => setCand(i)} className={`overflow-hidden border-2 ${cand === i ? "border-primary" : "border-transparent"}`}>
              <img src={c} alt={`Candidate ${i + 1}`} loading="lazy" className="aspect-[3/2] w-full object-cover" />
              <p className="bg-card py-1 text-xs">Candidate {String.fromCharCode(65 + i)}</p>
            </button>
          ))}
        </div>
      </div>

      <aside className="space-y-5 border border-border bg-card p-5">
        <div><Eyebrow>Aspect Ratio</Eyebrow>
          <div className="mt-2 grid grid-cols-3 gap-1">{["1:1", "4:5", "3:2", "16:9", "9:16", "21:9"].map((r) => <button key={r} onClick={() => setRatio(r)} className={`border py-1.5 text-xs ${ratio === r ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{r}</button>)}</div></div>
        <div><Eyebrow>Engine</Eyebrow>
          <div className="mt-2 flex border border-border">{["Photoreal", "Editorial"].map((e) => <button key={e} onClick={() => setEngine(e)} className={`flex-1 py-1.5 text-xs ${engine === e ? "bg-primary text-primary-foreground" : ""}`}>{e}</button>)}</div></div>
        <div><Eyebrow>Palette</Eyebrow>
          <div className="mt-2 flex gap-2">{pal.map((c, i) => (
            <label key={i} className="h-9 flex-1 cursor-pointer rounded-sm border border-border" style={{ background: c }}>
              <input type="color" value={c} onChange={(e) => setPal(pal.map((x, j) => (j === i ? e.target.value : x)))} className="invisible" />
            </label>))}</div></div>
        <div><Eyebrow>Density</Eyebrow>
          <div className="mt-2 grid grid-cols-2 gap-1">{DENS.map((d) => <button key={d} onClick={() => setDens(d)} className={`border py-1.5 text-xs ${dens === d ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{d}</button>)}</div></div>
        <div><div className="flex justify-between"><Eyebrow>Lighting</Eyebrow><span className="font-mono text-xs">{light}K</span></div>
          <input type="range" min={1800} max={6500} step={100} value={light} onChange={(e) => setLight(+e.target.value)} className="w-full accent-primary" /></div>
        <div><div className="flex justify-between"><Eyebrow>Intensity</Eyebrow><span className="font-mono text-xs">{intensity}%</span></div>
          <input type="range" value={intensity} onChange={(e) => setIntensity(+e.target.value)} className="w-full accent-primary" /></div>
        <div><Eyebrow>Focal Structure</Eyebrow>
          <select value={focal} onChange={(e) => setFocal(e.target.value)} className="mt-2 w-full border border-border bg-background px-2 py-2 text-sm">
            {["Floral Arch", "Mandap", "Chuppah", "Draped Canopy", "Flower Wall"].map((f) => <option key={f}>{f}</option>)}</select></div>
        <button disabled={rendering} onClick={() => { setRendering(true); setTimeout(() => { setRendering(false); setRenders((r) => r + 1); setCand((c) => (c + 1) % 3); }, 1400); }}
          className="w-full rounded-sm bg-primary py-3 text-sm text-primary-foreground disabled:opacity-60">{rendering ? "Rendering…" : `Re-Render ${zone}`}</button>
      </aside>
    </section>
  );
}

function VendorBrief({ venue }: { venue: Venue }) {
  const rows = [
    ["Florist", "Floral arch, 24 column garlands, 40 centrepieces", "Roses, orchids, eucalyptus", "₹6.8L"],
    ["Lighting", "Amber uplights, 6 chandeliers, fairy canopy", "2700K warm white", "₹3.2L"],
    ["Fabric & Draping", "Ceiling canopy, stage backdrop", "Ivory chiffon, gold trim", "₹2.4L"],
    ["Furniture", "420 chiavari chairs, lounge sofas", "Gold frame, ivory cushions", "₹2.1L"],
    ["Tableware", "Chargers, glassware, linen", "Champagne linen, gold rim", "₹1.6L"],
  ];
  const [done, setDone] = useState<number[]>([]);
  return (
    <section className="mx-auto max-w-4xl border border-border bg-card p-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><Eyebrow>05 · Vendor Brief</Eyebrow><h1 className="mt-2 text-4xl">{venue.name}</h1><p className="text-sm text-muted-foreground">{venue.type} · 420 guests</p></div>
        <button onClick={() => window.print()} className="rounded-sm bg-primary px-4 py-2 text-sm text-primary-foreground">Export PDF</button>
      </div>
      <img src={venue.decor} alt="Approved concept" className="mt-6 aspect-[21/9] w-full rounded-sm object-cover" />
      <p className="mb-2 mt-6 text-sm">Approved palette</p>
      <Swatches p={venue.palette} size="h-8" />
      <table className="mt-8 w-full text-sm">
        <thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2">✓</th><th>Vendor</th><th>Scope</th><th>Materials</th><th className="text-right">Budget</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r[0]} className="border-b border-border">
            <td className="py-3"><input type="checkbox" checked={done.includes(i)} onChange={() => setDone(done.includes(i) ? done.filter((x) => x !== i) : [...done, i])} className="accent-primary" /></td>
            <td className="font-medium">{r[0]}</td><td>{r[1]}</td><td className="text-muted-foreground">{r[2]}</td><td className="text-right font-mono">{r[3]}</td>
          </tr>))}</tbody>
      </table>
      <p className="mt-4 text-right text-sm">Confirmed {done.length}/{rows.length} · Total <span className="font-serif text-2xl">₹16.1L</span></p>
    </section>
  );
}
