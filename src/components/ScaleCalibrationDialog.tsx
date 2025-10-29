import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Ruler } from "lucide-react";

interface ScaleCalibrationDialogProps {
  open: boolean;
  onClose: () => void;
  onSetScale: (pixelDistance: number, realDistance: number, unit: string) => void;
  pixelDistance?: number;
}

export const ScaleCalibrationDialog = ({
  open,
  onClose,
  onSetScale,
  pixelDistance = 0,
}: ScaleCalibrationDialogProps) => {
  const [realDistance, setRealDistance] = useState("");
  const [unit, setUnit] = useState<"mm" | "cm" | "m" | "in" | "ft">("cm");

  const handleSetScale = () => {
    const distance = parseFloat(realDistance);
    if (!isNaN(distance) && distance > 0 && pixelDistance > 0) {
      onSetScale(pixelDistance, distance, unit);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Set Scale Calibration
          </DialogTitle>
          <DialogDescription>
            You've drawn a reference line of {Math.round(pixelDistance)} pixels. Enter the real-world distance this represents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="distance">Real-world Distance</Label>
            <Input
              id="distance"
              type="number"
              placeholder="Enter distance"
              value={realDistance}
              onChange={(e) => setRealDistance(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>

          <div>
            <Label>Unit of Measurement</Label>
            <RadioGroup value={unit} onValueChange={(value: any) => setUnit(value)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="mm" id="mm" />
                <Label htmlFor="mm" className="font-normal cursor-pointer">Millimeters (mm)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cm" id="cm" />
                <Label htmlFor="cm" className="font-normal cursor-pointer">Centimeters (cm)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="m" id="m" />
                <Label htmlFor="m" className="font-normal cursor-pointer">Meters (m)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="in" id="in" />
                <Label htmlFor="in" className="font-normal cursor-pointer">Inches (in)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ft" id="ft" />
                <Label htmlFor="ft" className="font-normal cursor-pointer">Feet (ft)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSetScale}
              disabled={!realDistance || parseFloat(realDistance) <= 0 || pixelDistance <= 0}
            >
              Set Scale
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};