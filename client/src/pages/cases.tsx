import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Trash2, Camera, Edit } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Case, CaseStatus } from "@shared/schema";
import { CASE_STATUS } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Cases() {
  const { user, canDelete } = useAuth();
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [editingStatus, setEditingStatus] = useState<Case | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState({ crime: "", notes: "", characteristics: "", photo: "" });

  const [formData, setFormData] = useState({
    caseNumber: "",
    personName: "",
    crime: "",
    status: "offen" as CaseStatus,
    notes: "",
    photo: "",
    characteristics: "",
  });

  const { data: cases, isLoading } = useQuery<Case[]>({
    queryKey: ["/api/cases"],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/cases", {
        ...formData,
        handler: user!.username,
      });

      toast({
        title: "Erfolg",
        description: "Fallakte wurde angelegt",
      });

      setShowNewDialog(false);
      setFormData({
        caseNumber: "",
        personName: "",
        crime: "",
        status: "offen",
        notes: "",
        photo: "",
        characteristics: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fallakte konnte nicht angelegt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStatusChange = async (caseItem: Case, newStatus: CaseStatus) => {
    try {
      await apiRequest("PATCH", `/api/cases/${caseItem.id}/status`, { status: newStatus });
      
      toast({
        title: "Erfolg",
        description: "Status wurde aktualisiert",
      });
      
      setEditingStatus(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedCase) return;

    try {
      await apiRequest("DELETE", `/api/cases/${selectedCase.id}`, {});
      
      toast({
        title: "Erfolg",
        description: "Fallakte wurde gelöscht",
      });
      
      setShowDeleteDialog(false);
      setSelectedCase(null);
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Fallakte konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const handleEditCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase) return;
    setIsSubmitting(true);

    try {
      await apiRequest("PATCH", `/api/cases/${selectedCase.id}`, editFormData);
      toast({ title: "Erfolg", description: "Fallakte wurde aktualisiert" });
      setShowEditDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Aktualisierung fehlgeschlagen", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: CaseStatus) => {
    switch (status) {
      case "offen": return "destructive";
      case "in Bearbeitung": return "default";
      case "abgeschlossen": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Fallakten</h1>
          <p className="text-muted-foreground">Verwaltung aller Fallakten</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-new-case">
          <Plus className="w-4 h-4 mr-2" />
          Neue Fallakte
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Alle Fallakten</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Laden...</div>
          ) : !cases || cases.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Keine Fallakten vorhanden</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Aktennummer</TableHead>
                    <TableHead>Person</TableHead>
                    <TableHead>Delikt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bearbeiter</TableHead>
                    <TableHead>Erstellt</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cases.map((caseItem) => (
                    <TableRow key={caseItem.id} data-testid={`row-case-${caseItem.id}`}>
                      <TableCell className="font-mono font-medium">{caseItem.caseNumber}</TableCell>
                      <TableCell>{caseItem.personName}</TableCell>
                      <TableCell className="max-w-xs truncate">{caseItem.crime}</TableCell>
                      <TableCell>
                        {editingStatus?.id === caseItem.id ? (
                          <Select
                            value={caseItem.status}
                            onValueChange={(value) => handleStatusChange(caseItem, value as CaseStatus)}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CASE_STATUS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Badge variant={getStatusBadgeVariant(caseItem.status)}>
                              {caseItem.status}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setEditingStatus(caseItem)}
                              data-testid={`button-edit-status-${caseItem.id}`}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{caseItem.handler}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(caseItem.createdAt), "dd.MM.yyyy", { locale: de })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setEditFormData({ crime: caseItem.crime, notes: caseItem.notes, characteristics: caseItem.characteristics || "", photo: caseItem.photo });
                              setShowEditDialog(true);
                            }}
                            data-testid={`button-edit-case-${caseItem.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCase(caseItem);
                              setShowDetailDialog(true);
                            }}
                            data-testid={`button-view-${caseItem.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {canDelete() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedCase(caseItem);
                                setShowDeleteDialog(true);
                              }}
                              data-testid={`button-delete-${caseItem.id}`}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Neue Fallakte anlegen</DialogTitle>
            <DialogDescription>Erfassen Sie eine neue Fallakte</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="caseNumber">Aktennummer *</Label>
                <Input
                  id="caseNumber"
                  value={formData.caseNumber}
                  onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                  required
                  data-testid="input-case-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="personName">Person *</Label>
                <Input
                  id="personName"
                  value={formData.personName}
                  onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                  required
                  data-testid="input-person-name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="crime">Delikt(e) *</Label>
              <Textarea
                id="crime"
                value={formData.crime}
                onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
                required
                data-testid="input-crime"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as CaseStatus })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CASE_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="characteristics">Merkmale</Label>
              <Input
                id="characteristics"
                value={formData.characteristics}
                onChange={(e) => setFormData({ ...formData, characteristics: e.target.value })}
                placeholder="z.B. Narbe über dem linken Auge"
                data-testid="input-characteristics"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                data-testid="input-notes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="photo">Foto</Label>
              <div className="flex items-center gap-4">
                <Input
                  id="photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="flex-1"
                  data-testid="input-photo"
                />
                {formData.photo && (
                  <div className="w-20 h-20 border-2 border-border rounded-md overflow-hidden">
                    <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-case">
                {isSubmitting ? "Speichern..." : "Fallakte anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">Fallakten-Details</DialogTitle>
          </DialogHeader>
          {selectedCase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Aktennummer</p>
                  <p className="font-mono font-medium">{selectedCase.caseNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={getStatusBadgeVariant(selectedCase.status)}>
                    {selectedCase.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Person</p>
                  <p className="font-medium">{selectedCase.personName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bearbeiter</p>
                  <p className="font-medium">{selectedCase.handler}</p>
                </div>
              </div>

              {selectedCase.photo && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Foto</p>
                  <div className="w-40 h-40 border-2 border-border rounded-md overflow-hidden">
                    <img src={selectedCase.photo} alt={selectedCase.personName} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground">Delikt(e)</p>
                <p className="mt-1">{selectedCase.crime}</p>
              </div>

              {selectedCase.characteristics && (
                <div>
                  <p className="text-sm text-muted-foreground">Merkmale</p>
                  <p className="mt-1">{selectedCase.characteristics}</p>
                </div>
              )}

              {selectedCase.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notizen</p>
                  <p className="mt-1">{selectedCase.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                <div>
                  <p>Erstellt am</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(selectedCase.createdAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </div>
                <div>
                  <p>Aktualisiert am</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(selectedCase.updatedAt), "dd.MM.yyyy HH:mm", { locale: de })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Fallakte löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Fallakte "{selectedCase?.caseNumber}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
