import { useQueryClient } from "@tanstack/react-query";
import { 
  useGetLatestReading, 
  useGetFarm, 
  useGetCrops, 
  useGetAlerts, 
  useGetRecommendations,
  useCreateDemoReading,
  useGetPriceSummary,
  getGetLatestReadingQueryKey,
  getGetReadingsQueryKey,
  getGetAlertsQueryKey,
  getGetRecommendationsQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Droplets, 
  Thermometer, 
  CloudRain, 
  Sun, 
  Waves, 
  Leaf, 
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Activity,
  ShoppingBasket,
  TrendingUp,
  TrendingDown,
  Minus
} from "lucide-react";
import { Link } from "wouter";
import { formatShortDate, cn } from "@/lib/utils";

export default function Dashboard() {
  const queryClient = useQueryClient();
  
  const { data: farm } = useGetFarm({ query: { retry: false } });
  const { data: latest } = useGetLatestReading({ query: { retry: false } });
  const { data: crops } = useGetCrops();
  const { data: alerts } = useGetAlerts({ status: 'active' });
  const { data: recommendations } = useGetRecommendations();
  
  const demoMutation = useCreateDemoReading({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetLatestReadingQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetReadingsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRecommendationsQueryKey() });
      }
    }
  });

  const { data: priceSummary = [] } = useGetPriceSummary({ query: { retry: false } });

  const activeCrops = crops?.filter(c => c.growthStage !== 'harvested') || [];
  const topAlerts = alerts?.slice(0, 3) || [];
  const topRecs = recommendations?.slice(0, 3) || [];

  const StatCard = ({ title, value, unit, icon: Icon, statusClass, subtitle }: any) => (
    <Card className="relative overflow-hidden group">
      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${statusClass} opacity-10 rounded-full blur-2xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-500`}></div>
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <h3 className="text-3xl font-display font-bold text-foreground">{value ?? '--'}</h3>
              {value && <span className="text-sm font-medium text-muted-foreground">{unit}</span>}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
          </div>
          <div className={`p-3 rounded-xl ${statusClass} bg-opacity-10 text-opacity-100`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Overview</h1>
          <p className="text-muted-foreground mt-1">Here's what's happening on your farm today.</p>
        </div>
        <Button 
          onClick={() => demoMutation.mutate()} 
          isLoading={demoMutation.isPending}
          variant="secondary"
        >
          <Activity className="w-4 h-4 mr-2" />
          Simulate Sensor Data
        </Button>
      </div>

      {!farm && (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-200 text-amber-700 rounded-full">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-amber-900">Farm Profile Missing</h3>
                <p className="text-sm text-amber-800">Please set up your farm profile to get accurate recommendations.</p>
              </div>
            </div>
            <Link href="/farm">
              <Button variant="primary">Setup Farm</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Sensor Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Soil Moisture" 
          value={latest?.soilMoisture} 
          unit="%" 
          icon={Droplets}
          statusClass={!latest ? "from-gray-400 to-gray-500 text-gray-500" : latest.soilMoisture < 30 ? "from-red-400 to-red-600 text-red-600" : latest.soilMoisture > 60 ? "from-blue-400 to-blue-600 text-blue-600" : "from-emerald-400 to-emerald-600 text-emerald-600"}
          subtitle={latest ? "Updated just now" : "No data"}
        />
        <StatCard 
          title="Temperature" 
          value={latest?.temperature} 
          unit="°C" 
          icon={Thermometer}
          statusClass={!latest ? "from-gray-400 to-gray-500 text-gray-500" : latest.temperature < 15 ? "from-blue-400 to-blue-600 text-blue-600" : latest.temperature > 35 ? "from-red-400 to-red-600 text-red-600" : "from-emerald-400 to-emerald-600 text-emerald-600"}
        />
        <StatCard 
          title="Humidity" 
          value={latest?.humidity} 
          unit="%" 
          icon={CloudRain}
          statusClass={!latest ? "from-gray-400 to-gray-500 text-gray-500" : latest.humidity < 30 ? "from-amber-400 to-amber-600 text-amber-600" : "from-emerald-400 to-emerald-600 text-emerald-600"}
        />
        <StatCard 
          title="Light Intensity" 
          value={latest?.lightIntensity} 
          unit="lux" 
          icon={Sun}
          statusClass="from-amber-400 to-yellow-600 text-amber-500"
        />
        <StatCard 
          title="Water Level (Tank)" 
          value={latest?.waterLevel} 
          unit="%" 
          icon={Waves}
          statusClass={!latest ? "from-gray-400 to-gray-500 text-gray-500" : latest.waterLevel < 25 ? "from-red-400 to-red-600 text-red-600" : "from-blue-400 to-blue-600 text-blue-600"}
        />
        
        {/* Farm summary mini card */}
        <Card className="bg-primary text-primary-foreground border-none shadow-xl shadow-primary/20">
          <CardContent className="p-6 h-full flex flex-col justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm font-medium mb-1">Active Crops</p>
              <div className="flex items-center gap-2">
                <Leaf className="w-8 h-8 text-white" />
                <h3 className="text-3xl font-display font-bold text-white">{activeCrops.length}</h3>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/crops" className="text-sm font-medium text-white/90 hover:text-white flex items-center gap-1">
                Manage Crops <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Recent issues requiring attention</CardDescription>
            </div>
            <Badge variant={topAlerts.length > 0 ? "destructive" : "success"}>
              {topAlerts.length} Active
            </Badge>
          </CardHeader>
          <CardContent>
            {topAlerts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                  <Leaf className="w-6 h-6 text-emerald-600" />
                </div>
                <p>All clear! Your farm is healthy.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topAlerts.map(alert => (
                  <div key={alert.id} className="flex items-start gap-4 p-4 rounded-xl border border-border bg-background">
                    <div className={cn(
                      "p-2 rounded-full mt-0.5",
                      alert.severity === 'high' ? "bg-red-100 text-red-600" :
                      alert.severity === 'medium' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                    )}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{alert.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground/60 mt-2">{formatShortDate(alert.createdAt)}</p>
                    </div>
                  </div>
                ))}
                <Link href="/alerts">
                  <Button variant="outline" className="w-full mt-2">View All Alerts</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>AI Recommendations</CardTitle>
            <CardDescription>Based on your latest sensor data</CardDescription>
          </CardHeader>
          <CardContent>
            {topRecs.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground flex flex-col items-center">
                <Lightbulb className="w-10 h-10 text-muted-foreground/30 mb-3" />
                <p>Waiting for sensor data to generate insights.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topRecs.map(rec => {
                  let IconComponent = Lightbulb;
                  if (rec.category === 'irrigation') IconComponent = Droplets;
                  if (rec.category === 'temperature') IconComponent = Thermometer;
                  if (rec.category === 'crop') IconComponent = Leaf;

                  return (
                    <div key={rec.id} className="flex items-start gap-4 p-4 rounded-xl border border-primary/20 bg-primary/5">
                      <div className="p-2 rounded-full mt-0.5 bg-white text-primary shadow-sm">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-primary/70">{rec.category}</span>
                        <p className="text-sm font-medium mt-0.5">{rec.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Crop Prices Widget */}
      {priceSummary.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBasket className="w-5 h-5 text-primary" />
                Market Prices
              </CardTitle>
              <CardDescription>Latest prices from your records</CardDescription>
            </div>
            <Link href="/prices">
              <Button variant="ghost" size="sm" className="gap-1 text-primary">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {priceSummary.slice(0, 5).map(item => {
                const isRising = item.trend === "rising";
                const isFalling = item.trend === "falling";
                const TrendIcon = isRising ? TrendingUp : isFalling ? TrendingDown : Minus;
                return (
                  <Link key={item.cropName} href="/prices">
                    <div className={cn(
                      "p-3 rounded-xl border transition-colors cursor-pointer",
                      isRising ? "bg-green-50 border-green-200" :
                      isFalling ? "bg-red-50 border-red-200" :
                      "bg-secondary border-border"
                    )}>
                      <p className="text-xs font-semibold text-muted-foreground truncate">{item.cropName}</p>
                      <p className="text-lg font-bold text-foreground mt-1">₹{item.latestPrice.toFixed(2)}</p>
                      <div className={cn(
                        "flex items-center gap-1 text-xs font-medium mt-1",
                        isRising ? "text-green-700" : isFalling ? "text-red-700" : "text-muted-foreground"
                      )}>
                        <TrendIcon className="w-3 h-3" />
                        {isRising ? "Rising" : isFalling ? "Falling" : "Stable"}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
