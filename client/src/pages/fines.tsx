import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Search } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Fine } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Fines() {
  const { canDelete } = useAuth();
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedFine, setSelectedFine] = useState<Fine | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [formData, setFormData] = useState({
    violation: "",
    amount: 0,
    remarks: "",
  });

  const { data: fines, isLoading } = useQuery<Fine[]>({
    queryKey: ["/api/fines"],
  });

  const filteredFines = fines?.filter(fine => 
    fine.violation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fine.remarks && fine.remarks.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/fines", formData);

      toast({
        title: "Erfolg",
        description: "Bußgeld wurde angelegt",
      });

      setShowNewDialog(false);
      setFormData({
        violation: "",
        amount: 0,
        remarks: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bußgeld konnte nicht angelegt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFine) return;

    try {
      await apiRequest("DELETE", `/api/fines/${selectedFine.id}`, {});
      
      toast({
        title: "Erfolg",
        description: "Bußgeld wurde gelöscht",
      });
      
      setShowDeleteDialog(false);
      setSelectedFine(null);
      queryClient.invalidateQueries({ queryKey: ["/api/fines"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Bußgeld konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Bußgeldkatalog</h1>
          <p className="text-muted-foreground">Verwaltung aller Bußgelder</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-new-fine">
          <Plus className="w-4 h-4 mr-2" />
          Neues Bußgeld
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="font-serif">Alle Bußgelder</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-fines"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Laden...</div>
          ) : filteredFines.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchTerm ? "Keine Ergebnisse gefunden" : "Keine Bußgelder vorhanden"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Verstoß</TableHead>
                    <TableHead className="text-right">Betrag</TableHead>
                    <TableHead>Bemerkung</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFines.map((fine) => (
                    <TableRow key={fine.id} data-testid={`row-fine-${fine.id}`}>
                      <TableCell className="font-medium">{fine.violation}</TableCell>
                      <TableCell className="text-right font-mono font-medium">${fine.amount}</TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">
                        {fine.remarks || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {canDelete() && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedFine(fine);
                              setShowDeleteDialog(true);
                            }}
                            data-testid={`button-delete-${fine.id}`}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        )}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Neues Bußgeld anlegen</DialogTitle>
            <DialogDescription>Erfassen Sie ein neues Bußgeld</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="violation">Verstoß / Bezeichnung *</Label>
              <Input
                id="violation"
                value={formData.violation}
                onChange={(e) => setFormData({ ...formData, violation: e.target.value })}
                required
                data-testid="input-violation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Betrag in $ *</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })}
                required
                data-testid="input-amount"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Bemerkung</Label>
              <Textarea
                id="remarks"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="z.B. Spanne je nach Schwere"
                data-testid="input-remarks"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-fine">
                {isSubmitting ? "Speichern..." : "Bußgeld anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bußgeld löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie das Bußgeld "{selectedFine?.violation}" wirklich löschen?
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
