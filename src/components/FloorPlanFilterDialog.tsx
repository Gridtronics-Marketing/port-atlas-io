import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { TRADE_CATEGORIES, TRADE_DISPLAY_NAMES, TRADE_TYPES, getTradeColor, type TradeType } from '@/lib/trade-registry';

export interface FloorPlanFilters {
  showDropPointLabels: boolean;
  showRoomViewDots: boolean;
  showWirePaths: boolean;
  dropPointTypes: string[];
  dropPointStatuses: string[];
  trades: string[];
  markerScale: number;
}

interface FloorPlanFilterDialogProps {
  filters: FloorPlanFilters;
  onFiltersChange: (filters: FloorPlanFilters) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}

const DROP_POINT_TYPES = [
  { value: 'data', label: 'Data' },
  { value: 'wifi', label: 'WiFi' },
  { value: 'camera', label: 'Camera' },
  { value: 'mdf', label: 'MDF' },
  { value: 'idf', label: 'IDF' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'av', label: 'A/V' },
  { value: 'speaker', label: 'Speaker' },
  { value: 'other', label: 'Other' },
];

const DROP_POINT_STATUSES = [
  { value: 'planned', label: 'Planned' },
  { value: 'roughed_in', label: 'Roughed In' },
  { value: 'finished', label: 'Finished' },
  { value: 'tested', label: 'Tested' },
];

export const FloorPlanFilterDialog = ({
  filters,
  onFiltersChange,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  hideTrigger = false,
}: FloorPlanFilterDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  const handleToggleType = (type: string) => {
    const newTypes = filters.dropPointTypes.includes(type)
      ? filters.dropPointTypes.filter(t => t !== type)
      : [...filters.dropPointTypes, type];
    
    onFiltersChange({ ...filters, dropPointTypes: newTypes });
  };

  const handleToggleStatus = (status: string) => {
    const newStatuses = filters.dropPointStatuses.includes(status)
      ? filters.dropPointStatuses.filter(s => s !== status)
      : [...filters.dropPointStatuses, status];
    
    onFiltersChange({ ...filters, dropPointStatuses: newStatuses });
  };

  const handleSelectAllTypes = () => {
    onFiltersChange({
      ...filters,
      dropPointTypes: DROP_POINT_TYPES.map(t => t.value),
    });
  };

  const handleDeselectAllTypes = () => {
    onFiltersChange({ ...filters, dropPointTypes: [] });
  };

  const handleSelectAllStatuses = () => {
    onFiltersChange({
      ...filters,
      dropPointStatuses: DROP_POINT_STATUSES.map(s => s.value),
    });
  };

  const handleDeselectAllStatuses = () => {
    onFiltersChange({ ...filters, dropPointStatuses: [] });
  };

  const handleToggleTrade = (trade: string) => {
    const newTrades = filters.trades.includes(trade)
      ? filters.trades.filter(t => t !== trade)
      : [...filters.trades, trade];
    onFiltersChange({ ...filters, trades: newTrades });
  };

  const handleSelectAllTrades = () => {
    onFiltersChange({ ...filters, trades: [...TRADE_TYPES] });
  };

  const handleDeselectAllTrades = () => {
    onFiltersChange({ ...filters, trades: [] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!hideTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Floor Plan Filters</DialogTitle>
          <DialogDescription>
            Control what appears on your floor plan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto pr-2">
          {/* Display Toggles */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Display Options</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showDropPointLabels"
                checked={filters.showDropPointLabels}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showDropPointLabels: checked as boolean })
                }
              />
              <Label htmlFor="showDropPointLabels" className="text-sm">
                Show Drop Point Labels
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showRoomViewDots"
                checked={filters.showRoomViewDots}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showRoomViewDots: checked as boolean })
                }
              />
              <Label htmlFor="showRoomViewDots" className="text-sm">
                Show Room View Camera Dots
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showWirePaths"
                checked={filters.showWirePaths}
                onCheckedChange={(checked) =>
                  onFiltersChange({ ...filters, showWirePaths: checked as boolean })
                }
              />
              <Label htmlFor="showWirePaths" className="text-sm">
                Show Wire Paths
              </Label>
            </div>
          </div>

          <Separator />

          {/* Marker Size Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Marker Size</h4>
              <span className="text-xs text-muted-foreground">
                {filters.markerScale === 0.5 ? 'Small' : filters.markerScale === 1 ? 'Medium' : filters.markerScale === 1.5 ? 'Large' : 'Extra Large'}
              </span>
            </div>
            <Slider
              value={[filters.markerScale]}
              onValueChange={([value]) =>
                onFiltersChange({ ...filters, markerScale: value })
              }
              min={0.5}
              max={2}
              step={0.25}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Small</span>
              <span>Large</span>
            </div>
          </div>

          <Separator />

          {/* Drop Point Types */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Drop Point Types</h4>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllTypes}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAllTypes}
                  className="h-7 text-xs"
                >
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DROP_POINT_TYPES.map((type) => (
                <div key={type.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`type-${type.value}`}
                    checked={filters.dropPointTypes.includes(type.value)}
                    onCheckedChange={() => handleToggleType(type.value)}
                  />
                  <Label htmlFor={`type-${type.value}`} className="text-sm">
                    {type.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Drop Point Statuses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Drop Point Statuses</h4>
              <div className="space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAllStatuses}
                  className="h-7 text-xs"
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAllStatuses}
                  className="h-7 text-xs"
                >
                  None
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DROP_POINT_STATUSES.map((status) => (
                <div key={status.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`status-${status.value}`}
                    checked={filters.dropPointStatuses.includes(status.value)}
                    onCheckedChange={() => handleToggleStatus(status.value)}
                  />
                  <Label htmlFor={`status-${status.value}`} className="text-sm">
                    {status.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Trades Filter */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Trades</h4>
              <div className="space-x-2">
                <Button variant="ghost" size="sm" onClick={handleSelectAllTrades} className="h-7 text-xs">All</Button>
                <Button variant="ghost" size="sm" onClick={handleDeselectAllTrades} className="h-7 text-xs">None</Button>
              </div>
            </div>
            {TRADE_CATEGORIES.map(category => (
              <div key={category.label} className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium">{category.label}</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {category.trades.map(trade => (
                    <div key={trade} className="flex items-center space-x-2">
                      <Checkbox
                        id={`trade-${trade}`}
                        checked={filters.trades.includes(trade)}
                        onCheckedChange={() => handleToggleTrade(trade)}
                      />
                      <Label htmlFor={`trade-${trade}`} className="text-sm">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1"
                          style={{ backgroundColor: `hsl(${getTradeColor(trade)})` }}
                        />
                        {TRADE_DISPLAY_NAMES[trade as TradeType]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};