import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CableNameFieldsProps {
  cableCount: number;
  cableNames: Record<number, string>;
  onChange: (names: Record<number, string>) => void;
}

export const CableNameFields = ({ cableCount, cableNames, onChange }: CableNameFieldsProps) => {
  if (cableCount <= 1) return null;

  const handleChange = (index: number, value: string) => {
    onChange({ ...cableNames, [index]: value });
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Cable Names</Label>
      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
        {Array.from({ length: cableCount }, (_, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8 shrink-0">#{i + 1}</span>
            <Input
              value={cableNames[i] || ""}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`Cable ${i + 1} name`}
              className="h-8 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
};
