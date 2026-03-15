import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  useGetCrops, 
  useCreateCrop, 
  useUpdateCrop, 
  useDeleteCrop,
  getGetCropsQueryKey,
  type Crop
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit2, Trash2, Sprout, Calendar } from "lucide-react";
import { formatShortDate } from "@/lib/utils";

const cropSchema = z.object({
  cropName: z.string().min(2, "Required"),
  cropType: z.string().min(2, "Required"),
  sowingDate: z.string().optional().nullable(),
  growthStage: z.string().min(1, "Required"),
  notes: z.string().optional().nullable(),
});

type CropForm = z.infer<typeof cropSchema>;

export default function Crops() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: crops, isLoading } = useGetCrops();

  const createMutation = useCreateCrop({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCropsQueryKey() });
        toast({ title: "Crop added successfully!" });
        closeDialog();
      }
    }
  });

  const updateMutation = useUpdateCrop({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCropsQueryKey() });
        toast({ title: "Crop updated!" });
        closeDialog();
      }
    }
  });

  const deleteMutation = useDeleteCrop({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCropsQueryKey() });
        toast({ title: "Crop removed." });
      }
    }
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CropForm>({
    resolver: zodResolver(cropSchema),
    defaultValues: { growthStage: "seedling" }
  });

  const openNewDialog = () => {
    setEditingCrop(null);
    reset({ growthStage: "seedling", cropName: "", cropType: "", sowingDate: "", notes: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (crop: Crop) => {
    setEditingCrop(crop);
    reset({
      cropName: crop.cropName,
      cropType: crop.cropType,
      sowingDate: crop.sowingDate ? crop.sowingDate.split('T')[0] : "",
      growthStage: crop.growthStage,
      notes: crop.notes || ""
    });
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => setEditingCrop(null), 200);
  };

  const onSubmit = (data: CropForm) => {
    if (editingCrop) {
      updateMutation.mutate({ id: editingCrop.id, data });
    } else {
      createMutation.mutate({ data });
    }
  };

  const stageColors: Record<string, string> = {
    seedling: "bg-lime-100 text-lime-800 border-lime-200",
    vegetative: "bg-emerald-100 text-emerald-800 border-emerald-200",
    flowering: "bg-pink-100 text-pink-800 border-pink-200",
    fruiting: "bg-amber-100 text-amber-800 border-amber-200",
    harvesting: "bg-orange-100 text-orange-800 border-orange-200",
    harvested: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Crop Management</h1>
          <p className="text-muted-foreground mt-1">Track what you are growing on your terraces.</p>
        </div>
        <Button onClick={openNewDialog}>
          <Plus className="w-5 h-5 mr-2" />
          Add Crop
        </Button>
      </div>

      {isLoading ? (
        <div>Loading crops...</div>
      ) : !crops || crops.length === 0 ? (
        <Card className="border-dashed border-2 bg-transparent shadow-none">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Sprout className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">No crops tracked yet</h3>
            <p className="text-muted-foreground mb-6">Add your first crop to start monitoring its lifecycle.</p>
            <Button onClick={openNewDialog} variant="outline">Add First Crop</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crops.map((crop) => (
            <Card key={crop.id} className="flex flex-col">
              <CardContent className="p-6 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold font-display">{crop.cropName}</h3>
                    <p className="text-sm text-muted-foreground">{crop.cropType}</p>
                  </div>
                  <Badge className={stageColors[crop.growthStage] || ""}>
                    {crop.growthStage.charAt(0).toUpperCase() + crop.growthStage.slice(1)}
                  </Badge>
                </div>
                
                <div className="space-y-3 flex-1 mb-6">
                  <div className="flex items-center text-sm">
                    <Calendar className="w-4 h-4 mr-2 text-muted-foreground" />
                    <span className="text-muted-foreground mr-1">Sown:</span> 
                    <span className="font-medium">{crop.sowingDate ? formatShortDate(crop.sowingDate) : 'Unknown'}</span>
                  </div>
                  {crop.notes && (
                    <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-xl line-clamp-3">
                      "{crop.notes}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-4 border-t border-border/50 mt-auto">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEditDialog(crop)}>
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0 text-destructive hover:bg-destructive hover:text-white hover:border-destructive"
                    onClick={() => {
                      if(confirm("Delete this crop?")) deleteMutation.mutate({ id: crop.id });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog 
        isOpen={isDialogOpen} 
        onClose={closeDialog}
        title={editingCrop ? "Edit Crop" : "Add New Crop"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Crop Name" placeholder="e.g. Basmati Rice" {...register("cropName")} error={errors.cropName?.message} />
          <Input label="Crop Type/Variety" placeholder="e.g. Cereal" {...register("cropType")} error={errors.cropType?.message} />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Growth Stage</label>
            <select 
              className="flex h-12 w-full rounded-xl border-2 border-border bg-white px-4 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all"
              {...register("growthStage")}
            >
              <option value="seedling">Seedling</option>
              <option value="vegetative">Vegetative</option>
              <option value="flowering">Flowering</option>
              <option value="fruiting">Fruiting / Grain Fill</option>
              <option value="harvesting">Harvesting</option>
              <option value="harvested">Harvested</option>
            </select>
          </div>

          <Input label="Sowing Date" type="date" {...register("sowingDate")} />
          
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">Notes</label>
            <textarea 
              className="flex w-full rounded-xl border-2 border-border bg-white px-4 py-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-all min-h-[100px]"
              placeholder="Any specific observations..."
              {...register("notes")}
            />
          </div>

          <Button type="submit" className="w-full" isLoading={createMutation.isPending || updateMutation.isPending}>
            {editingCrop ? "Save Changes" : "Add Crop"}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}
