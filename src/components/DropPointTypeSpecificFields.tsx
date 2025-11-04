import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface TypeSpecificFieldsProps {
  pointType: string;
  typeSpecificData: any;
  onDataChange: (data: any) => void;
  isEditing: boolean;
}

export const DropPointTypeSpecificFields = ({
  pointType,
  typeSpecificData,
  onDataChange,
  isEditing,
}: TypeSpecificFieldsProps) => {
  const updateField = (field: string, value: any) => {
    onDataChange({ ...typeSpecificData, [field]: value });
  };

  // Data / WiFi / Camera Types
  if (['data', 'wifi', 'camera'].includes(pointType)) {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="cable_type">Cable Type</Label>
          {isEditing ? (
            <Select
              value={typeSpecificData?.cable_type || 'cat6'}
              onValueChange={(value) => updateField('cable_type', value)}
            >
              <SelectTrigger id="cable_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cat6">Cat6</SelectItem>
                <SelectItem value="cat6a">Cat6A</SelectItem>
                <SelectItem value="fiber_sm">Fiber SM</SelectItem>
                <SelectItem value="fiber_om4">Fiber OM4</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm">{typeSpecificData?.cable_type || 'Cat6'}</div>
          )}
        </div>

        {typeSpecificData?.cable_type === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="cable_type_other">Specify Cable Type</Label>
            {isEditing ? (
              <Input
                id="cable_type_other"
                value={typeSpecificData?.cable_type_other || ''}
                onChange={(e) => updateField('cable_type_other', e.target.value)}
              />
            ) : (
              <div className="text-sm">{typeSpecificData?.cable_type_other || 'N/A'}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // MDF/IDF Type
  if (pointType === 'mdf_idf') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mdf_idf_type">Type</Label>
          {isEditing ? (
            <Select
              value={typeSpecificData?.mdf_idf_type || 'idf'}
              onValueChange={(value) => updateField('mdf_idf_type', value)}
            >
              <SelectTrigger id="mdf_idf_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mdf">MDF (Main Distribution Frame)</SelectItem>
                <SelectItem value="idf">IDF (Intermediate Distribution Frame)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm">{typeSpecificData?.mdf_idf_type === 'mdf' ? 'MDF' : 'IDF'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patch_panel">Patch Panel</Label>
          {isEditing ? (
            <Select
              value={typeSpecificData?.patch_panel || ''}
              onValueChange={(value) => updateField('patch_panel', value)}
            >
              <SelectTrigger id="patch_panel">
                <SelectValue placeholder="Select patch panel..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Panel 1 (Ports 1-24)</SelectItem>
                <SelectItem value="2">Panel 2 (Ports 25-48)</SelectItem>
                <SelectItem value="3">Panel 3 (Ports 49-72)</SelectItem>
                <SelectItem value="4">Panel 4 (Ports 73-96)</SelectItem>
                <SelectItem value="5">Panel 5 (Ports 97-120)</SelectItem>
                <SelectItem value="6">Panel 6 (Ports 121-144)</SelectItem>
                <SelectItem value="7">Panel 7 (Ports 145-168)</SelectItem>
                <SelectItem value="8">Panel 8 (Ports 169-192)</SelectItem>
                <SelectItem value="9">Panel 9 (Ports 193-216)</SelectItem>
                <SelectItem value="10">Panel 10 (Ports 217-240)</SelectItem>
                <SelectItem value="11">Panel 11 (Ports 241-264)</SelectItem>
                <SelectItem value="12">Panel 12 (Ports 265-288)</SelectItem>
                <SelectItem value="13">Panel 13 (Ports 289-312)</SelectItem>
                <SelectItem value="14">Panel 14 (Ports 313-336)</SelectItem>
                <SelectItem value="15">Panel 15 (Ports 337-360)</SelectItem>
                <SelectItem value="16">Panel 16 (Ports 361-384)</SelectItem>
                <SelectItem value="17">Panel 17 (Ports 385-408)</SelectItem>
                <SelectItem value="18">Panel 18 (Ports 409-432)</SelectItem>
                <SelectItem value="19">Panel 19 (Ports 433-456)</SelectItem>
                <SelectItem value="20">Panel 20 (Ports 457-480)</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm">
              {typeSpecificData?.patch_panel ? `Panel ${typeSpecificData.patch_panel}` : 'Not selected'}
            </div>
          )}
        </div>

        {typeSpecificData?.patch_panel && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Port Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground mb-2">
                Configure what each port is connected to
              </div>
              <Separator className="my-2" />
              <div className="space-y-1 max-h-[200px] overflow-y-auto text-xs">
                {Array.from({ length: 24 }, (_, i) => {
                  const panelNum = parseInt(typeSpecificData.patch_panel);
                  const portNum = (panelNum - 1) * 24 + i + 1;
                  const portConfig = typeSpecificData?.port_configs?.[portNum] || '';
                  
                  return (
                    <div key={portNum} className="flex items-center gap-2">
                      <span className="w-12 text-muted-foreground">Port {portNum}:</span>
                      {isEditing ? (
                        <Input
                          value={portConfig}
                          onChange={(e) => {
                            const configs = { ...typeSpecificData?.port_configs, [portNum]: e.target.value };
                            updateField('port_configs', configs);
                          }}
                          placeholder="e.g., Sw1 port 5"
                          className="h-7 text-xs"
                        />
                      ) : (
                        <span className="text-sm">{portConfig || '—'}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Access Control Type
  if (pointType === 'access_control') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ac_type">Type</Label>
          {isEditing ? (
            <Select
              value={typeSpecificData?.ac_type || 'door'}
              onValueChange={(value) => updateField('ac_type', value)}
            >
              <SelectTrigger id="ac_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="door">Door</SelectItem>
                <SelectItem value="panel">Panel</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm capitalize">{typeSpecificData?.ac_type || 'Door'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="locking_mechanism">Locking Mechanism</Label>
          {isEditing ? (
            <Select
              value={typeSpecificData?.locking_mechanism || 'strike'}
              onValueChange={(value) => updateField('locking_mechanism', value)}
            >
              <SelectTrigger id="locking_mechanism">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="strike">Strike</SelectItem>
                <SelectItem value="mag_lock">Mag Lock</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm capitalize">{typeSpecificData?.locking_mechanism?.replace('_', ' ') || 'Strike'}</div>
          )}
        </div>

        {typeSpecificData?.locking_mechanism === 'other' && (
          <div className="space-y-2">
            <Label htmlFor="locking_mechanism_other">Specify Mechanism</Label>
            {isEditing ? (
              <Input
                id="locking_mechanism_other"
                value={typeSpecificData?.locking_mechanism_other || ''}
                onChange={(e) => updateField('locking_mechanism_other', e.target.value)}
              />
            ) : (
              <div className="text-sm">{typeSpecificData?.locking_mechanism_other || 'N/A'}</div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>REX Devices</Label>
          <div className="space-y-2">
            {['motion', 'push_to_release', 'other'].map((device) => (
              <div key={device} className="flex items-center space-x-2">
                <Checkbox
                  id={`rex_${device}`}
                  checked={typeSpecificData?.rex_devices?.includes(device) || false}
                  onCheckedChange={(checked) => {
                    const current = typeSpecificData?.rex_devices || [];
                    const updated = checked
                      ? [...current, device]
                      : current.filter((d: string) => d !== device);
                    updateField('rex_devices', updated);
                  }}
                  disabled={!isEditing}
                />
                <Label htmlFor={`rex_${device}`} className="text-sm capitalize cursor-pointer">
                  {device.replace('_', ' ')}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {typeSpecificData?.rex_devices?.includes('other') && (
          <div className="space-y-2">
            <Label htmlFor="rex_other">Specify Other REX Device</Label>
            {isEditing ? (
              <Input
                id="rex_other"
                value={typeSpecificData?.rex_other || ''}
                onChange={(e) => updateField('rex_other', e.target.value)}
              />
            ) : (
              <div className="text-sm">{typeSpecificData?.rex_other || 'N/A'}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  // A/V Type
  if (pointType === 'av') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="av_type">Type</Label>
          {isEditing ? (
            <Select
              value={typeSpecificData?.av_type || 'tv'}
              onValueChange={(value) => updateField('av_type', value)}
            >
              <SelectTrigger id="av_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tv">TV</SelectItem>
                <SelectItem value="speaker">Speaker</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm uppercase">{typeSpecificData?.av_type || 'TV'}</div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="av_setup">Setup Description</Label>
          {isEditing ? (
            <Textarea
              id="av_setup"
              value={typeSpecificData?.av_setup || ''}
              onChange={(e) => updateField('av_setup', e.target.value)}
              placeholder="Describe the A/V setup..."
              rows={4}
            />
          ) : (
            <div className="text-sm whitespace-pre-wrap">{typeSpecificData?.av_setup || 'No description'}</div>
          )}
        </div>
      </div>
    );
  }

  // Other Type
  if (pointType === 'other') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="other_description">Description</Label>
          {isEditing ? (
            <Textarea
              id="other_description"
              value={typeSpecificData?.other_description || ''}
              onChange={(e) => updateField('other_description', e.target.value)}
              placeholder="Describe this drop point..."
              rows={4}
            />
          ) : (
            <div className="text-sm whitespace-pre-wrap">{typeSpecificData?.other_description || 'No description'}</div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
