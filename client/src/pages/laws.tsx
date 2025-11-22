import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollText, Save } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CityLaws } from "@shared/schema";

export default function Laws() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: laws, isLoading } = useQuery<CityLaws>({
    queryKey: ["/api/laws"],
  });

  useEffect(() => {
    if (laws) {
      setContent(laws.content);
    }
  }, [laws]);

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      await apiRequest("POST", "/api/laws", {
        content,
        updatedBy: user!.username,
      });

      toast({
        title: "Erfolg",
        description: "Stadtgesetze wurden gespeichert",
      });

      queryClient.invalidateQueries({ queryKey: ["/api/laws"] });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Stadtgesetze konnten nicht gespeichert werden",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Stadtgesetze</h1>
        <p className="text-muted-foreground">Verwaltung der Stadtgesetze von Rhodes</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-primary" />
            <CardTitle className="font-serif">Gesetzestexte</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Laden...</div>
          ) : (
            <>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Gesetzestexte hier eingeben..."
                className="min-h-[500px] font-mono text-sm"
                data-testid="input-laws"
              />
              
              <div className="flex items-center justify-between gap-4 pt-4 border-t border-border">
                <div className="text-sm text-muted-foreground">
                  {laws?.updatedBy && (
                    <span>Zuletzt bearbeitet von: {laws.updatedBy}</span>
                  )}
                </div>
                <Button 
                  onClick={handleSave} 
                  disabled={isSubmitting}
                  data-testid="button-save-laws"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Speichern..." : "Gesetze speichern"}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
