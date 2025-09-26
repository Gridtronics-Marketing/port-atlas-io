import React, { useState, useEffect } from 'react';
import { useOpenPhone, type ContactMatch } from '@/hooks/useOpenPhone';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Phone, PhoneCall, User, Building, Package, ClipboardList, X } from 'lucide-react';

interface CallScreenPopProps {
  isOpen: boolean;
  onClose: () => void;
  callData?: {
    id: string;
    direction: 'inbound' | 'outbound';
    phoneNumber: string;
    contact?: ContactMatch;
    duration?: number;
    status: string;
  };
}

export const CallScreenPop: React.FC<CallScreenPopProps> = ({ isOpen, onClose, callData }) => {
  const { updateCallDisposition } = useOpenPhone();
  const [disposition, setDisposition] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSaveDisposition = async () => {
    if (!callData?.id || !disposition) return;

    setSaving(true);
    try {
      await updateCallDisposition(callData.id, disposition, notes);
      onClose();
    } catch (error) {
      console.error('Error saving call disposition:', error);
    } finally {
      setSaving(false);
    }
  };

  const getContactIcon = (type?: string) => {
    switch (type) {
      case 'employee': return <User className="h-5 w-5 text-blue-500" />;
      case 'client': return <Building className="h-5 w-5 text-green-500" />;
      case 'supplier': return <Package className="h-5 w-5 text-orange-500" />;
      default: return <Phone className="h-5 w-5 text-gray-500" />;
    }
  };

  const dispositionOptions = [
    'Call completed successfully',
    'Follow-up required',
    'Work order created',
    'Information provided',
    'Scheduled appointment',
    'Left voicemail',
    'No answer',
    'Busy signal',
    'Wrong number',
    'Complaint received',
    'Quote requested',
    'Order placed',
  ];

  if (!callData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-3">
            {callData.direction === 'inbound' ? 
              <PhoneCall className="h-5 w-5 text-green-500" /> : 
              <Phone className="h-5 w-5 text-blue-500" />
            }
            <span>
              {callData.direction === 'inbound' ? 'Incoming Call' : 'Outgoing Call'}
            </span>
            <Badge variant={callData.status === 'completed' ? 'default' : 'secondary'}>
              {callData.status}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Call Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Phone className="h-5 w-5" />
                <span>Call Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
                  <p className="text-lg font-mono">{callData.phoneNumber}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Duration</p>
                  <p className="text-lg">
                    {callData.duration ? 
                      `${Math.floor(callData.duration / 60)}:${(callData.duration % 60).toString().padStart(2, '0')}` :
                      'In progress...'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {callData.contact ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  {getContactIcon(callData.contact.type)}
                  <span>Contact Information</span>
                  <Badge variant="outline" className="capitalize">
                    {callData.contact.type}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Name</p>
                    <p className="text-lg font-semibold">{callData.contact.name}</p>
                  </div>
                  {callData.contact.email && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p>{callData.contact.email}</p>
                    </div>
                  )}
                  
                  {/* Recent Activity */}
                  {callData.contact.recent_activity && callData.contact.recent_activity.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Recent Activity</p>
                      <div className="space-y-2">
                        {callData.contact.recent_activity.slice(0, 3).map((activity, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <ClipboardList className="h-4 w-4 text-muted-foreground" />
                            <span>{activity.title}</span>
                            <span className="text-muted-foreground">
                              {new Date(activity.date).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Phone className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Unknown caller</p>
                  <p className="text-sm">No contact information found for this number</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="justify-start">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Create Work Order
                </Button>
                <Button variant="outline" className="justify-start">
                  <Building className="h-4 w-4 mr-2" />
                  Schedule Appointment
                </Button>
                <Button variant="outline" className="justify-start">
                  <Package className="h-4 w-4 mr-2" />
                  Create Purchase Order
                </Button>
                <Button variant="outline" className="justify-start">
                  <User className="h-4 w-4 mr-2" />
                  Add to Contacts
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Call Disposition */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Call Disposition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="disposition">Disposition</Label>
                <div className="grid grid-cols-2 gap-2">
                  {dispositionOptions.map((option) => (
                    <Button
                      key={option}
                      variant={disposition === option ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start text-left h-auto py-2"
                      onClick={() => setDisposition(option)}
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter call notes and follow-up actions..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button 
              onClick={handleSaveDisposition} 
              disabled={!disposition || saving}
            >
              {saving ? 'Saving...' : 'Save & Close'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};