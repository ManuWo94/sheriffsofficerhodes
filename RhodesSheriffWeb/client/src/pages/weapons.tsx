import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { CITIZEN_WEAPON_STATUS, SERVICE_WEAPON_STATUS } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function Weapons() {
  const { canDelete } = useAuth();
  const { toast } = useToast();

  // Citizen Weapons State
  const [showCitizenDialog, setShowCitizenDialog] = useState(false);
  const [citizenFormData, setCitizenFormData] = useState({
    serialNumber: "",
    weaponType: "",
    owner: "",
    category: "Bürgerwaffe" as const,
    status: "beschlagnahmt" as WeaponStatus,
  });
  const [isSubmittingCitizen, setIsSubmittingCitizen] = useState(false);

  // Service Weapons State
  const [showServiceDialog, setShowServiceDialog] = useState(false);
  const [serviceFormData, setServiceFormData] = useState({
    serialNumber: "",
    weaponType: "",
    owner: "",
    category: "Dienstwaffe" as const,
    status: "im Waffenschrank" as WeaponStatus,
  });
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  // Delete State
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);

  const { data: weapons, isLoading } = useQuery<Weapon[]>({
    queryKey: ["/api/weapons"],
  });

  const citizenWeapons = weapons?.filter(w => w.category === "Bürgerwaffe") || [];
  const serviceWeapons = weapons?.filter(w => w.category === "Dienstwaffe") || [];

  // Citizen Weapons Submit
  const handleCitizenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCitizen(true);

    try {
      await apiRequest("POST", "/api/weapons", citizenFormData);
      toast({ title: "Erfolg", description: "Bürgerwaffe wurde registriert" });
      setShowCitizenDialog(false);
      setCitizenFormData({
        serialNumber: "",
        weaponType: "",
        owner: "",
        category: "Bürgerwaffe",
        status: "beschlagnahmt",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Bürgerwaffe konnte nicht registriert werden", variant: "destructive" });
    } finally {
      setIsSubmittingCitizen(false);
    }
  };

  // Service Weapons Submit
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingService(true);

    try {
      await apiRequest("POST", "/api/weapons", serviceFormData);
      toast({ title: "Erfolg", description: "Dienstwaffe wurde registriert" });
      setShowServiceDialog(false);
      setServiceFormData({
        serialNumber: "",
        weaponType: "",
        owner: "",
        category: "Dienstwaffe",
        status: "im Waffenschrank",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Dienstwaffe konnte nicht registriert werden", variant: "destructive" });
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleStatusChange = async (weapon: Weapon, newStatus: WeaponStatus) => {
    try {
      await apiRequest("PATCH", `/api/weapons/${weapon.id}/status`, { status: newStatus });
      toast({ title: "Erfolg", description: "Waffenstatus wurde aktualisiert" });
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Status konnte nicht aktualisiert werden", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!selectedWeapon) return;
    try {
      await apiRequest("DELETE", `/api/weapons/${selectedWeapon.id}`, {});
      toast({ title: "Erfolg", description: "Waffe wurde gelöscht" });
      setShowDeleteDialog(false);
      setSelectedWeapon(null);
      queryClient.invalidateQueries({ queryKey: ["/api/weapons"] });
    } catch (error) {
      toast({ title: "Fehler", description: "Waffe konnte nicht gelöscht werden", variant: "destructive" });
    }
  };

  const getStatusBadgeVariant = (status: WeaponStatus) => {
    if (status === "im Waffenschrank") return "secondary";
    if (status === "vergeben") return "default";
    if (status === "beschlagnahmt") return "destructive";
    if (status === "zurückgegeben") return "default";
    if (status === "vernichtet") return "outline";
    if (status === "verloren gegangen") return "destructive";
    return "outline";
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
            <TableHead>Erstellt von</TableHead>
            <TableHead>Zuletzt bearbeitet</TableHead>
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
                    {weapon.category === "Dienstwaffe" 
                      ? SERVICE_WEAPON_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))
                      : CITIZEN_WEAPON_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="text-sm">{weapon.createdBy || "-"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {weapon.updatedBy || "-"} ({format(new Date(weapon.updatedAt || weapon.createdAt), "dd.MM.yyyy HH:mm", { locale: de })})
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
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Waffenverwaltung</h1>
        <p className="text-muted-foreground">Verwaltung beschlagnahmter Waffen und Dienst-Waffensysteme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* BÜRGERWAFFEN */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="font-serif">Beschlagnahmte Waffen</CardTitle>
            <Button 
              onClick={() => setShowCitizenDialog(true)}
              size="sm"
              data-testid="button-new-citizen-weapon"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Waffe
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
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

        {/* DIENSTWAFFEN */}
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <CardTitle className="font-serif">Dienst-Waffen</CardTitle>
            <Button 
              onClick={() => setShowServiceDialog(true)}
              size="sm"
              data-testid="button-new-service-weapon"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neue Waffe
            </Button>
          </CardHeader>
          <CardContent className="flex-1">
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
      </div>

      {/* CITIZEN WEAPONS DIALOG */}
      <Dialog open={showCitizenDialog} onOpenChange={setShowCitizenDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Beschlagnahmte Waffe registrieren</DialogTitle>
            <DialogDescription>Erfassen Sie eine neue Bürgerwaffe</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCitizenSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="citizen-serial">Seriennummer *</Label>
              <Input
                id="citizen-serial"
                value={citizenFormData.serialNumber}
                onChange={(e) => setCitizenFormData({ ...citizenFormData, serialNumber: e.target.value })}
                required
                data-testid="input-citizen-serial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizen-type">Waffentyp *</Label>
              <Input
                id="citizen-type"
                value={citizenFormData.weaponType}
                onChange={(e) => setCitizenFormData({ ...citizenFormData, weaponType: e.target.value })}
                placeholder="z.B. Revolver, Gewehr"
                required
                data-testid="input-citizen-type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizen-owner">Besitzer *</Label>
              <Input
                id="citizen-owner"
                value={citizenFormData.owner}
                onChange={(e) => setCitizenFormData({ ...citizenFormData, owner: e.target.value })}
                required
                data-testid="input-citizen-owner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="citizen-status">Status *</Label>
              <Select
                value={citizenFormData.status}
                onValueChange={(value) => setCitizenFormData({ ...citizenFormData, status: value as WeaponStatus })}
              >
                <SelectTrigger data-testid="select-citizen-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CITIZEN_WEAPON_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCitizenDialog(false)}>Abbrechen</Button>
              <Button type="submit" disabled={isSubmittingCitizen} data-testid="button-submit-citizen">
                {isSubmittingCitizen ? "Speichern..." : "Waffe registrieren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SERVICE WEAPONS DIALOG */}
      <Dialog open={showServiceDialog} onOpenChange={setShowServiceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Dienstwaffe registrieren</DialogTitle>
            <DialogDescription>Erfassen Sie eine neue Dienst-Waffe</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleServiceSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-serial">Seriennummer *</Label>
              <Input
                id="service-serial"
                value={serviceFormData.serialNumber}
                onChange={(e) => setServiceFormData({ ...serviceFormData, serialNumber: e.target.value })}
                required
                data-testid="input-service-serial"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-type">Waffentyp *</Label>
              <Input
                id="service-type"
                value={serviceFormData.weaponType}
                onChange={(e) => setServiceFormData({ ...serviceFormData, weaponType: e.target.value })}
                placeholder="z.B. Revolver, Gewehr"
                required
                data-testid="input-service-type"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-owner">Zugeordnet zu *</Label>
              <Input
                id="service-owner"
                value={serviceFormData.owner}
                onChange={(e) => setServiceFormData({ ...serviceFormData, owner: e.target.value })}
                required
                data-testid="input-service-owner"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service-status">Status *</Label>
              <Select
                value={serviceFormData.status}
                onValueChange={(value) => setServiceFormData({ ...serviceFormData, status: value as WeaponStatus })}
              >
                <SelectTrigger data-testid="select-service-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_WEAPON_STATUS.map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowServiceDialog(false)}>Abbrechen</Button>
              <Button type="submit" disabled={isSubmittingService} data-testid="button-submit-service">
                {isSubmittingService ? "Speichern..." : "Waffe registrieren"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
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
