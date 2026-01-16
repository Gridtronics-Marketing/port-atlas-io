import { 
  Folder, 
  BookOpen, 
  UserPlus, 
  Wrench, 
  ShieldCheck, 
  Building, 
  MapPin,
  FileText,
  Lightbulb,
  Settings,
  Package,
  Video,
  Camera,
  Bell,
  Star,
  BarChart,
  Lock,
  Briefcase,
  GraduationCap,
  Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface TradeTubeIconPickerProps {
  selectedIcon: string;
  onSelectIcon: (icon: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'folder', Icon: Folder, label: 'Folder' },
  { name: 'book-open', Icon: BookOpen, label: 'Guides' },
  { name: 'user-plus', Icon: UserPlus, label: 'Onboarding' },
  { name: 'wrench', Icon: Wrench, label: 'Tools' },
  { name: 'shield-check', Icon: ShieldCheck, label: 'Safety' },
  { name: 'building', Icon: Building, label: 'Office' },
  { name: 'map-pin', Icon: MapPin, label: 'Field' },
  { name: 'file-text', Icon: FileText, label: 'Documents' },
  { name: 'lightbulb', Icon: Lightbulb, label: 'Ideas' },
  { name: 'settings', Icon: Settings, label: 'Config' },
  { name: 'package', Icon: Package, label: 'Inventory' },
  { name: 'video', Icon: Video, label: 'Video' },
  { name: 'camera', Icon: Camera, label: 'Photos' },
  { name: 'bell', Icon: Bell, label: 'Announcements' },
  { name: 'star', Icon: Star, label: 'Featured' },
  { name: 'bar-chart', Icon: BarChart, label: 'Reports' },
  { name: 'lock', Icon: Lock, label: 'Confidential' },
  { name: 'briefcase', Icon: Briefcase, label: 'Business' },
  { name: 'graduation-cap', Icon: GraduationCap, label: 'Training' },
  { name: 'tag', Icon: Tag, label: 'Categories' },
];

export function TradeTubeIconPicker({ selectedIcon, onSelectIcon }: TradeTubeIconPickerProps) {
  return (
    <div className="space-y-2">
      <Label>Icon</Label>
      <div className="grid grid-cols-7 gap-1 p-2 border rounded-md bg-muted/30">
        {AVAILABLE_ICONS.map(({ name, Icon, label }) => (
          <Button
            key={name}
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 transition-colors",
              selectedIcon === name && "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={() => onSelectIcon(name)}
            title={label}
          >
            <Icon className="h-4 w-4" />
          </Button>
        ))}
      </div>
    </div>
  );
}

export { AVAILABLE_ICONS };
