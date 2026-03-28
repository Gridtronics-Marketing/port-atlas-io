import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import type { ClientContact } from "@/hooks/useClientContacts";

interface AddClientContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contact: { name: string; email?: string; phone?: string; role?: string }) => Promise<any>;
  existingContact?: ClientContact | null;
}

export const AddClientContactModal = ({ isOpen, onClose, onSave, existingContact }: AddClientContactModalProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingContact) {
      setName(existingContact.name || "");
      setEmail(existingContact.email || "");
      setPhone(existingContact.phone || "");
      setRole(existingContact.role || "");
    } else {
      setName(""); setEmail(""); setPhone(""); setRole("");
    }
  }, [existingContact, isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), email: email.trim() || undefined, phone: phone.trim() || undefined, role: role.trim() || undefined });
      onClose();
    } catch {
      // toast handled by hook
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md" onOpenChange={onClose}>
        <DialogHeader>
          <DialogTitle>{existingContact ? "Edit Contact" : "Add Contact"}</DialogTitle>
          <DialogDescription>
            {existingContact ? "Update the contact details." : "Add a new contact for this client."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@example.com" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Input value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Owner, Manager, IT Admin" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving || !name.trim()}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            {existingContact ? "Save Changes" : "Add Contact"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
