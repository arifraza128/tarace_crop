import { useState } from "react";
import { useGetDailyAnalytics, useGetWeeklyAnalytics, useGetMonthlyAnalytics, useGetAnalyticsSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Leaf, Droplets, Thermometer, TrendingUp } from "lucide-react";
import { formatShortDate, cn } from "@/lib/utils";

export default function Analytics() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  const { data: summary } = useGetAnalyticsSummary();
  
  // Conditionally fetch based on period
  const dailyQuery = useGetDailyAnalytics({ query: { enabled: period === 'daily' } });
  const weeklyQuery = useGetWeeklyAnalytics({ query: { enabled: period === 'weekly' } });
  const monthlyQuery = useGetMonthlyAnalytics({ query: { enabled: period === 'monthly' } });

  const activeQuery = period === 'daily' ? dailyQuery : period === 'weekly' ? weeklyQuery : monthlyQuery;
  const data = activeQuery.data;

  // Format data for charts
  const chartData = data?.points?.map(p => ({
    ...p,
    timeLabel: formatShortDate(p.timestamp)
  })) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground mt-1">Data-driven decisions for your terrace farm.</p>
        </div>
        
        <div className="flex bg-secondary p-1 rounded-xl">
          <Button 
            variant={period === 'daily' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('daily')}
            className={period === 'daily' ? 'shadow-sm' : ''}
          >
            Daily
          </Button>
          <Button 
            variant={period === 'weekly' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('weekly')}
            className={period === 'weekly' ? 'shadow-sm' : ''}
          >
            Weekly
          </Button>
          <Button 
            variant={period === 'monthly' ? 'primary' : 'ghost'} 
            size="sm" 
            onClick={() => setPeriod('monthly')}
            className={period === 'monthly' ? 'shadow-sm' : ''}
          >
            Monthly
          </Button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-emerald-500 to-emerald-700 text-white border-none shadow-lg shadow-emerald-900/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"><TrendingUp className="w-5 h-5"/></div>
                <h3 className="font-semibold text-emerald-50">Farm Condition</h3>
              </div>
              <p className="text-4xl font-display font-bold capitalize">{summary.farmCondition}</p>
              <p className="text-sm text-emerald-100 mt-2">Based on {summary.totalReadings} total readings</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                <div className="p-2 bg-secondary rounded-lg"><Droplets className="w-5 h-5 text-blue-500"/></div>
                <h3 className="font-semibold">Avg Moisture</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-display font-bold text-foreground">{Math.round(summary.avgSoilMoisture)}</p>
                <span className="text-muted-foreground font-medium">%</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4 text-muted-foreground">
                <div className="p-2 bg-secondary rounded-lg"><Thermometer className="w-5 h-5 text-red-500"/></div>
                <h3 className="font-semibold">Avg Temperature</h3>
              </div>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-display font-bold text-foreground">{Math.round(summary.avgTemperature)}</p>
                <span className="text-muted-foreground font-medium">°C</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Soil Moisture Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Soil Moisture Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {activeQuery.isLoading ? <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div> : 
             chartData.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div> :
             (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMoisture" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="soilMoisture" name="Moisture (%)" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMoisture)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Temperature Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Temperature Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
             {activeQuery.isLoading ? <div className="h-full flex items-center justify-center text-muted-foreground">Loading...</div> : 
             chartData.length === 0 ? <div className="h-full flex items-center justify-center text-muted-foreground">No data available</div> :
             (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="timeLabel" axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* AI Notes */}
        {data?.notes && data.notes.length > 0 && (
          <Card className="col-span-1 lg:col-span-2 bg-emerald-50 border-emerald-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Leaf className="w-5 h-5 text-emerald-600" />
                AI Crop Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.notes.map((note, i) => (
                  <li key={i} className="flex gap-3 text-emerald-800">
                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                    <span className="leading-relaxed">{note}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
