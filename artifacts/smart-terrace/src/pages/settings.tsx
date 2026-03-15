import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGetFarm, useGetDevices } from "@workspace/api-client-react";
import { User, Mail, Map, Cpu, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function Settings() {
  const { user, logout } = useAuth();
  const { data: farm } = useGetFarm({ query: { retry: false } });
  const { data: devices } = useGetDevices();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Profile */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Account Profile</CardTitle>
            <CardDescription>Your personal information.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-2xl border border-border/50">
              <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-display font-bold shadow-md">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <h3 className="text-xl font-bold">{user?.name}</h3>
                <p className="text-muted-foreground flex items-center gap-1 mt-1">
                  <Mail className="w-4 h-4" /> {user?.email}
                </p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button variant="destructive" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" /> Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Map className="w-5 h-5 text-primary" /> Farm Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {farm ? (
                <div>
                  <p className="font-semibold text-foreground">{farm.farmName}</p>
                  <p className="text-sm text-muted-foreground">{farm.location}</p>
                  <Link href="/farm">
                    <Button variant="outline" size="sm" className="w-full mt-4">Edit Profile</Button>
                  </Link>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-amber-600 mb-4">Farm profile not set up yet.</p>
                  <Link href="/farm">
                    <Button size="sm" className="w-full">Setup Now</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Cpu className="w-5 h-5 text-primary" /> Hardware
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-display font-bold">{devices?.length || 0}</p>
                  <p className="text-sm text-muted-foreground">Devices Registered</p>
                </div>
              </div>
              <Link href="/devices">
                <Button variant="outline" size="sm" className="w-full mt-4">Manage</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
