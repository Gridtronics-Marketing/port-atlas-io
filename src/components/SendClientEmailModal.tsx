import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SendClientEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  defaultTo: string;
  replyTo?: string;
}

export const SendClientEmailModal = ({
  isOpen,
  onClose,
  clientId,
  clientName,
  defaultTo,
  replyTo,
}: SendClientEmailModalProps) => {
  const { toast } = useToast();
  const [toEmails, setToEmails] = useState<string[]>([defaultTo].filter(Boolean));
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendCopy, setSendCopy] = useState(false);
  const [sending, setSending] = useState(false);
  const [showCc, setShowCc] = useState(false);
  const [ccInput, setCcInput] = useState("");

  const handleAddCc = () => {
    const email = ccInput.trim();
    if (email && email.includes("@") && !ccEmails.includes(email)) {
      setCcEmails((prev) => [...prev, email]);
      setCcInput("");
    }
  };

  const handleSend = async () => {
    if (toEmails.length === 0 || !subject.trim() || !body.trim()) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await supabase.functions.invoke("send-client-email", {
        body: {
          to: toEmails[0],
          cc: ccEmails,
          subject: subject.trim(),
          body: body.trim(),
          clientId,
          clientName,
          replyTo: replyTo || undefined,
          sendCopy,
          senderEmail: user?.email || undefined,
        },
      });

      if (response.error) throw new Error(response.error.message);
      if (response.data?.error) throw new Error(response.data.error);

      toast({ title: "Email sent", description: `Email sent to ${toEmails[0]}` });
      onClose();
      setSubject("");
      setBody("");
      setCcEmails([]);
      setSendCopy(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>Send an email to {clientName}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* To Field */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">To</Label>
            <div className="flex flex-wrap items-center gap-1.5 border rounded-md px-2 py-1.5 min-h-[40px] bg-background">
              {toEmails.map((email) => (
                <Badge key={email} variant="secondary" className="text-xs flex items-center gap-1">
                  {email}
                  <button onClick={() => setToEmails((prev) => prev.filter((e) => e !== email))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {!showCc && (
                <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground" onClick={() => setShowCc(true)}>
                  <Plus className="h-3 w-3 mr-1" /> CC
                </Button>
              )}
            </div>
          </div>

          {/* CC Field */}
          {showCc && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">CC</Label>
              <div className="flex flex-wrap items-center gap-1.5 border rounded-md px-2 py-1.5 min-h-[40px] bg-background">
                {ccEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="text-xs flex items-center gap-1">
                    {email}
                    <button onClick={() => setCcEmails((prev) => prev.filter((e) => e !== email))}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  value={ccInput}
                  onChange={(e) => setCcInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCc(); } }}
                  onBlur={handleAddCc}
                  placeholder="Add CC email..."
                  className="border-0 shadow-none h-7 text-sm flex-1 min-w-[150px] focus-visible:ring-0"
                />
              </div>
            </div>
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Email subject..." />
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Message</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message..." rows={8} />
          </div>

          {/* Send me a copy */}
          <div className="flex items-center gap-2">
            <Checkbox id="sendCopy" checked={sendCopy} onCheckedChange={(v) => setSendCopy(v === true)} />
            <label htmlFor="sendCopy" className="text-sm text-muted-foreground cursor-pointer">Send me a copy</label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button onClick={handleSend} disabled={sending} className="bg-success text-success-foreground hover:bg-success/90">
              {sending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Send Email
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
