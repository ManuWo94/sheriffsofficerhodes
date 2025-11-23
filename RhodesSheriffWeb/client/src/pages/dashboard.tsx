import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FolderOpen, Lock, Target, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface DashboardStats {
  activeCases: number;
  currentInmates: number;
  registeredWeapons: number;
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentActivity, isLoading: activityLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit/recent"],
  });

  const statCards = [
    {
      title: "Aktive Fallakten",
      value: stats?.activeCases ?? 0,
      icon: FolderOpen,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Aktuelle Inhaftierte",
      value: stats?.currentInmates ?? 0,
      icon: Lock,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Registrierte Waffen",
      value: stats?.registeredWeapons ?? 0,
      icon: Target,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("erstellt") || action.includes("angelegt")) return "default";
    if (action.includes("gelöscht")) return "destructive";
    if (action.includes("geändert") || action.includes("aktualisiert")) return "secondary";
    return "outline";
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2" data-testid="text-page-title">
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Übersicht über das Sheriff's Office Rhodes
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.title} className="hover-elevate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {statsLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="text-3xl font-bold text-foreground" data-testid={`stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Letzte Aktivitäten</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {activityLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-2 w-2 rounded-full mt-2" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentActivity && recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  data-testid={`activity-${log.id}`}
                >
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                        {log.entity}
                      </Badge>
                      <span className="text-sm text-foreground font-medium">{log.action}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{log.username}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(log.timestamp), "dd.MM.yyyy HH:mm", { locale: de })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Noch keine Aktivitäten vorhanden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
