import { MapPin, Users, Cable, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocations } from "@/hooks/useLocations";
import { useClients } from "@/hooks/useClients";
import { useDropPoints } from "@/hooks/useDropPoints";
import { useEmployees } from "@/hooks/useEmployees";

export const StatsOverview = () => {
  const { locations } = useLocations();
  const { clients } = useClients();
  const { dropPoints } = useDropPoints();
  const { employees } = useEmployees();

  const activeLocations = locations.filter(loc => loc.status === 'Active').length;
  const totalDropPoints = dropPoints.length;
  const completedDropPoints = dropPoints.filter(dp => dp.status === 'tested' || dp.status === 'finished').length;
  const completionRate = totalDropPoints > 0 ? Math.round((completedDropPoints / totalDropPoints) * 100) : 0;

  const stats = [
    {
      title: "Active Locations",
      value: activeLocations.toString(),
      change: `${locations.length} total`,
      icon: MapPin,
      color: "text-primary",
    },
    {
      title: "Total Clients",
      value: clients.length.toString(),
      change: `${clients.filter(c => c.status === 'Active').length} active`,
      icon: Users,
      color: "text-success",
    },
    {
      title: "Drop Points",
      value: totalDropPoints.toString(),
      change: `${completedDropPoints} completed`,
      icon: Cable,
      color: "text-warning",
    },
    {
      title: "Completion Rate",
      value: `${completionRate}%`,
      change: `${employees.filter(e => e.status === 'Active').length} active employees`,
      icon: CheckCircle,
      color: "text-success",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <Card key={index} className="shadow-soft hover:shadow-medium transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};