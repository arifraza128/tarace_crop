import { useState } from "react";
import { useGetAlerts, useResolveAlert, getGetAlertsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

export default function Alerts() {
  const [filter, setFilter] = useState<'active' | 'resolved' | 'all'>('active');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Send status to API if not 'all'
  const { data: alerts, isLoading } = useGetAlerts(filter !== 'all' ? { status: filter } : undefined);

  const resolveMutation = useResolveAlert({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
        toast({ title: "Alert marked as resolved" });
      }
    }
  });

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high': return "border-red-200 bg-red-50";
      case 'medium': return "border-amber-200 bg-amber-50";
      case 'low': return "border-blue-200 bg-blue-50";
      default: return "border-border bg-background";
    }
  };

  const getIconStyles = (severity: string) => {
    switch (severity) {
      case 'high': return "bg-red-100 text-red-600";
      case 'medium': return "bg-amber-100 text-amber-600";
      case 'low': return "bg-blue-100 text-blue-600";
      default: return "bg-secondary text-foreground";
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">System Alerts</h1>
          <p className="text-muted-foreground mt-1">Monitor issues requiring your attention.</p>
        </div>
        
        <div className="flex p-1 bg-secondary rounded-xl border border-border/50">
          <button 
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", filter === 'active' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
            onClick={() => setFilter('active')}
          >
            Active
          </button>
          <button 
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", filter === 'resolved' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </button>
          <button 
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", filter === 'all' ? "bg-white shadow-sm text-foreground" : "text-muted-foreground")}
            onClick={() => setFilter('all')}
          >
            All
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading alerts...</div>
        ) : !alerts || alerts.length === 0 ? (
          <Card className="border-dashed border-2 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-xl font-display font-bold text-foreground">All Clear</h3>
              <p className="text-muted-foreground">No {filter !== 'all' ? filter : ''} alerts found.</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={cn(
                "p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4",
                alert.status === 'active' ? getSeverityStyles(alert.severity) : "bg-white opacity-70 border-border"
              )}
            >
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", 
                alert.status === 'active' ? getIconStyles(alert.severity) : "bg-gray-100 text-gray-400"
              )}>
                {alert.status === 'active' ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-foreground">{alert.title}</h3>
                  {alert.status === 'active' && (
                    <Badge variant={alert.severity === 'high' ? 'destructive' : alert.severity === 'medium' ? 'warning' : 'default'}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  )}
                  {alert.status === 'resolved' && <Badge variant="outline">RESOLVED</Badge>}
                </div>
                <p className="text-muted-foreground">{alert.message}</p>
                <div className="flex items-center text-xs text-muted-foreground mt-3 font-medium">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {formatDate(alert.createdAt)}
                </div>
              </div>

              {alert.status === 'active' && (
                <Button 
                  variant="outline" 
                  className="shrink-0 bg-white hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                  onClick={() => resolveMutation.mutate({ id: alert.id })}
                  isLoading={resolveMutation.isPending && resolveMutation.variables?.id === alert.id}
                >
                  Mark Resolved
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
