import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetDevices, useCreateDevice, getGetDevicesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Cpu, Wifi, WifiOff, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

const deviceSchema = z.object({
  deviceId: z.string().min(3, "Required"),
  deviceName: z.string().min(2, "Required"),
  deviceType: z.string().min(2, "Required"),
});

type DeviceForm = z.infer<typeof deviceSchema>;

export default function Devices() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: devices, isLoading } = useGetDevices();

  const createMutation = useCreateDevice({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetDevicesQueryKey() });
        toast({ title: "Device registered successfully!" });
        setIsDialogOpen(false);
      }
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<DeviceForm>({
    resolver: zodResolver(deviceSchema),
    defaultValues: { deviceType: "sensor_node" }
  });

  const onSubmit = (data: DeviceForm) => {
    createMutation.mutate({ data });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">IoT Devices</h1>
          <p className="text-muted-foreground mt-1">Manage hardware installed on your terraces.</p>
        </div>
        <Button onClick={() => { reset(); setIsDialogOpen(true); }}>
          <Plus className="w-5 h-5 mr-2" />
          Register Device
        </Button>
      </div>

      {isLoading ? (
        <div>Loading devices...</div>
      ) : !devices || devices.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Cpu className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No devices registered</h3>
            <p className="text-muted-foreground mb-6">Connect a sensor node to automate data collection.</p>
            <Button onClick={() => setIsDialogOpen(true)} variant="outline">Register Device</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {devices.map((device) => (
            <Card key={device.id} className="relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-border group-hover:bg-primary transition-colors"></div>
              <CardContent className="p-6 pl-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{device.deviceName}</h3>
                    <p className="text-xs text-muted-foreground font-mono">{device.deviceId}</p>
                  </div>
                  <Badge variant={device.status === 'online' ? 'success' : 'destructive'} className="flex items-center gap-1">
                    {device.status === 'online' ? <Wifi className="w-3 h-3"/> : <WifiOff className="w-3 h-3"/>}
                    {device.status.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2 mt-4 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Type:</span> {device.deviceType}</p>
                  <p className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Last Sync: {device.lastSync ? formatDate(device.lastSync) : 'Never'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        title="Register New Device"
        description="Add a physical sensor node to your farm network."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label="Hardware ID (MAC/Serial)" 
            placeholder="e.g. SN-TR-001" 
            {...register("deviceId")} 
            error={errors.deviceId?.message} 
          />
          <Input 
            label="Display Name" 
            placeholder="e.g. Terrace 1 Main Sensor" 
            {...register("deviceName")} 
            error={errors.deviceName?.message} 
          />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Device Type</label>
            <select 
              className="flex h-12 w-full rounded-xl border-2 border-border bg-white px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
              {...register("deviceType")}
            >
              <option value="sensor_node">Sensor Node (Multi-sensor)</option>
              <option value="water_pump">Water Pump Controller</option>
              <option value="weather_station">Weather Station</option>
            </select>
          </div>

          <Button type="submit" className="w-full mt-4" isLoading={createMutation.isPending}>
            Register Device
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
