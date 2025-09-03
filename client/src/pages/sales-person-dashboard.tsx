import React from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator, FileText, TrendingUp, User, MapPin } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/ui/navbar";
import RoleImpersonationBar from "@/components/ui/role-impersonation-bar";

const SalesPersonDashboard: React.FC = () => {
  const { user } = useAuth();

  // Fetch user's own demonstrations and calculations
  const { data: userDemos } = useQuery({
    queryKey: ['/api/demos/my-demos'],
  });

  const { data: userCalculations } = useQuery({
    queryKey: ['/api/calculations/my-calculations'],
  });

  const totalCalculations = userCalculations?.length || 0;
  const totalDemos = userDemos?.length || 0;
  const successfulDeals = userDemos?.filter((demo: any) => demo.dealStatus === 'deal')?.length || 0;
  const conversionRate = totalDemos > 0 ? Math.round((successfulDeals / totalDemos) * 100) : 0;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <RoleImpersonationBar />
        <div className="flex items-center gap-4 mb-8">
          <h1 className="text-3xl font-bold">Säljare Dashboard</h1>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {user?.name || user?.username}
        </Badge>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mina Kalkyler</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalculations}</div>
            <p className="text-xs text-muted-foreground">Totalt antal kalkyler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Demonstrationer</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDemos}</div>
            <p className="text-xs text-muted-foreground">Genomförda demonstrationer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lyckade Affärer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successfulDeals}</div>
            <p className="text-xs text-muted-foreground">Slutna affärer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground">Demo till affär</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/calculator">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Calculator className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Kalkylator</h3>
                  <p className="text-blue-100">Skapa nya takberäkningar</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/demos">
          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <FileText className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Demonstrationer</h3>
                  <p className="text-green-100">Hantera kundbesök</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/deals">
          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <TrendingUp className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Mina Affärer</h3>
                  <p className="text-purple-100">Se dina affärer och status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/profile">
          <Card className="bg-gradient-to-r from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700 transition-all duration-200 cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Min Profil</h3>
                  <p className="text-gray-100">Redigera kontoinformation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Senaste Aktivitet</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Calculations */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste Kalkyler</CardTitle>
            </CardHeader>
            <CardContent>
              {userCalculations?.slice(0, 5).map((calc: any) => (
                <div key={calc.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">Kalkyl #{calc.id}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(calc.createdAt).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {calc.totalCost?.toLocaleString('sv-SE')} kr
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 italic">Inga kalkyler än</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Demos */}
          <Card>
            <CardHeader>
              <CardTitle>Senaste Demonstrationer</CardTitle>
            </CardHeader>
            <CardContent>
              {userDemos?.slice(0, 5).map((demo: any) => (
                <div key={demo.id} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div>
                    <p className="font-medium">{demo.customerName}</p>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {demo.adress}
                    </p>
                  </div>
                  <Badge 
                    variant={demo.dealStatus === 'deal' ? 'default' : 'secondary'}
                  >
                    {demo.dealStatus === 'deal' ? 'Affär' : 'Inget avslut'}
                  </Badge>
                </div>
              )) || (
                <p className="text-gray-500 italic">Inga demonstrationer än</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
};

export default SalesPersonDashboard;