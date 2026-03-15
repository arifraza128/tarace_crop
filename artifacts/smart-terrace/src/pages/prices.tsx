import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPrices,
  useGetPriceSummary,
  useGetPricePrediction,
  useCreatePriceEntry,
  useDeletePriceEntry,
  getGetPricesQueryKey,
  getGetPriceSummaryQueryKey,
} from "@workspace/api-client-react";
import { useGetCrops } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Trash2,
  IndianRupee,
  BarChart2,
  RefreshCw,
  ShoppingBasket,
  Calendar,
  Store,
  AlertCircle,
  ChevronDown
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn, formatDate } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const priceFormSchema = z.object({
  cropName: z.string().min(1, "Crop name is required"),
  pricePerKg: z.coerce.number().positive("Price must be positive"),
  marketName: z.string().default("Local Market"),
  unit: z.string().default("kg"),
  notes: z.string().optional(),
});
type PriceFormData = z.infer<typeof priceFormSchema>;

function TrendBadge({ trend, percent }: { trend: string; percent: number }) {
  const isRising = trend === "rising";
  const isFalling = trend === "falling";
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold",
      isRising ? "bg-green-100 text-green-700" :
      isFalling ? "bg-red-100 text-red-700" :
      "bg-gray-100 text-gray-600"
    )}>
      {isRising ? <TrendingUp className="w-3 h-3" /> :
       isFalling ? <TrendingDown className="w-3 h-3" /> :
       <Minus className="w-3 h-3" />}
      {isRising ? "Rising" : isFalling ? "Falling" : "Stable"}
      {percent !== 0 && <span>({percent > 0 ? "+" : ""}{percent}%/wk)</span>}
    </span>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-medium text-muted-foreground mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }} className="font-bold">
            ₹{p.value?.toFixed(2)} / {p.name}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Prices() {
  const queryClient = useQueryClient();
  const [selectedCrop, setSelectedCrop] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [customCropName, setCustomCropName] = useState("");

  const { data: summaryList = [] } = useGetPriceSummary();
  const { data: allEntries = [], isLoading: loadingEntries } = useGetPrices(
    selectedCrop ? { cropName: selectedCrop, limit: 50 } : { limit: 100 }
  );
  const { data: crops = [] } = useGetCrops();
  const { data: prediction, isLoading: loadingPred } = useGetPricePrediction(
    selectedCrop || "__none__",
    { query: { enabled: !!selectedCrop, retry: false } }
  );

  const createMutation = useCreatePriceEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPricesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPriceSummaryQueryKey() });
        setShowForm(false);
        reset();
      },
    },
  });

  const deleteMutation = useDeletePriceEntry({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPricesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPriceSummaryQueryKey() });
      },
    },
  });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<PriceFormData>({
    resolver: zodResolver(priceFormSchema),
    defaultValues: { marketName: "Local Market", unit: "kg" },
  });

  const onSubmit = (data: PriceFormData) => {
    createMutation.mutate({ data });
  };

  // Build chart data from entries for selected crop (ascending time)
  const chartEntries = selectedCrop
    ? [...allEntries].filter(e => e.cropName === selectedCrop).reverse()
    : [];
  const chartData = chartEntries.map(e => ({
    time: new Date(e.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    price: e.pricePerKg,
    unit: e.unit,
  }));

  // Add prediction points if available
  if (prediction && chartData.length > 0) {
    const lastTime = chartData[chartData.length - 1].time;
    chartData.push({ time: "Tomorrow*", price: prediction.nextDayPrice, unit: chartEntries[0]?.unit ?? "kg" });
    chartData.push({ time: "Next Week*", price: prediction.nextWeekPrice, unit: chartEntries[0]?.unit ?? "kg" });
  }

  // Unique crop names from entries + user's farm crops
  const cropNamesFromData = Array.from(new Set(allEntries.map(e => e.cropName)));
  const cropNamesFromFarm = crops.map(c => c.cropName);
  const allCropNames = Array.from(new Set([...cropNamesFromData, ...cropNamesFromFarm])).sort();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Crop Price Analytics</h1>
          <p className="text-muted-foreground text-sm mt-1">Track market prices and get smart predictions</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Price Entry
        </Button>
      </div>

      {/* Add Price Form */}
      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-primary" />
              Record Market Price
            </CardTitle>
            <CardDescription>Enter the current market price for a crop</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Crop Name *</label>
                <div className="relative">
                  <select
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none pr-8"
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setValue("cropName", "");
                      } else {
                        setValue("cropName", val);
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select or type crop...</option>
                    {allCropNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                    <option value="__custom__">+ Type custom name</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-2 top-3 text-muted-foreground pointer-events-none" />
                </div>
                <Input
                  {...register("cropName")}
                  placeholder="Or type crop name"
                  className="mt-1"
                />
                {errors.cropName && <p className="text-xs text-destructive">{errors.cropName.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Price per kg (₹) *</label>
                <Input
                  {...register("pricePerKg")}
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 45.50"
                />
                {errors.pricePerKg && <p className="text-xs text-destructive">{errors.pricePerKg.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Market Name</label>
                <Input {...register("marketName")} placeholder="e.g. Shimla Mandi" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">Unit</label>
                <select
                  {...register("unit")}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="kg">per kg</option>
                  <option value="quintal">per quintal</option>
                  <option value="dozen">per dozen</option>
                  <option value="piece">per piece</option>
                </select>
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-sm font-medium text-foreground">Farmer Notes (optional)</label>
                <Input {...register("notes")} placeholder="e.g. Good quality, seasonal demand high" />
              </div>

              <div className="sm:col-span-3 flex gap-3 pt-2">
                <Button type="submit" disabled={createMutation.isPending} className="gap-2">
                  {createMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Save Price
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); reset(); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summaryList.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Market Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {summaryList.map(item => (
              <button
                key={item.cropName}
                onClick={() => setSelectedCrop(selectedCrop === item.cropName ? "" : item.cropName)}
                className={cn(
                  "text-left p-4 rounded-2xl border transition-all duration-200",
                  selectedCrop === item.cropName
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border bg-card hover:border-primary/40"
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <ShoppingBasket className="w-5 h-5 text-primary" />
                  </div>
                  <TrendBadge trend={item.trend} percent={item.trendPercent} />
                </div>
                <p className="font-semibold text-foreground mt-2">{item.cropName}</p>
                <p className="text-2xl font-bold text-primary mt-0.5">₹{item.latestPrice.toFixed(2)}<span className="text-sm font-normal text-muted-foreground">/kg</span></p>
                <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                  <Store className="w-3 h-3" />
                  {item.marketName} · {item.entryCount} entries
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {summaryList.length === 0 && !loadingEntries && (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingBasket className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium text-foreground">No price data yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Price Entry" to record your first market price.</p>
          </CardContent>
        </Card>
      )}

      {/* Price Chart + Prediction Panel */}
      {selectedCrop && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-primary" />
                {selectedCrop} — Price Trend
              </CardTitle>
              <CardDescription>Historical prices with next-day and next-week forecast (*)</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <div className="flex flex-col items-center py-10 text-muted-foreground">
                  <AlertCircle className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">Add at least 2 price entries to see the chart.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `₹${v}`}
                      width={52}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {prediction && (
                      <ReferenceLine
                        x="Tomorrow*"
                        stroke="hsl(var(--primary))"
                        strokeDasharray="4 4"
                        label={{ value: "Forecast", fill: "hsl(var(--primary))", fontSize: 11 }}
                      />
                    )}
                    <Line
                      type="monotone"
                      dataKey="price"
                      name={chartEntries[0]?.unit ?? "kg"}
                      stroke="hsl(var(--primary))"
                      strokeWidth={2.5}
                      dot={(props) => {
                        const { cx, cy, payload } = props;
                        const isForecast = payload.time?.includes("*");
                        return (
                          <circle
                            key={`dot-${cx}-${cy}`}
                            cx={cx}
                            cy={cy}
                            r={isForecast ? 5 : 4}
                            fill={isForecast ? "hsl(var(--primary)/0.3)" : "hsl(var(--primary))"}
                            stroke={isForecast ? "hsl(var(--primary))" : "white"}
                            strokeWidth={isForecast ? 2 : 1.5}
                            strokeDasharray={isForecast ? "3 2" : "0"}
                          />
                        );
                      }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Prediction Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-4 h-4 text-primary" />
                Price Prediction
              </CardTitle>
              <CardDescription>Based on moving average trend</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingPred ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-muted rounded-xl" />)}
                </div>
              ) : prediction ? (
                <>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Current Price</p>
                    <p className="text-3xl font-bold text-primary mt-1">₹{prediction.currentPrice.toFixed(2)}</p>
                    <TrendBadge trend={prediction.trend} percent={prediction.trendPercent} />
                  </div>

                  <div className="p-4 rounded-xl bg-secondary border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Tomorrow (Est.)</p>
                    <p className="text-2xl font-bold text-foreground mt-1">₹{prediction.nextDayPrice.toFixed(2)}</p>
                    <p className={cn("text-xs font-medium mt-1",
                      prediction.nextDayPrice > prediction.currentPrice ? "text-green-600" :
                      prediction.nextDayPrice < prediction.currentPrice ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {prediction.nextDayPrice > prediction.currentPrice ? "+" : ""}
                      {(prediction.nextDayPrice - prediction.currentPrice).toFixed(2)} from today
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary border border-border">
                    <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wide">Next Week (Est.)</p>
                    <p className="text-2xl font-bold text-foreground mt-1">₹{prediction.nextWeekPrice.toFixed(2)}</p>
                    <p className={cn("text-xs font-medium mt-1",
                      prediction.nextWeekPrice > prediction.currentPrice ? "text-green-600" :
                      prediction.nextWeekPrice < prediction.currentPrice ? "text-red-600" : "text-muted-foreground"
                    )}>
                      {prediction.nextWeekPrice > prediction.currentPrice ? "+" : ""}
                      {(prediction.nextWeekPrice - prediction.currentPrice).toFixed(2)} from today
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700">{prediction.note}</p>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">Based on {prediction.dataPoints} data points</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No prediction available yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Price History Table */}
      {allEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Price History {selectedCrop ? `— ${selectedCrop}` : "(All Crops)"}
            </CardTitle>
            <CardDescription>
              {selectedCrop
                ? `Showing all entries for ${selectedCrop}`
                : "Showing latest 100 entries across all crops"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-semibold text-muted-foreground">Crop</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Price</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Market</th>
                    <th className="pb-3 font-semibold text-muted-foreground hidden md:table-cell">Notes</th>
                    <th className="pb-3 font-semibold text-muted-foreground">Date</th>
                    <th className="pb-3 font-semibold text-muted-foreground"></th>
                  </tr>
                </thead>
                <tbody>
                  {allEntries.slice(0, 30).map(entry => (
                    <tr key={entry.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 font-medium">{entry.cropName}</td>
                      <td className="py-3">
                        <span className="font-bold text-primary">₹{entry.pricePerKg.toFixed(2)}</span>
                        <span className="text-xs text-muted-foreground ml-1">/{entry.unit}</span>
                      </td>
                      <td className="py-3 text-muted-foreground flex items-center gap-1">
                        <Store className="w-3 h-3 shrink-0" />
                        {entry.marketName}
                      </td>
                      <td className="py-3 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                        {entry.notes ?? "—"}
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">
                        {formatDate(entry.createdAt)}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => deleteMutation.mutate({ id: entry.id })}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
