interface DropPointColorLegendProps {
  className?: string;
}

export const DropPointColorLegend = ({ className = "" }: DropPointColorLegendProps) => {
  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-gray-500 border border-gray-600 shadow-sm"></div>
        <span className="text-muted-foreground">Planned</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600 shadow-sm"></div>
        <span className="text-muted-foreground">Installed</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600 shadow-sm"></div>
        <span className="text-muted-foreground">Tested</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600 shadow-sm"></div>
        <span className="text-muted-foreground">Active</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600 shadow-sm"></div>
        <span className="text-muted-foreground">Inactive</span>
      </span>
    </div>
  );
};
