import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StickyNote, User, Users, Edit2, Check, X, Trash2 } from "lucide-react";
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

  const { data: userNotes, isLoading: userLoading } = useQuery<UserNote[]>({
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
      toast({ title: "Erfolg", description: "Notiz hinzugefügt" });
      setGlobalNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes/global"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Notiz konnte nicht gespeichert werden", variant: "destructive" });
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
      toast({ title: "Erfolg", description: "Notiz hinzugefügt" });
      setUserNoteContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/notes/user", user!.id] });
    } catch (error) {
      toast({ title: "Fehler", description: "Notiz konnte nicht gespeichert werden", variant: "destructive" });
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleUpdateGlobalNote = async (id: string) => {
    if (!editingGlobalContent.trim()) return;
    try {
      await apiRequest("PATCH", `/api/notes/global/${id}`, { content: editingGlobalContent });
      toast({ title: "Erfolg", description: "Notiz aktualisiert" });
      setEditingGlobalId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/notes/global"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Fehler beim Aktualisieren", variant: "destructive" });
    }
  };

  const handleDeleteGlobalNote = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/notes/global/${id}`, {});
      toast({ title: "Erfolg", description: "Notiz gelöscht" });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/global"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Fehler beim Löschen", variant: "destructive" });
    }
  };

  const handleUpdateUserNote = async (id: string) => {
    if (!editingUserContent.trim()) return;
    try {
      await apiRequest("PATCH", `/api/notes/user/${id}`, { content: editingUserContent });
      toast({ title: "Erfolg", description: "Notiz aktualisiert" });
      setEditingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/notes/user", user!.id] });
    } catch (error) {
      toast({ title: "Fehler", description: "Fehler beim Aktualisieren", variant: "destructive" });
    }
  };

  const handleDeleteUserNote = async (id: string) => {
    try {
      await apiRequest("DELETE", `/api/notes/user/${id}`, {});
      toast({ title: "Erfolg", description: "Notiz gelöscht" });
      queryClient.invalidateQueries({ queryKey: ["/api/notes/user", user!.id] });
    } catch (error) {
      toast({ title: "Fehler", description: "Fehler beim Löschen", variant: "destructive" });
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

        {/* GEMEINSAME NOTIZEN */}
        <TabsContent value="global" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Neue gemeinsame Notiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={globalNoteContent}
                onChange={(e) => setGlobalNoteContent(e.target.value)}
                placeholder="Kommentar oder Anmerkung hinzufügen..."
                className="min-h-24"
                data-testid="input-global-note"
              />
              <Button 
                onClick={handleGlobalNoteSubmit} 
                disabled={!globalNoteContent.trim() || isSubmittingGlobal}
                data-testid="button-submit-global-note"
              >
                <StickyNote className="w-4 h-4 mr-2" />
                {isSubmittingGlobal ? "Speichern..." : "Hinzufügen"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Alle Einträge</CardTitle>
            </CardHeader>
            <CardContent>
              {globalLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : !globalNotes || globalNotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Keine Einträge vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {globalNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 border border-border rounded-md space-y-2"
                      data-testid={`global-note-${note.id}`}
                    >
                      {editingGlobalId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingGlobalContent}
                            onChange={(e) => setEditingGlobalContent(e.target.value)}
                            className="min-h-20"
                            data-testid={`edit-global-${note.id}`}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateGlobalNote(note.id)}>
                              <Check className="w-4 h-4 mr-1" /> Speichern
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingGlobalId(null)}>
                              <X className="w-4 h-4 mr-1" /> Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                            <div>
                              <span className="font-medium">{note.author}</span>
                              <span> • {format(new Date(note.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                              {note.updatedBy && note.updatedBy !== note.author && (
                                <span className="ml-2">bearbeitet von {note.updatedBy}</span>
                              )}
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingGlobalId(note.id);
                                setEditingGlobalContent(note.content);
                              }} data-testid={`button-edit-global-${note.id}`}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteGlobalNote(note.id)} data-testid={`button-delete-global-${note.id}`}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PRIVATE NOTIZEN */}
        <TabsContent value="private" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Neue private Notiz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={userNoteContent}
                onChange={(e) => setUserNoteContent(e.target.value)}
                placeholder="Persönliche Notiz eingeben..."
                className="min-h-24"
                data-testid="input-user-note"
              />
              <Button 
                onClick={handleUserNoteSubmit} 
                disabled={!userNoteContent.trim() || isSubmittingUser}
                data-testid="button-submit-user-note"
              >
                <StickyNote className="w-4 h-4 mr-2" />
                {isSubmittingUser ? "Speichern..." : "Hinzufügen"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Meine Notizen</CardTitle>
            </CardHeader>
            <CardContent>
              {userLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : !userNotes || userNotes.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Keine Notizen vorhanden</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userNotes.map((note) => (
                    <div 
                      key={note.id}
                      className="p-3 border border-border rounded-md space-y-2"
                      data-testid={`user-note-${note.id}`}
                    >
                      {editingUserId === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingUserContent}
                            onChange={(e) => setEditingUserContent(e.target.value)}
                            className="min-h-20"
                            data-testid={`edit-user-${note.id}`}
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleUpdateUserNote(note.id)}>
                              <Check className="w-4 h-4 mr-1" /> Speichern
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingUserId(null)}>
                              <X className="w-4 h-4 mr-1" /> Abbrechen
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
                            <span>{format(new Date(note.updatedAt), "dd.MM.yyyy HH:mm", { locale: de })}</span>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingUserId(note.id);
                                setEditingUserContent(note.content);
                              }} data-testid={`button-edit-user-${note.id}`}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteUserNote(note.id)} data-testid={`button-delete-user-${note.id}`}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
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
