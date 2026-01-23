import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailBrandingSettings } from "@/components/EmailBrandingSettings";

export function PlatformSettingsPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Settings</CardTitle>
          <CardDescription>
            Global settings for your Trade Atlas platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <EmailBrandingSettings />
        </CardContent>
      </Card>
    </div>
  );
}
