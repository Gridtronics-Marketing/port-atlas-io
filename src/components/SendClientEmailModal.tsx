import { useState, useRef, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X, Loader2, Plus, Paperclip, Upload, FileText, Trash2 } from "lucide-react";
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

interface AttachedFile {
  file: File;
  uploading: boolean;
  url?: string;
  error?: string;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const MAX_TOTAL_SIZE = 10 * 1024 * 1024; // 10 MB

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
  const [attachments, setAttachments] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = attachments.reduce((sum, a) => sum + a.file.size, 0);

  const uploadFile = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `${clientId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("email-attachments").upload(path, file);
    if (error) throw error;
    const { data } = supabase.storage.from("email-attachments").getPublicUrl(path);
    return data.publicUrl;
  };

  const addFiles = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const currentTotal = attachments.reduce((s, a) => s + a.file.size, 0);
    const newTotal = fileArray.reduce((s, f) => s + f.size, 0);
    if (currentTotal + newTotal > MAX_TOTAL_SIZE) {
      toast({ title: "Size limit", description: "Total attachments cannot exceed 10 MB", variant: "destructive" });
      return;
    }

    const newAttachments: AttachedFile[] = fileArray.map((f) => ({ file: f, uploading: true }));
    setAttachments((prev) => [...prev, ...newAttachments]);

    for (let i = 0; i < fileArray.length; i++) {
      try {
        const url = await uploadFile(fileArray[i]);
        setAttachments((prev) =>
          prev.map((a) =>
            a.file === fileArray[i] ? { ...a, uploading: false, url: url || undefined } : a
          )
        );
      } catch {
        setAttachments((prev) =>
          prev.map((a) =>
            a.file === fileArray[i] ? { ...a, uploading: false, error: "Upload failed" } : a
          )
        );
      }
    }
  }, [attachments, clientId, toast]);

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  }, [addFiles]);

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
    const pendingUploads = attachments.some((a) => a.uploading);
    if (pendingUploads) {
      toast({ title: "Please wait", description: "Files are still uploading", variant: "destructive" });
      return;
    }
    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const attachmentPayload = attachments
        .filter((a) => a.url)
        .map((a) => ({ filename: a.file.name, url: a.url! }));

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
          attachments: attachmentPayload,
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
      setAttachments([]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to send email", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[820px] p-0 gap-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row min-h-[480px]">
          {/* Left: Email Form */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="px-5 pt-5 pb-3">
              <DialogTitle className="text-base font-semibold">Send email to {clientName}</DialogTitle>
              <DialogDescription className="sr-only">Compose and send an email</DialogDescription>
            </DialogHeader>

            <div className="flex-1 flex flex-col px-5 pb-5 space-y-0">
              {/* To */}
              <div className="flex items-center gap-2 py-2.5 border-b border-border">
                <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">To</span>
                <div className="flex flex-wrap items-center gap-1.5 flex-1">
                  {toEmails.map((email) => (
                    <Badge key={email} variant="secondary" className="text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                      {email}
                      <button onClick={() => setToEmails((prev) => prev.filter((e) => e !== email))} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                {!showCc && (
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-muted-foreground shrink-0" onClick={() => setShowCc(true)}>
                    CC
                  </Button>
                )}
              </div>

              {/* CC */}
              {showCc && (
                <div className="flex items-center gap-2 py-2.5 border-b border-border">
                  <span className="text-xs font-medium text-muted-foreground w-8 shrink-0">CC</span>
                  <div className="flex flex-wrap items-center gap-1.5 flex-1">
                    {ccEmails.map((email) => (
                      <Badge key={email} variant="secondary" className="text-xs flex items-center gap-1 rounded-full px-2.5 py-0.5">
                        {email}
                        <button onClick={() => setCcEmails((prev) => prev.filter((e) => e !== email))} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    <Input
                      value={ccInput}
                      onChange={(e) => setCcInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCc(); } }}
                      onBlur={handleAddCc}
                      placeholder="Add email…"
                      className="border-0 shadow-none h-6 text-xs flex-1 min-w-[120px] focus-visible:ring-0 p-0"
                    />
                  </div>
                </div>
              )}

              {/* Subject */}
              <div className="py-2.5 border-b border-border">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Subject"
                  className="border-0 shadow-none h-7 text-sm focus-visible:ring-0 p-0 font-medium"
                />
              </div>

              {/* Message */}
              <div className="flex-1 pt-3">
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Write your message…"
                  className="border-0 shadow-none resize-none text-sm focus-visible:ring-0 p-0 min-h-[180px] h-full"
                />
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                <div className="flex items-center gap-2">
                  <Checkbox id="sendCopy" checked={sendCopy} onCheckedChange={(v) => setSendCopy(v === true)} />
                  <label htmlFor="sendCopy" className="text-xs text-muted-foreground cursor-pointer">Send me a copy</label>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={onClose} disabled={sending}>Cancel</Button>
                  <Button size="sm" onClick={handleSend} disabled={sending} className="bg-success text-success-foreground hover:bg-success/90">
                    {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
                    Send Email
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Attachments */}
          <div className="w-full sm:w-[260px] border-t sm:border-t-0 sm:border-l border-border bg-muted/30 flex flex-col">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Paperclip className="h-3.5 w-3.5" />
                Attachments
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {attachments.length} file{attachments.length !== 1 ? "s" : ""} · {formatFileSize(totalSize)} of 10 MB
              </p>
            </div>

            {/* Drop zone */}
            <div className="flex-1 px-4 pb-4 flex flex-col gap-2">
              <div
                className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
                  dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">
                  Drag files here or{" "}
                  <span className="text-primary font-medium underline underline-offset-2">Select a File</span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
                />
              </div>

              {/* File list */}
              {attachments.length > 0 && (
                <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                  {attachments.map((att, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-background rounded-md px-2.5 py-1.5 text-xs border border-border">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium text-foreground">{att.file.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {att.uploading ? "Uploading…" : att.error ? att.error : formatFileSize(att.file.size)}
                        </p>
                      </div>
                      {att.uploading ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground shrink-0" />
                      ) : (
                        <button onClick={() => removeAttachment(idx)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Size bar */}
              {attachments.length > 0 && (
                <div className="mt-auto">
                  <div className="h-1.5 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${Math.min((totalSize / MAX_TOTAL_SIZE) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
