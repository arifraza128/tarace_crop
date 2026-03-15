import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGetFarm, useCreateFarm, useUpdateFarm, getGetFarmQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Map, MapPin } from "lucide-react";
import { useEffect } from "react";

const farmSchema = z.object({
  farmerName: z.string().min(2, "Required"),
  farmName: z.string().min(2, "Required"),
  location: z.string().min(2, "Required"),
  regionType: z.string().default("hilly"),
  terraceCount: z.coerce.number().optional().nullable(),
  farmSize: z.string().optional().nullable(),
  soilType: z.string().optional().nullable(),
  waterSource: z.string().optional().nullable(),
});

type FarmForm = z.infer<typeof farmSchema>;

export default function FarmSetup() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: farm, isLoading } = useGetFarm({
    query: { retry: false }
  });

  const createMutation = useCreateFarm({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFarmQueryKey() });
        toast({ title: "Farm profile created successfully!" });
      }
    }
  });

  const updateMutation = useUpdateFarm({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFarmQueryKey() });
        toast({ title: "Farm profile updated successfully!" });
      }
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FarmForm>({
    resolver: zodResolver(farmSchema),
    defaultValues: { regionType: "hilly" }
  });

  useEffect(() => {
    if (farm) {
      reset(farm);
    }
  }, [farm, reset]);

  const onSubmit = (data: FarmForm) => {
    if (farm) {
      updateMutation.mutate({ data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Farm Setup</h1>
        <p className="text-muted-foreground mt-1">Configure your terrace farm details for better AI recommendations.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Profile Details
          </CardTitle>
          <CardDescription>Basic information about your agricultural setup.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Farm Name"
                placeholder="Green Valley Terrace"
                {...register("farmName")}
                error={errors.farmName?.message}
              />
              <Input
                label="Farmer Name"
                placeholder="John Doe"
                {...register("farmerName")}
                error={errors.farmerName?.message}
              />
              <Input
                label="Location / Region"
                placeholder="Himalayan foothills"
                {...register("location")}
                error={errors.location?.message}
              />
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Region Type</label>
                <select 
                  className="flex h-12 w-full rounded-xl border-2 border-border bg-white px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
                  {...register("regionType")}
                >
                  <option value="hilly">Hilly Terrain</option>
                  <option value="mountainous">Mountainous</option>
                  <option value="plateau">Plateau</option>
                </select>
              </div>
            </div>

            <div className="border-t border-border pt-6 mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Technical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Number of Terraces"
                  type="number"
                  placeholder="12"
                  {...register("terraceCount")}
                />
                <Input
                  label="Total Farm Size"
                  placeholder="2.5 Acres"
                  {...register("farmSize")}
                />
                <Input
                  label="Primary Soil Type"
                  placeholder="Loamy, Clay"
                  {...register("soilType")}
                />
                <Input
                  label="Main Water Source"
                  placeholder="Rainwater, Mountain Stream"
                  {...register("waterSource")}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" isLoading={isPending}>
                {farm ? "Save Changes" : "Create Farm Profile"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
