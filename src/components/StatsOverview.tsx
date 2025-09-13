import { MapPin, Users, Cable, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  {
    title: "Active Locations",
    value: "12",
    change: "+2 this month",
    icon: MapPin,
    color: "text-primary",
  },
  {
    title: "Total Clients",
    value: "8",
    change: "+1 this week",
    icon: Users,
    color: "text-success",
  },
  {
    title: "Drop Points",
    value: "248",
    change: "+15 today",
    icon: Cable,
    color: "text-warning",
  },
  {
    title: "Completed Jobs",
    value: "95%",
    change: "+5% this week",
    icon: CheckCircle,
    color: "text-success",
  },
];

export const StatsOverview = () => {
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