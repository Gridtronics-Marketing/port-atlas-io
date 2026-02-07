import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { DistributionFrame } from "@/hooks/useDistributionFrames";

export interface MdfIdfConnection {
  frame_id: string;
  port: string;
  notes: string;
}

/** Minimal shape for MDF/IDF drop points shown in the selector */
export interface MdfIdfDropPointOption {
  id: string;
  label: string;
  point_type: string;
  floor: number | null;
  room: string | null;
}

interface MdfIdfConnectionFieldsProps {
  connections: MdfIdfConnection[];
  onChange: (connections: MdfIdfConnection[]) => void;
  frames: DistributionFrame[];
  framesLoading: boolean;
  currentFloor?: number;
  /** MDF/IDF drop points at this location (from drop_points table) */
  mdfIdfDropPoints?: MdfIdfDropPointOption[];
}

export const MdfIdfConnectionFields = ({
  connections,
  onChange,
  frames,
  framesLoading,
  currentFloor,
  mdfIdfDropPoints = [],
}: MdfIdfConnectionFieldsProps) => {
  const addConnection = () => {
    onChange([...connections, { frame_id: "", port: "", notes: "" }]);
  };

  const removeConnection = (index: number) => {
    onChange(connections.filter((_, i) => i !== index));
  };

  const updateConnection = (index: number, field: keyof MdfIdfConnection, value: string) => {
    const updated = connections.map((conn, i) =>
      i === index ? { ...conn, [field]: value } : conn
    );
    onChange(updated);
  };

  // Build unified options from both distribution_frames and MDF/IDF drop points
  type SelectOption = { id: string; label: string; source: 'frame' | 'drop_point' };

  const buildOptions = (): SelectOption[] => {
    const opts: SelectOption[] = [];

    // Distribution frames (prioritize same floor)
    const floorFrames = currentFloor != null
      ? frames.filter(f => f.floor === currentFloor)
      : frames;
    const displayFrames = floorFrames.length > 0 ? floorFrames : frames;

    for (const frame of displayFrames) {
      const label = frame.name
        ? `${frame.name} (${frame.frame_type})`
        : `${frame.frame_type} – Floor ${frame.floor}${frame.room ? ` (${frame.room})` : ""}`;
      opts.push({ id: frame.id, label, source: 'frame' });
    }

    // MDF/IDF drop points
    for (const dp of mdfIdfDropPoints) {
      // Skip if already represented as a distribution frame (by matching ID)
      if (opts.some(o => o.id === dp.id)) continue;
      const typeLabel = dp.point_type.toUpperCase();
      const floorStr = dp.floor != null ? ` – Floor ${dp.floor}` : '';
      const roomStr = dp.room ? ` (${dp.room})` : '';
      opts.push({
        id: dp.id,
        label: `${dp.label} (${typeLabel}${floorStr}${roomStr})`,
        source: 'drop_point',
      });
    }

    return opts;
  };

  const options = buildOptions();
  const hasOptions = options.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">MDF / IDF Connection</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={addConnection}
          className="h-7 text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add
        </Button>
      </div>

      {connections.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No connections specified.{" "}
          <button type="button" onClick={addConnection} className="underline text-primary">
            Add one
          </button>
        </p>
      )}

      <div className="space-y-3">
        {connections.map((conn, index) => (
          <div key={index} className="border rounded-md p-3 space-y-2 relative">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Connection {index + 1}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeConnection(index)}
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>

            {hasOptions ? (
              <div className="space-y-1">
                <Label className="text-xs">MDF/IDF</Label>
                <Select
                  value={conn.frame_id}
                  onValueChange={(val) => updateConnection(index, "frame_id", val)}
                >
                  <SelectTrigger className="h-8 text-sm bg-background">
                    <SelectValue placeholder="Select MDF/IDF..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {options.map((opt) => (
                      <SelectItem key={opt.id} value={opt.id}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-xs">MDF/IDF Name</Label>
                <Input
                  value={conn.frame_id}
                  onChange={(e) => updateConnection(index, "frame_id", e.target.value)}
                  placeholder="e.g., IDF-2A"
                  className="h-8 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  No MDF/IDF equipment at this location yet. Add an MDF or IDF drop point first.
                </p>
              </div>
            )}

            <div className="space-y-1">
              <Label className="text-xs">Port / Panel</Label>
              <Input
                value={conn.port}
                onChange={(e) => updateConnection(index, "port", e.target.value)}
                placeholder="e.g., Panel 1, Port 12"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Notes (optional)</Label>
              <Input
                value={conn.notes}
                onChange={(e) => updateConnection(index, "notes", e.target.value)}
                placeholder="Additional details..."
                className="h-8 text-sm"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
