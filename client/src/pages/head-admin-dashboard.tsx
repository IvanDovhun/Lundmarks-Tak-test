import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/navbar";
import RoleImpersonationBar from "@/components/ui/role-impersonation-bar";
import { 
  Settings, 
  Users, 
  BarChart3, 
  Calculator, 
  Calendar, 
  Monitor, 
  Package, 
  FileText,
  Activity,
  TrendingUp,
  Database,
  Shield
} from "lucide-react";

const HeadAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  // Fetch system overview data
  const { data: allUsers } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  const { data: allProjects } = useQuery({
    queryKey: ["/api/projects"],
  });

  const { data: allDeals } = useQuery({
    queryKey: ["/api/demos"],
  });

  const { data: calculations } = useQuery({
    queryKey: ["/api/calculations"],
  });

  // Calculate system overview metrics
  const totalUsers = allUsers?.length || 0;
  const activeProjects = allProjects?.filter(p => p.status === 'ongoing')?.length || 0;
  const totalDeals = allDeals?.length || 0;
  const totalCalculations = calculations?.length || 0;
  const successfulDeals = allDeals?.filter(d => d.dealStatus === 'deal')?.length || 0;
  const conversionRate = totalDeals > 0 ? Math.round((successfulDeals / totalDeals) * 100) : 0;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <RoleImpersonationBar />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Teknikchef Dashboard</h1>
            <p className="text-gray-600 mt-2">Fullständig systemöversikt och administrativ kontroll</p>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {user?.name || user?.username} - Head Admin
          </Badge>
        </div>

        {/* System Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala Användare</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
              <p className="text-xs text-muted-foreground">Registrerade i systemet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktiva Projekt</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeProjects}</div>
              <p className="text-xs text-muted-foreground">Pågående projekt</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totala Kalkyler</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCalculations}</div>
              <p className="text-xs text-muted-foreground">Genomförda beräkningar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{conversionRate}%</div>
              <p className="text-xs text-muted-foreground">{successfulDeals}/{totalDeals} affärer</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-6">Systemhantering</h2>
      
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* System Administration */}
          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Shield className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Systemadministration</h3>
                  <p className="text-red-100">Hantera roller och behörigheter</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Management */}
          <Link href="/employees">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Users className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Användarhantering</h3>
                    <p className="text-blue-100">Hantera alla användare och roller</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Price Management */}
          <Link href="/admin">
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Settings className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Prishantering</h3>
                    <p className="text-green-100">Konfigurera priser och inställningar</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Database Management */}
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Database className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Databashantering</h3>
                  <p className="text-purple-100">Backup och datahantering</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Reports */}
          <Link href="/reports">
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <BarChart3 className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Analytics & Rapporter</h3>
                    <p className="text-orange-100">Detaljerade systemrapporter</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Material Management */}
          <Link href="/material-management">
            <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Package className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">Materialhantering</h3>
                    <p className="text-yellow-100">Hantera material och leverantörer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        <h2 className="text-2xl font-bold mb-6 mt-12">Dagliga Verktyg</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Calculator */}
          <Link href="/calculator">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Kalkyl
                </CardTitle>
                <CardDescription>Skapa prisberäkningar</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Öppna Kalkyl</Button>
              </CardContent>
            </Card>
          </Link>

          {/* Project Planning */}
          <Link href="/planning-gantt">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Projektplanering
                </CardTitle>
                <CardDescription>Gantt-schema och projektöversikt</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Visa Planering</Button>
              </CardContent>
            </Card>
          </Link>

          {/* CRM & Deals */}
          <Link href="/deals">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  CRM & Affärer
                </CardTitle>
                <CardDescription>Hantera kunder och affärer</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Visa CRM</Button>
              </CardContent>
            </Card>
          </Link>

          {/* TV Display */}
          <Link href="/tv-display">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  TV-Display
                </CardTitle>
                <CardDescription>Kontorsdisplay för projekt</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">Öppna TV-Display</Button>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HeadAdminDashboard;