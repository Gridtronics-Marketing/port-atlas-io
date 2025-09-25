import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useConfigurableDropdown } from '@/hooks/useConfigurableDropdown';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfigurableSelectProps {
  category: string;
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const ConfigurableSelect = ({
  category,
  value,
  onValueChange,
  placeholder = "Select option...",
  disabled = false,
  className
}: ConfigurableSelectProps) => {
  const { options, loading, isEmpty } = useConfigurableDropdown(category);

  if (loading) {
    return <Skeleton className="h-10 w-full" />;
  }

  if (isEmpty) {
    return (
      <Select disabled>
        <SelectTrigger className={className}>
          <SelectValue placeholder="No options configured" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="bg-background border border-border shadow-md">
        {options.map((option) => (
          <SelectItem key={option.key} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};