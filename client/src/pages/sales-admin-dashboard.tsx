import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { BarChart3, Calculator, Users, Target, TrendingUp, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/ui/navbar";
import RoleImpersonationBar from "@/components/ui/role-impersonation-bar";

const SalesAdminDashboard: React.FC = () => {
  const { data: demos = [] } = useQuery({
    queryKey: ["/api/demos"],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["/api/admin/users"],
  });

  // Calculate sales statistics
  const salesPersons = users.filter(user => user.role === 'sales_person');
  const totalDeals = demos.length;
  const wonDeals = demos.filter(demo => demo.status === 'Redo för Projektering').length;
  const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0;

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6">
        <RoleImpersonationBar />
        <h1 className="text-3xl font-bold mb-6">Säljchef Dashboard</h1>
      <p className="text-gray-600 mb-8">Säljfokuserad översikt med team-statistik och individuell säljprestanda</p>
      
      {/* Sales Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Affärer</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDeals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vunna Affärer</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{wonDeals}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konverteringsgrad</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Säljare</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesPersons.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Sales Team Performance */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Säljteam Prestanda</CardTitle>
          <CardDescription>Individuell prestanda per säljare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {salesPersons.map((salesperson) => {
              const personalDeals = demos.filter(demo => demo.sellerId === salesperson.id);
              const personalWons = personalDeals.filter(demo => demo.status === 'Redo för Projektering').length;
              const personalRate = personalDeals.length > 0 ? Math.round((personalWons / personalDeals.length) * 100) : 0;
              
              return (
                <div key={salesperson.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-semibold">{salesperson.name || salesperson.username}</h3>
                    <p className="text-sm text-gray-600">{personalDeals.length} totala demos</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{personalWons} vunna</div>
                    <div className="text-sm text-gray-600">{personalRate}% konvertering</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Analytics & Reports */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Säljrapporter
            </CardTitle>
            <CardDescription>Detaljerade säljanalyser</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/reports">
              <Button className="w-full">Visa Rapporter</Button>
            </Link>
          </CardContent>
        </Card>

        {/* Calculator */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Kalkyl
            </CardTitle>
            <CardDescription>Skapa prisberäkningar</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/calculator">
              <Button className="w-full">Öppna Kalkyl</Button>
            </Link>
          </CardContent>
        </Card>

        {/* User Management */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Säljteam
            </CardTitle>
            <CardDescription>Hantera säljteamet</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/employees">
              <Button className="w-full">Hantera Team</Button>
            </Link>
          </CardContent>
        </Card>

        {/* CRM & Deals */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CRM & Affärer
            </CardTitle>
            <CardDescription>Hantera alla affärer</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/deals">
              <Button className="w-full">Visa CRM</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};

export default SalesAdminDashboard;