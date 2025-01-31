import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FolderPlus, MessageSquarePlus, Loader2 } from 'lucide-react'
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@clerk/nextjs"

interface Document {
  id: string;
  title: string;
  createdAt: string;
}

interface SidebarProps {
  documentId?: string;
}

export function Sidebar({ documentId }: SidebarProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useUser();

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to load documents');
        }
        
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (error) {
        console.error('Error loading documents:', error);
        toast({
          title: "Error",
          description: "Failed to load documents. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadDocuments();
  }, [toast]);

  const handleNewChat = () => {
    if (!documentId) {
      toast({
        title: "Error",
        description: "Please select a document first.",
        variant: "destructive",
      });
      return;
    }
    router.push(`/documents/${documentId}/chat`);
  };

  const handleNewDocument = () => {
    router.push('/documents/upload');
  };

  const handleDocumentClick = (id: string) => {
    router.push(`/documents/${id}`);
  };

  return (
    <div className="w-64 border-r bg-background flex flex-col">
      <div className="p-4 flex items-center space-x-2">
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
          <span className="text-primary-foreground font-semibold">Q</span>
        </div>
        <span className="font-semibold">QuillAI</span>
      </div>
      
      <div className="p-4 space-y-2">
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={handleNewChat}
        >
          <MessageSquarePlus className="mr-2 h-4 w-4" />
          New Chat
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={handleNewDocument}
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>
      
      <ScrollArea className="flex-1 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <Button
                key={doc.id}
                variant={doc.id === documentId ? "secondary" : "ghost"}
                className="w-full justify-start text-sm"
                onClick={() => handleDocumentClick(doc.id)}
              >
                {doc.title}
              </Button>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="p-4 border-t">
        {user ? (
          <div className="flex items-center space-x-2">
            <img 
              src={user.imageUrl} 
              alt={user.fullName || 'User'} 
              className="h-8 w-8 rounded-full"
            />
            <div className="flex-1 truncate">
              <p className="text-sm font-medium">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => router.push('/sign-in')}>
            Sign in
          </Button>
        )}
      </div>
    </div>
  )
} 