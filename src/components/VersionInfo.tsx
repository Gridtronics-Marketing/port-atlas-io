import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { APP_VERSION, VERSION_HISTORY } from "@/lib/version";
import { Calendar, Package } from "lucide-react";

export const VersionInfo = () => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Version Information
            </CardTitle>
            <CardDescription>Current version and changelog</CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            v{APP_VERSION}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {VERSION_HISTORY.map((version, index) => (
            <div key={version.version}>
              {index > 0 && <Separator className="my-6" />}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Version {version.version}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {version.date}
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  {version.changes.map((change, changeIndex) => (
                    <li key={changeIndex} className="flex items-start gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span className="text-muted-foreground">{change}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
