import { useState } from "react";
import { Search, Mail, Check, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DocumentShareProps {
  id: string;
  documentTitle: string;
  onShareSuccess: () => void;
}

interface ShareLink {
  id: string;
  permission: "view" | "edit";
  expiresAt: Date | null;
  url: string;
}

export function DocumentShare({
  id,
  documentTitle,
  onShareSuccess,
}: DocumentShareProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "edit">("view");
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);

  const handleCreateLink = async () => {
    try {
      setIsCreatingLink(true);
      const response = await fetch(`/api/documents/${id}/share/link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ permission }),
      });

      if (!response.ok) {
        throw new Error("Failed to create share link");
      }

      const link = await response.json();
      setShareLinks([...shareLinks, link]);
      toast({
        title: "Success",
        description: "Share link created successfully",
      });
    } catch (error) {
      console.error("Error creating share link:", error);
      toast({
        title: "Error",
        description: "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsCreatingLink(false);
    }
  };

  const handleSendInvite = async () => {
    if (!email) return;

    try {
      setIsSendingInvite(true);
      const response = await fetch(`/api/documents/${id}/share/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, permission }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invite");
      }

      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      setEmail("");
      onShareSuccess();
    } catch (error) {
      console.error("Error sending invite:", error);
      toast({
        title: "Error",
        description: "Failed to send invite",
        variant: "destructive",
      });
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Success",
        description: "Link copied to clipboard",
      });
    } catch (error) {
      console.error("Error copying link:", error);
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Share</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Share "{documentTitle}" with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Email Invite Section */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Invite people</h4>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  className="pl-8"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Select
                value={permission}
                onValueChange={(value) => setPermission(value as "view" | "edit")}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view">View</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleSendInvite}
                disabled={!email || isSendingInvite}
              >
                {isSendingInvite ? (
                  "Sending..."
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Links Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Share links</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCreateLink}
                disabled={isCreatingLink}
              >
                Create Link
              </Button>
            </div>
            <div className="space-y-2">
              {shareLinks.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center justify-between rounded-md border p-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded bg-primary/10 px-2 py-1 text-xs">
                      {link.permission}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {link.expiresAt
                        ? new Date(link.expiresAt).toLocaleDateString()
                        : "Never expires"}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyLink(link.url)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}