import { useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FielderPosition, FieldPreset } from "@/types/tactics";

interface Props {
  fielders: FielderPosition[];
  preset: FieldPreset;
  onChange: (fielders: FielderPosition[]) => void;
  onPresetChange: (preset: FieldPreset) => void;
}

export const PRESET_FIELDS: Record<FieldPreset, FielderPosition[]> = {
  attacking: [
    { id: "wk", name: "Keeper", x: 0.5, y: 0.78 },
    { id: "slip1", name: "1st Slip", x: 0.42, y: 0.76 },
    { id: "slip2", name: "2nd Slip", x: 0.36, y: 0.74 },
    { id: "gully", name: "Gully", x: 0.3, y: 0.7 },
    { id: "point", name: "Point", x: 0.18, y: 0.55 },
    { id: "cover", name: "Cover", x: 0.28, y: 0.4 },
    { id: "mid_off", name: "Mid Off", x: 0.42, y: 0.28 },
    { id: "mid_on", name: "Mid On", x: 0.58, y: 0.28 },
    { id: "midwk", name: "Mid Wicket", x: 0.72, y: 0.4 },
    { id: "sqleg", name: "Square Leg", x: 0.82, y: 0.55 },
  ],
  balanced: [
    { id: "wk", name: "Keeper", x: 0.5, y: 0.82 },
    { id: "slip1", name: "Slip", x: 0.42, y: 0.78 },
    { id: "point", name: "Point", x: 0.12, y: 0.55 },
    { id: "cover", name: "Cover", x: 0.25, y: 0.4 },
    { id: "mid_off", name: "Mid Off", x: 0.4, y: 0.18 },
    { id: "long_off", name: "Long Off", x: 0.4, y: 0.06 },
    { id: "mid_on", name: "Mid On", x: 0.6, y: 0.18 },
    { id: "midwk", name: "Mid Wicket", x: 0.75, y: 0.4 },
    { id: "sqleg", name: "Square Leg", x: 0.88, y: 0.55 },
    { id: "finel", name: "Fine Leg", x: 0.7, y: 0.78 },
  ],
  defensive: [
    { id: "wk", name: "Keeper", x: 0.5, y: 0.82 },
    { id: "third", name: "Third Man", x: 0.18, y: 0.78 },
    { id: "point", name: "Deep Point", x: 0.06, y: 0.55 },
    { id: "cover", name: "Deep Cover", x: 0.18, y: 0.3 },
    { id: "long_off", name: "Long Off", x: 0.4, y: 0.04 },
    { id: "long_on", name: "Long On", x: 0.6, y: 0.04 },
    { id: "midwk", name: "Deep Mid Wkt", x: 0.82, y: 0.3 },
    { id: "sqleg", name: "Deep Sq Leg", x: 0.94, y: 0.55 },
    { id: "finel", name: "Fine Leg", x: 0.82, y: 0.78 },
    { id: "mid_off", name: "Mid Off", x: 0.42, y: 0.28 },
  ],
  death: [
    { id: "wk", name: "Keeper", x: 0.5, y: 0.82 },
    { id: "third", name: "Third Man", x: 0.18, y: 0.78 },
    { id: "point", name: "Deep Point", x: 0.06, y: 0.55 },
    { id: "long_off", name: "Long Off", x: 0.4, y: 0.04 },
    { id: "long_on", name: "Long On", x: 0.6, y: 0.04 },
    { id: "cow", name: "Cow Corner", x: 0.86, y: 0.18 },
    { id: "midwk", name: "Deep Mid Wkt", x: 0.92, y: 0.4 },
    { id: "sqleg", name: "Deep Sq Leg", x: 0.96, y: 0.6 },
    { id: "finel", name: "Fine Leg", x: 0.82, y: 0.78 },
    { id: "yorkerstop", name: "Short Mid Off", x: 0.45, y: 0.32 },
  ],
};

const FieldPlacementEditor = ({ fielders, preset, onChange, onPresetChange }: Props) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<string | null>(null);

  const setPreset = (p: FieldPreset) => {
    onPresetChange(p);
    onChange(PRESET_FIELDS[p]);
  };

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = Math.min(0.98, Math.max(0.02, (e.clientX - rect.left) / rect.width));
    const y = Math.min(0.98, Math.max(0.02, (e.clientY - rect.top) / rect.height));
    onChange(fielders.map(f => (f.id === dragging ? { ...f, x, y } : f)));
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>Field Placement</span>
          <Badge variant="outline" className="capitalize">{preset}</Badge>
        </CardTitle>
        <div className="flex flex-wrap gap-2 pt-2">
          {(['attacking', 'balanced', 'defensive', 'death'] as FieldPreset[]).map(p => (
            <Button
              key={p}
              size="sm"
              variant={preset === p ? 'default' : 'outline'}
              onClick={() => setPreset(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-square max-w-md mx-auto select-none">
          <svg
            ref={svgRef}
            viewBox="0 0 100 100"
            className="w-full h-full touch-none"
            onPointerMove={handlePointer}
            onPointerUp={() => setDragging(null)}
            onPointerLeave={() => setDragging(null)}
          >
            {/* Outfield */}
            <circle cx="50" cy="50" r="48" fill="hsl(var(--primary) / 0.08)" stroke="hsl(var(--primary) / 0.4)" strokeWidth="0.4" />
            {/* 30 yard circle */}
            <circle cx="50" cy="50" r="22" fill="none" stroke="hsl(var(--primary) / 0.35)" strokeWidth="0.3" strokeDasharray="1 1" />
            {/* Pitch */}
            <rect x="47" y="40" width="6" height="20" fill="hsl(var(--accent) / 0.6)" stroke="hsl(var(--accent))" strokeWidth="0.2" />
            {/* Stumps */}
            <line x1="48" y1="40" x2="52" y2="40" stroke="hsl(var(--accent-foreground))" strokeWidth="0.4" />
            <line x1="48" y1="60" x2="52" y2="60" stroke="hsl(var(--accent-foreground))" strokeWidth="0.4" />

            {/* Fielders */}
            {fielders.map(f => (
              <g
                key={f.id}
                transform={`translate(${f.x * 100} ${f.y * 100})`}
                style={{ cursor: 'grab' }}
                onPointerDown={() => setDragging(f.id)}
              >
                <circle r="2.4" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="0.5" />
                <text y="-3" textAnchor="middle" fontSize="2.2" fill="hsl(var(--foreground))" className="pointer-events-none">
                  {f.name}
                </text>
              </g>
            ))}
            {/* Batsman marker */}
            <circle cx="50" cy="58" r="1.6" fill="hsl(var(--destructive))" />
          </svg>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Drag fielders to fine-tune. Presets reset positions.
        </p>
      </CardContent>
    </Card>
  );
};

export default FieldPlacementEditor;
