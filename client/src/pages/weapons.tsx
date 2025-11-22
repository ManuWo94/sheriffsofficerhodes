import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Weapon, WeaponStatus } from "@shared/schema";
import { WEAPON_STATUS } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Weapons() {
  const { canDelete } = useAuth();
  const { toast } = useToast();
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCategory, setActiveCategory] = useState<"Bürgerwaffe" | "Dienstwaffe">("Bürgerwaffe");

  const [formData, setFormData] = useState({
    serialNumber: "",
    weaponType: "",
    owner: "",
    category: "Bürgerwaffe" as "Bürgerwaffe" | "Dienstwaffe",
    status: "registriert" as WeaponStatus,
  });

  const { data: weapons, isLoading } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
  });

  const citizenWeapons = weapons?.filter(w => w.category === "Bürgerwaffe") || [];
  const serviceWeapons = weapons?.filter(w => w.category === "Dienstwaffe") || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/weapons", formData);

      toast({
        title: "Erfolg",
        description: "Waffe wurde registriert",
      });

      setShowNewDialog(false);
      setFormData({
        serialNumber: "",
        weaponType: "",
        owner: "",
        category: activeCategory,
        status: "registriert",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Waffe konnte nicht registriert werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (weapon: Weapon, newStatus: WeaponStatus) => {
    try {
      await apiRequest("PATCH", `/api/weapons/${weapon.id}/status`, { status: newStatus });
      
      toast({
        title: "Erfolg",
        description: "Waffenstatus wurde aktualisiert",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedWeapon) return;

    try {
      await apiRequest("DELETE", `/api/weapons/${selectedWeapon.id}`, {});
      
      toast({
        title: "Erfolg",
        description: "Waffe wurde gelöscht",
      });
      
      setShowDeleteDialog(false);
      setSelectedWeapon(null);
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Waffe konnte nicht gelöscht werden",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: WeaponStatus) => {
    switch (status) {
      case "registriert": return "secondary";
      case "beschlagnahmt": return "destructive";
      case "zurückgegeben": return "default";
      default: return "outline";
    }
  };

  const WeaponsTable = ({ weapons: weaponList }: { weapons: Weapon[] }) => (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Seriennummer</TableHead>
            <TableHead>Typ</TableHead>
            <TableHead>Besitzer</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Statusänderung</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {weaponList.map((weapon) => (
            <TableRow key={weapon.id} data-testid={`row-weapon-${weapon.id}`}>
              <TableCell className="font-mono font-medium">{weapon.serialNumber}</TableCell>
              <TableCell>{weapon.weaponType}</TableCell>
              <TableCell>{weapon.owner}</TableCell>
              <TableCell>
                <Select
                  value={weapon.status}
                  onValueChange={(value) => handleStatusChange(weapon, value as WeaponStatus)}
                >
                  <SelectTrigger className="w-40" data-testid={`select-status-${weapon.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEAPON_STATUS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {format(new Date(weapon.statusChangedAt), "dd.MM.yyyy HH:mm", { locale: de })}
              </TableCell>
              <TableCell className="text-right">
                {canDelete() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedWeapon(weapon);
                      setShowDeleteDialog(true);
                    }}
                    data-testid={`button-delete-${weapon.id}`}
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
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Waffenverwaltung</h1>
          <p className="text-muted-foreground">Verwaltung aller registrierten Waffen</p>
        </div>
        <Button 
          onClick={() => {
            setFormData({ ...formData, category: activeCategory });
            setShowNewDialog(true);
          }} 
          data-testid="button-new-weapon"
        >
          <Plus className="w-4 h-4 mr-2" />
          Waffe registrieren
        </Button>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as typeof activeCategory)}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="Bürgerwaffe" data-testid="tab-citizen-weapons">Bürgerwaffen</TabsTrigger>
          <TabsTrigger value="Dienstwaffe" data-testid="tab-service-weapons">Dienstwaffen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="Bürgerwaffe" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Bürgerwaffen</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : citizenWeapons.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Keine Bürgerwaffen registriert</p>
                </div>
              ) : (
                <WeaponsTable weapons={citizenWeapons} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="Dienstwaffe" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Dienstwaffen</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : serviceWeapons.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Keine Dienstwaffen registriert</p>
                </div>
              ) : (
                <WeaponsTable weapons={serviceWeapons} />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Waffe registrieren</DialogTitle>
            <DialogDescription>Erfassen Sie eine neue Waffe</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serialNumber">Seriennummer *</Label>
              <Input
                id="serialNumber"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                required
                data-testid="input-serial-number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="weaponType">Waffentyp *</Label>
              <Input
                id="weaponType"
                value={formData.weaponType}
                onChange={(e) => setFormData({ ...formData, weaponType: e.target.value })}
                placeholder="z.B. Revolver, Gewehr"
                required
                data-testid="input-weapon-type"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="owner">Besitzer *</Label>
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                required
                data-testid="input-owner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as typeof formData.category })}
              >
                <SelectTrigger data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bürgerwaffe">Bürgerwaffe</SelectItem>
                  <SelectItem value="Dienstwaffe">Dienstwaffe</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value as WeaponStatus })}
              >
                <SelectTrigger data-testid="select-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEAPON_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-weapon">
                {isSubmitting ? "Speichern..." : "Waffe registrieren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Waffe löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie die Waffe "{selectedWeapon?.serialNumber}" wirklich löschen?
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
