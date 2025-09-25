import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, Activity } from 'lucide-react';

interface CapacityData {
  id: string;
  name: string;
  type: 'cable' | 'frame' | 'port';
  utilized: number;
  total: number;
  coordinates: {
    x: number;
    y: number;
  };
  trend?: 'increasing' | 'decreasing' | 'stable';
  alertLevel?: 'none' | 'warning' | 'critical';
}

interface CapacityUtilizationOverlayProps {
  capacityData: CapacityData[];
  showTrends?: boolean;
  showAlerts?: boolean;
  thresholds?: {
    warning: number;
    critical: number;
  };
}

export const CapacityUtilizationOverlay: React.FC<CapacityUtilizationOverlayProps> = ({
  capacityData,
  showTrends = true,
  showAlerts = true,
  thresholds = { warning: 75, critical: 90 }
}) => {
  const [animatedData, setAnimatedData] = useState<CapacityData[]>([]);

  useEffect(() => {
    // Animate capacity bars on mount
    const timer = setTimeout(() => {
      setAnimatedData(capacityData);
    }, 100);

    return () => clearTimeout(timer);
  }, [capacityData]);

  const getUtilizationPercentage = (utilized: number, total: number) => {
    return total > 0 ? (utilized / total) * 100 : 0;
  };

  const getAlertLevel = (percentage: number): 'none' | 'warning' | 'critical' => {
    if (percentage >= thresholds.critical) return 'critical';
    if (percentage >= thresholds.warning) return 'warning';
    return 'none';
  };

  const getAlertColor = (level: 'none' | 'warning' | 'critical') => {
    switch (level) {
      case 'critical': return 'bg-red-500 border-red-600';
      case 'warning': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-green-500 border-green-600';
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= thresholds.critical) return 'bg-red-500';
    if (percentage >= thresholds.warning) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTrendIcon = (trend?: string) => {
    if (!showTrends || !trend) return null;
    
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-3 w-3 text-red-500" />;
      case 'decreasing':
        return <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />;
      default:
        return <Activity className="h-3 w-3 text-blue-500" />;
    }
  };

  const renderCapacityIndicator = (item: CapacityData) => {
    const percentage = getUtilizationPercentage(item.utilized, item.total);
    const alertLevel = getAlertLevel(percentage);
    const shouldShowAlert = showAlerts && alertLevel !== 'none';

    return (
      <div
        key={item.id}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-fade-in"
        style={{
          left: `${item.coordinates.x}%`,
          top: `${item.coordinates.y}%`
        }}
      >
        {/* Capacity Ring */}
        <div className="relative">
          <div 
            className={`
              w-16 h-16 rounded-full border-4 flex items-center justify-center
              ${getAlertColor(alertLevel)} transition-all duration-500
              ${shouldShowAlert ? 'animate-pulse' : ''}
            `}
            style={{
              background: `conic-gradient(
                ${percentage >= thresholds.critical ? '#ef4444' : 
                  percentage >= thresholds.warning ? '#f59e0b' : '#10b981'} 
                ${percentage * 3.6}deg, 
                rgba(255, 255, 255, 0.3) 0deg
              )`
            }}
          >
            {/* Inner Circle */}
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
              <div className="text-center">
                <div className="text-xs font-bold">{Math.round(percentage)}%</div>
                <div className="text-[10px] text-muted-foreground">
                  {item.utilized}/{item.total}
                </div>
              </div>
            </div>

            {/* Alert Indicator */}
            {shouldShowAlert && (
              <div className="absolute -top-1 -right-1">
                <AlertTriangle className="h-4 w-4 text-red-500 animate-bounce" />
              </div>
            )}

            {/* Trend Indicator */}
            {getTrendIcon(item.trend) && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 border">
                {getTrendIcon(item.trend)}
              </div>
            )}
          </div>

          {/* Equipment Label */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
            <Card className="bg-white/90 backdrop-blur-sm border shadow-sm">
              <CardContent className="p-2">
                <div className="text-xs font-medium text-center">{item.name}</div>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Badge variant="outline" className="text-[10px] px-1">
                    {item.type.toUpperCase()}
                  </Badge>
                  {alertLevel !== 'none' && (
                    <Badge 
                      variant={alertLevel === 'critical' ? 'destructive' : 'default'}
                      className="text-[10px] px-1"
                    >
                      {alertLevel.toUpperCase()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  const renderLegend = () => (
    <div className="absolute top-4 right-4 z-10">
      <Card className="bg-white/90 backdrop-blur-sm">
        <CardContent className="p-3">
          <h4 className="text-sm font-medium mb-2">Capacity Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Good (&lt; {thresholds.warning}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Warning ({thresholds.warning}-{thresholds.critical}%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Critical (&gt; {thresholds.critical}%)</span>
            </div>
            {showTrends && (
              <>
                <hr className="my-2" />
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-red-500" />
                  <span>Increasing</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-green-500 rotate-180" />
                  <span>Decreasing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="h-3 w-3 text-blue-500" />
                  <span>Stable</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Capacity Indicators */}
      <div className="relative w-full h-full">
        {(animatedData.length > 0 ? animatedData : capacityData).map(renderCapacityIndicator)}
      </div>

      {/* Legend */}
      {renderLegend()}

      {/* Summary Statistics */}
      <div className="absolute bottom-4 left-4 z-10">
        <Card className="bg-white/90 backdrop-blur-sm">
          <CardContent className="p-3">
            <h4 className="text-sm font-medium mb-2">Capacity Summary</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Total Items:</span>
                <span className="font-medium">{capacityData.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Critical:</span>
                <span className="font-medium text-red-600">
                  {capacityData.filter(item => 
                    getAlertLevel(getUtilizationPercentage(item.utilized, item.total)) === 'critical'
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Warning:</span>
                <span className="font-medium text-yellow-600">
                  {capacityData.filter(item => 
                    getAlertLevel(getUtilizationPercentage(item.utilized, item.total)) === 'warning'
                  ).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Good:</span>
                <span className="font-medium text-green-600">
                  {capacityData.filter(item => 
                    getAlertLevel(getUtilizationPercentage(item.utilized, item.total)) === 'none'
                  ).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};