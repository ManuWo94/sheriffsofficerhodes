import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StickyNote, User, Users, Edit2, Check, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GlobalNote, UserNote } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Notes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [globalNoteContent, setGlobalNoteContent] = useState("");
  const [userNoteContent, setUserNoteContent] = useState("");
  const [isSubmittingGlobal, setIsSubmittingGlobal] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [editingGlobalId, setEditingGlobalId] = useState<string | null>(null);
  const [editingGlobalContent, setEditingGlobalContent] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserContent, setEditingUserContent] = useState("");

  const { data: globalNotes, isLoading: globalLoading } = useQuery<GlobalNote[]>({
    queryKey: ["/api/notes/global"],
  });

  const { data: userNotes, isLoading: userLoading, refetch: refetchUserNotes } = useQuery<UserNote[]>({
    queryKey: ["/api/notes/user", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const sessionToken = localStorage.getItem("sheriff_session");
      const response = await fetch(`/api/notes/user?userId=${user!.id}`, {
        headers: sessionToken ? { "x-session-token": sessionToken } : {},
      });
      if (!response.ok) throw new Error("Failed to fetch user notes");
      return response.json();
    },
  });

  const handleGlobalNoteSubmit = async () => {
    if (!globalNoteContent.trim()) return;
    
    setIsSubmittingGlobal(true);

    try {
      await apiRequest("POST", "/api/notes/global", {
        content: globalNoteContent,
        author: user!.username,
      });

      toast({
        title: "Erfolg",
        description: "Notiz wurde hinzugefügt",
      });

      setGlobalNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes/global"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Notiz konnte nicht gespeichert werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingGlobal(false);
    }
  };

  const handleUserNoteSubmit = async () => {
    if (!userNoteContent.trim()) return;
    
    setIsSubmittingUser(true);

    try {
      await apiRequest("POST", "/api/notes/user", {
        userId: user!.id,
        content: userNoteContent,
      });

      toast({
        title: "Erfolg",
        description: "Private Notiz wurde hinzugefügt",
      });

      setUserNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes/user", user!.id] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Notiz konnte nicht gespeichert werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateGlobalNote = async (id: string) => {
    if (!editingGlobalContent.trim()) return;

    try {
      await apiRequest("PATCH", `/api/notes/global/${id}`, { content: editingGlobalContent });
      toast({ title: "Erfolg", description: "Notiz wurde aktualisiert" });
      setEditingGlobalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/notes/global"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Notiz konnte nicht aktualisiert werden", variant: "destructive" });
    }
  };

  const handleUpdateUserNote = async (id: string) => {
    if (!editingUserContent.trim()) return;

    try {
      await apiRequest("PATCH", `/api/notes/user/${id}`, { content: editingUserContent });
      toast({ title: "Erfolg", description: "Notiz wurde aktualisiert" });
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/notes/user", user!.id] });
    } catch (error) {
      toast({ title: "Fehler", description: "Notiz konnte nicht aktualisiert werden", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Notizen</h1>
        <p className="text-muted-foreground">Gemeinsame und private Notizen</p>
      </div>

      <Tabs defaultValue="global">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="global" data-testid="tab-global-notes">
            <Users className="w-4 h-4 mr-2" />
            Gemeinsame Notizen
          </TabsTrigger>
          <TabsTrigger value="private" data-testid="tab-private-notes">
            <User className="w-4 h-4 mr-2" />
            Meine Notizen
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Neue gemeinsame Notiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={globalNoteContent}
                onChange={(e) => setGlobalNoteContent(e.target.value)}
                placeholder="Gemeinsame Notiz eingeben..."
                className="min-h-32"
                data-testid="input-global-note"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleGlobalNoteSubmit} 
                  disabled={!globalNoteContent.trim() || isSubmittingGlobal}
                  data-testid="button-submit-global-note"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  {isSubmittingGlobal ? "Speichern..." : "Notiz hinzufügen"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Alle gemeinsamen Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              {globalLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : !globalNotes || globalNotes.length === 0 ? (
                <div className="text-center py-12">
                  <StickyNote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Noch keine gemeinsamen Notizen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {globalNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-4 border border-border rounded-md space-y-2"
                      data-testid={`global-note-${note.id}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border">
                        <span className="font-medium">{note.author}</span>
                        <span>•</span>
                        <span>{format(new Date(note.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="private" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Neue private Notiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={userNoteContent}
                onChange={(e) => setUserNoteContent(e.target.value)}
                placeholder="Private Notiz eingeben..."
                className="min-h-32"
                data-testid="input-user-note"
              />
              <div className="flex justify-end">
                <Button 
                  onClick={handleUserNoteSubmit} 
                  disabled={!userNoteContent.trim() || isSubmittingUser}
                  data-testid="button-submit-user-note"
                >
                  <StickyNote className="w-4 h-4 mr-2" />
                  {isSubmittingUser ? "Speichern..." : "Notiz hinzufügen"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Meine privaten Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : !userNotes || userNotes.length === 0 ? (
                <div className="text-center py-12">
                  <StickyNote className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">Noch keine privaten Notizen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {userNotes.map((note) => (
                    <div 
                      key={note.id} 
                      className="p-4 border border-border rounded-md space-y-2"
                      data-testid={`user-note-${note.id}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                        {format(new Date(note.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
