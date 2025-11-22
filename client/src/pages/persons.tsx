import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, FileText, Camera } from "lucide-react";
import { useState } from "react";
import type { PersonSummary } from "@shared/schema";
import { format } from "date-fns";
import { de } from "date-fns/locale";

export default function Persons() {
  const [selectedPerson, setSelectedPerson] = useState<PersonSummary | null>(null);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);

  const { data: persons, isLoading } = useQuery<PersonSummary[]>({
    queryKey: ["/api/persons"],
  });

  const handleViewHistory = (person: PersonSummary) => {
    setSelectedPerson(person);
    setShowHistoryDialog(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Personenakte</h1>
        <p className="text-muted-foreground">Übersicht aller erfassten Personen</p>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Laden...</div>
      ) : !persons || persons.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Keine Personen erfasst</p>
            <p className="text-sm text-muted-foreground mt-2">
              Personen werden automatisch aus Fallakten übernommen
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {persons.map((person) => (
            <Card key={person.name} className="hover-elevate" data-testid={`card-person-${person.name}`}>
              <CardHeader>
                <div className="flex items-start gap-4">
                  {person.photo ? (
                    <div className="w-16 h-16 rounded-md border-2 border-border overflow-hidden flex-shrink-0">
                      <img 
                        src={person.photo} 
                        alt={person.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-md border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                      <Camera className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-serif text-lg truncate">{person.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{person.caseCount} Fälle</Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {person.characteristics && (
                  <div>
                    <p className="text-xs text-muted-foreground">Merkmale</p>
                    <p className="text-sm">{person.characteristics}</p>
                  </div>
                )}
                
                {person.lastCrime && (
                  <div>
                    <p className="text-xs text-muted-foreground">Letztes Delikt</p>
                    <p className="text-sm">{person.lastCrime}</p>
                  </div>
                )}

                {person.lastCaseDate && (
                  <div>
                    <p className="text-xs text-muted-foreground">Letzte Fallakte</p>
                    <p className="text-sm">
                      {format(new Date(person.lastCaseDate), "dd.MM.yyyy", { locale: de })}
                    </p>
                  </div>
                )}

                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4"
                  onClick={() => handleViewHistory(person)}
                  data-testid={`button-history-${person.name}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Historie anzeigen
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Historie - {selectedPerson?.name}</DialogTitle>
          </DialogHeader>
          {selectedPerson && (
            <div className="space-y-4">
              <div className="flex items-start gap-4 pb-4 border-b border-border">
                {selectedPerson.photo ? (
                  <div className="w-24 h-24 rounded-md border-2 border-border overflow-hidden flex-shrink-0">
                    <img 
                      src={selectedPerson.photo} 
                      alt={selectedPerson.name} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-md border-2 border-border bg-muted flex items-center justify-center flex-shrink-0">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-xl font-serif font-bold">{selectedPerson.name}</h3>
                  {selectedPerson.characteristics && (
                    <p className="text-sm text-muted-foreground mt-1">{selectedPerson.characteristics}</p>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">{selectedPerson.caseCount} Fälle insgesamt</Badge>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-3">Alle Fallakten</h4>
                <div className="space-y-3">
                  {selectedPerson.cases.map((caseItem) => (
                    <div 
                      key={caseItem.id} 
                      className="p-4 border border-border rounded-md space-y-2"
                      data-testid={`history-case-${caseItem.id}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-medium">{caseItem.caseNumber}</span>
                            <Badge variant="outline" className="text-xs">{caseItem.status}</Badge>
                          </div>
                          <p className="text-sm font-medium">{caseItem.crime}</p>
                          {caseItem.notes && (
                            <p className="text-sm text-muted-foreground mt-1">{caseItem.notes}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
                        <span>Bearbeiter: {caseItem.handler}</span>
                        <span>•</span>
                        <span>{format(new Date(caseItem.createdAt), "dd.MM.yyyy", { locale: de })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
