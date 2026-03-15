import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetReadings, 
  useCreateManualReading,
  useCreateDemoReading,
  getGetReadingsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Activity, Droplets, Thermometer, Sun, Waves, CloudRain } from "lucide-react";
import { formatDate } from "@/lib/utils";

const readingSchema = z.object({
  soilMoisture: z.coerce.number().min(0).max(100),
  temperature: z.coerce.number().min(-20).max(60),
  humidity: z.coerce.number().min(0).max(100),
  lightIntensity: z.coerce.number().min(0),
  waterLevel: z.coerce.number().min(0).max(100),
});

type ReadingForm = z.infer<typeof readingSchema>;

export default function Readings() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: readings, isLoading } = useGetReadings({ limit: 50 });

  const manualMutation = useCreateManualReading({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReadingsQueryKey() });
        toast({ title: "Reading logged manually" });
        setIsDialogOpen(false);
      }
    }
  });

  const demoMutation = useCreateDemoReading({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetReadingsQueryKey() });
        toast({ title: "Generated demo reading!" });
      }
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<ReadingForm>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      soilMoisture: 45,
      temperature: 24,
      humidity: 60,
      lightIntensity: 5000,
      waterLevel: 80
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Sensor Readings</h1>
          <p className="text-muted-foreground mt-1">Raw data from all sources.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => demoMutation.mutate()} isLoading={demoMutation.isPending}>
            <Activity className="w-4 h-4 mr-2" /> Simulate Data
          </Button>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Manual Entry
          </Button>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-secondary/50 text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><Droplets className="w-4 h-4"/> Soil</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><Thermometer className="w-4 h-4"/> Temp</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><CloudRain className="w-4 h-4"/> Hum</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><Sun className="w-4 h-4"/> Light</div></th>
                <th className="px-6 py-4 font-medium"><div className="flex items-center gap-1"><Waves className="w-4 h-4"/> Water</div></th>
                <th className="px-6 py-4 font-medium">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Loading readings...</td></tr>
              ) : !readings || readings.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No readings recorded yet.</td></tr>
              ) : (
                readings.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 font-medium">{formatDate(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={r.soilMoisture < 30 ? "text-destructive font-semibold" : ""}>{r.soilMoisture}%</span>
                    </td>
                    <td className="px-6 py-4">{r.temperature}°C</td>
                    <td className="px-6 py-4">{r.humidity}%</td>
                    <td className="px-6 py-4">{r.lightIntensity} lx</td>
                    <td className="px-6 py-4">{r.waterLevel}%</td>
                    <td className="px-6 py-4">
                      <Badge variant={r.sourceType === 'manual' ? 'outline' : r.sourceType === 'demo' ? 'warning' : 'success'}>
                        {r.sourceType}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title="Manual Sensor Entry"
        description="Override or log data manually if sensors are offline."
      >
        <form onSubmit={handleSubmit((d) => manualMutation.mutate({ data: d }))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Soil Moisture (%)" type="number" {...register("soilMoisture")} error={errors.soilMoisture?.message} />
            <Input label="Temperature (°C)" type="number" {...register("temperature")} error={errors.temperature?.message} />
            <Input label="Humidity (%)" type="number" {...register("humidity")} error={errors.humidity?.message} />
            <Input label="Water Level (%)" type="number" {...register("waterLevel")} error={errors.waterLevel?.message} />
          </div>
          <Input label="Light Intensity (lux)" type="number" {...register("lightIntensity")} error={errors.lightIntensity?.message} />
          
          <Button type="submit" className="w-full mt-4" isLoading={manualMutation.isPending}>
            Save Reading
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
