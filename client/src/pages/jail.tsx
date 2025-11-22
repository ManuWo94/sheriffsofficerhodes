import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, UserCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { JailRecord } from "@shared/schema";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

function CountdownTimer({ startTime, durationMinutes }: { startTime: Date; durationMinutes: number }) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const start = new Date(startTime).getTime();
      const end = start + durationMinutes * 60 * 1000;
      const remaining = Math.max(0, end - now);
      return Math.floor(remaining / 1000);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime, durationMinutes]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (timeLeft === 0) {
    return <Badge variant="destructive" className="font-mono">Abgelaufen</Badge>;
  }

  return (
    <span className="font-mono text-lg font-bold text-foreground">
      {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </span>
  );
}

export default function Jail() {
  const { user, canDelete } = useAuth();
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<JailRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    personName: "",
    crime: "",
    durationMinutes: 30,
  });

  const { data: inmates, isLoading } = useQuery<JailRecord[]>({
    queryKey: ["/api/jail"],
  });

  const activeInmates = inmates?.filter(i => i.released === 0) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/jail", {
        ...formData,
        handler: user!.username,
        startTime: new Date(),
      });

      toast({
        title: "Erfolg",
        description: "Person wurde inhaftiert",
      });

      setShowNewDialog(false);
      setFormData({
        personName: "",
        crime: "",
        durationMinutes: 30,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jail"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Inhaftierung konnte nicht angelegt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRelease = async (record: JailRecord) => {
    try {
      await apiRequest("PATCH", `/api/jail/${record.id}/release`, {});
      
      toast({
        title: "Erfolg",
        description: `${record.personName} wurde entlassen`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/jail"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Entlassung fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;

    try {
      await apiRequest("DELETE", `/api/jail/${selectedRecord.id}`, {});
      
      toast({
        title: "Erfolg",
        description: "Eintrag wurde gelöscht",
      });
      
      setShowDeleteDialog(false);
      setSelectedRecord(null);
      queryClient.invalidateQueries({ queryKey: ["/api/jail"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Löschen fehlgeschlagen",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Gefängnisverwaltung</h1>
          <p className="text-muted-foreground">Verwaltung der Inhaftierten</p>
        </div>
        <Button onClick={() => setShowNewDialog(true)} data-testid="button-new-jail">
          <Plus className="w-4 h-4 mr-2" />
          Person inhaftieren
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Aktuelle Inhaftierte</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Laden...</div>
          ) : activeInmates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Keine Inhaftierten</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Delikt</TableHead>
                    <TableHead>Gesamtdauer</TableHead>
                    <TableHead>Restzeit</TableHead>
                    <TableHead>Zuständiger Beamter</TableHead>
                    <TableHead className="text-right">Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeInmates.map((record) => (
                    <TableRow key={record.id} data-testid={`row-inmate-${record.id}`}>
                      <TableCell className="font-medium">{record.personName}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.crime}</TableCell>
                      <TableCell className="font-mono">{record.durationMinutes} Min.</TableCell>
                      <TableCell>
                        <CountdownTimer 
                          startTime={record.startTime} 
                          durationMinutes={record.durationMinutes}
                        />
                      </TableCell>
                      <TableCell>{record.handler}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRelease(record)}
                            data-testid={`button-release-${record.id}`}
                          >
                            <UserCheck className="w-4 h-4 mr-2" />
                            Entlassen
                          </Button>
                          {canDelete() && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowDeleteDialog(true);
                              }}
                              data-testid={`button-delete-${record.id}`}
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Person inhaftieren</DialogTitle>
            <DialogDescription>Erfassen Sie eine neue Inhaftierung</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="personName">Name *</Label>
              <Input
                id="personName"
                value={formData.personName}
                onChange={(e) => setFormData({ ...formData, personName: e.target.value })}
                required
                data-testid="input-person-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="crime">Delikt *</Label>
              <Input
                id="crime"
                value={formData.crime}
                onChange={(e) => setFormData({ ...formData, crime: e.target.value })}
                required
                data-testid="input-crime"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Dauer in Minuten *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.durationMinutes}
                onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 0 })}
                required
                data-testid="input-duration"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-jail">
                {isSubmitting ? "Speichern..." : "Inhaftieren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eintrag löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Eintrag für "{selectedRecord?.personName}" wirklich löschen?
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
