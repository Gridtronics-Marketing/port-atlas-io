interface DropPointColorLegendProps {
  className?: string;
}

export const DropPointColorLegend = ({ className = "" }: DropPointColorLegendProps) => {
  return (
    <div className={`flex items-center gap-4 text-xs ${className}`}>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600 shadow-sm"></div>
        <span className="text-muted-foreground">Planned</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600 shadow-sm"></div>
        <span className="text-muted-foreground">Roughed In</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600 shadow-sm"></div>
        <span className="text-muted-foreground">Finished</span>
      </span>
      <span className="flex items-center gap-1.5">
        <div className="relative w-3 h-3 rounded-full bg-green-500 border border-green-600 shadow-sm">
          <div className="absolute inset-0 flex items-center justify-center text-white text-[8px] font-bold">✓</div>
        </div>
        <span className="text-muted-foreground">Tested</span>
      </span>
    </div>
  );
};
