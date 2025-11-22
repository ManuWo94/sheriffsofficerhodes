import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Users, ClipboardList, ArrowRightLeft } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User, Task, TaskStatus } from "@shared/schema";
import { RANKS, TASK_STATUS } from "@shared/schema";

export default function Personnel() {
  const { user, isAdmin, canAssignTasks } = useAuth();
  const { toast } = useToast();
  const [showNewUserDialog, setShowNewUserDialog] = useState(false);
  const [showNewTaskDialog, setShowNewTaskDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    rank: "Trainee" as typeof RANKS[number],
  });

  const [taskFormData, setTaskFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
  });

  const [transferTo, setTransferTo] = useState("");

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: allTasks, isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const myTasks = allTasks?.filter(t => t.assignedTo === user?.username) || [];
  const assignedByMe = allTasks?.filter(t => t.assignedBy === user?.username) || [];

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/users", {
        ...userFormData,
        mustChangePassword: 1,
      });

      toast({
        title: "Erfolg",
        description: "Benutzer wurde angelegt",
      });

      setShowNewUserDialog(false);
      setUserFormData({
        username: "",
        password: "",
        rank: "Trainee",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Benutzer konnte nicht angelegt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/tasks", {
        ...taskFormData,
        assignedBy: user!.username,
        status: "offen",
      });

      toast({
        title: "Erfolg",
        description: "Aufgabe wurde erstellt",
      });

      setShowNewTaskDialog(false);
      setTaskFormData({
        title: "",
        description: "",
        assignedTo: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht erstellt werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await apiRequest("PATCH", `/api/tasks/${task.id}/status`, { status: newStatus });
      
      toast({
        title: "Erfolg",
        description: "Aufgabenstatus wurde aktualisiert",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Status konnte nicht aktualisiert werden",
        variant: "destructive",
      });
    }
  };

  const handleTransferTask = async () => {
    if (!selectedTask || !transferTo) return;

    setIsSubmitting(true);
    try {
      await apiRequest("PATCH", `/api/tasks/${selectedTask.id}/transfer`, { 
        assignedTo: transferTo 
      });
      
      toast({
        title: "Erfolg",
        description: "Aufgabe wurde übertragen",
      });
      
      setShowTransferDialog(false);
      setSelectedTask(null);
      setTransferTo("");
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Aufgabe konnte nicht übertragen werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case "offen": return "destructive";
      case "in Bearbeitung": return "default";
      case "erledigt": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Personalverwaltung</h1>
        <p className="text-muted-foreground">Verwaltung von Personal und Aufgaben</p>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="users" data-testid="tab-users">
            <Users className="w-4 h-4 mr-2" />
            Personal
          </TabsTrigger>
          <TabsTrigger value="tasks" data-testid="tab-tasks">
            <ClipboardList className="w-4 h-4 mr-2" />
            Aufgaben
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-serif font-semibold">Alle Benutzer</h2>
            {isAdmin() && (
              <Button onClick={() => setShowNewUserDialog(true)} data-testid="button-new-user">
                <Plus className="w-4 h-4 mr-2" />
                Benutzer anlegen
              </Button>
            )}
          </div>

          <Card>
            <CardContent className="pt-6">
              {usersLoading ? (
                <div className="text-center py-12 text-muted-foreground">Laden...</div>
              ) : !users || users.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Keine Benutzer vorhanden</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Benutzername</TableHead>
                        <TableHead>Rang</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((u) => (
                        <TableRow key={u.id} data-testid={`row-user-${u.id}`}>
                          <TableCell className="font-medium">{u.username}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{u.rank}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="mt-6 space-y-6">
          {canAssignTasks() && (
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-serif font-semibold">Aufgabenverwaltung</h2>
              <Button onClick={() => setShowNewTaskDialog(true)} data-testid="button-new-task">
                <Plus className="w-4 h-4 mr-2" />
                Aufgabe erstellen
              </Button>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Meine Aufgaben</CardTitle>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="text-center py-12 text-muted-foreground">Laden...</div>
                ) : myTasks.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">Keine Aufgaben zugewiesen</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myTasks.map((task) => (
                      <div 
                        key={task.id} 
                        className="p-4 border border-border rounded-md space-y-2"
                        data-testid={`my-task-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                          </div>
                          <Badge variant={getStatusBadgeVariant(task.status)}>
                            {task.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <Select
                            value={task.status}
                            onValueChange={(value) => handleStatusChange(task, value as TaskStatus)}
                          >
                            <SelectTrigger className="w-40" data-testid={`select-status-${task.id}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TASK_STATUS.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground ml-auto">
                            von {task.assignedBy}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {canAssignTasks() && (
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif">Von mir zugewiesen</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Laden...</div>
                  ) : assignedByMe.length === 0 ? (
                    <div className="text-center py-12">
                      <ClipboardList className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground">Keine Aufgaben erstellt</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {assignedByMe.map((task) => (
                        <div 
                          key={task.id} 
                          className="p-4 border border-border rounded-md space-y-2"
                          data-testid={`assigned-task-${task.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="font-medium">{task.title}</h4>
                              <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                            </div>
                            <Badge variant={getStatusBadgeVariant(task.status)}>
                              {task.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-border">
                            <span className="text-xs text-muted-foreground">
                              Zugewiesen an: {task.assignedTo}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="ml-auto"
                              onClick={() => {
                                setSelectedTask(task);
                                setShowTransferDialog(true);
                              }}
                              data-testid={`button-transfer-${task.id}`}
                            >
                              <ArrowRightLeft className="w-4 h-4 mr-2" />
                              Übertragen
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showNewUserDialog} onOpenChange={setShowNewUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Neuen Benutzer anlegen</DialogTitle>
            <DialogDescription>Erstellen Sie einen neuen Benutzer</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername *</Label>
              <Input
                id="username"
                value={userFormData.username}
                onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                required
                data-testid="input-username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Startpasswort *</Label>
              <Input
                id="password"
                type="password"
                value={userFormData.password}
                onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                required
                data-testid="input-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rank">Rang *</Label>
              <Select
                value={userFormData.rank}
                onValueChange={(value) => setUserFormData({ ...userFormData, rank: value as typeof RANKS[number] })}
              >
                <SelectTrigger data-testid="select-rank">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANKS.map((rank) => (
                    <SelectItem key={rank} value={rank}>
                      {rank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewUserDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting} data-testid="button-submit-user">
                {isSubmitting ? "Anlegen..." : "Benutzer anlegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showNewTaskDialog} onOpenChange={setShowNewTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Neue Aufgabe erstellen</DialogTitle>
            <DialogDescription>Weisen Sie einem Benutzer eine Aufgabe zu</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={taskFormData.title}
                onChange={(e) => setTaskFormData({ ...taskFormData, title: e.target.value })}
                required
                data-testid="input-task-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Beschreibung *</Label>
              <Textarea
                id="description"
                value={taskFormData.description}
                onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                required
                data-testid="input-task-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignedTo">Zuständiger Benutzer *</Label>
              <Select
                value={taskFormData.assignedTo}
                onValueChange={(value) => setTaskFormData({ ...taskFormData, assignedTo: value })}
              >
                <SelectTrigger data-testid="select-assigned-to">
                  <SelectValue placeholder="Benutzer auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((u) => (
                    <SelectItem key={u.id} value={u.username}>
                      {u.username} ({u.rank})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewTaskDialog(false)}>
                Abbrechen
              </Button>
              <Button type="submit" disabled={isSubmitting || !taskFormData.assignedTo} data-testid="button-submit-task">
                {isSubmitting ? "Erstellen..." : "Aufgabe erstellen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-serif">Aufgabe übertragen</DialogTitle>
            <DialogDescription>
              Übertragen Sie die Aufgabe "{selectedTask?.title}" an einen anderen Benutzer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transferTo">Neuer zuständiger Benutzer *</Label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger data-testid="select-transfer-to">
                  <SelectValue placeholder="Benutzer auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {users?.filter(u => u.username !== selectedTask?.assignedTo).map((u) => (
                    <SelectItem key={u.id} value={u.username}>
                      {u.username} ({u.rank})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowTransferDialog(false)}>
                Abbrechen
              </Button>
              <Button onClick={handleTransferTask} disabled={isSubmitting || !transferTo} data-testid="button-submit-transfer">
                {isSubmitting ? "Übertragen..." : "Übertragen"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
