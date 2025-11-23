import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { AuditLog } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Audit() {
  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ["/api/audit"],
  });

  const getActionBadgeVariant = (action: string) => {
    if (action.includes("erstellt") || action.includes("angelegt")) return "default";
    if (action.includes("gelöscht")) return "destructive";
    if (action.includes("geändert") || action.includes("aktualisiert")) return "secondary";
    return "outline";
  };

  const getEntityColor = (entity: string) => {
    const colors: Record<string, string> = {
      "case": "text-chart-1",
      "jail": "text-chart-2",
      "weapon": "text-chart-3",
      "user": "text-chart-4",
      "task": "text-chart-5",
      "fine": "text-primary",
      "law": "text-muted-foreground",
      "note": "text-secondary-foreground",
    };
    return colors[entity] || "text-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Protokoll</h1>
        <p className="text-muted-foreground">Alle Systemaktivitäten im Überblick</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Audit Log</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Laden...</div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Keine Einträge vorhanden</p>
            </div>
          ) : (
            <div className="space-y-4">
              {auditLogs.map((log) => (
                <div 
                  key={log.id} 
                  className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0"
                  data-testid={`audit-${log.id}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 ${getEntityColor(log.entity).replace('text-', 'bg-')}`} />
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={getActionBadgeVariant(log.action)} className="text-xs">
                        {log.entity}
                      </Badge>
                      <span className="text-sm text-foreground font-medium">{log.action}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.details}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-medium">{log.username}</span>
                      <span>•</span>
                      <span>{format(new Date(log.timestamp), "dd.MM.yyyy HH:mm:ss", { locale: de })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
