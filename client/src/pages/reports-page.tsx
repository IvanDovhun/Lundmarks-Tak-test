import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Download, 
  Users, 
  DollarSign, 
  Calendar,
  FileText,
  ArrowUpIcon,
  ArrowDownIcon,
  Building,
  Target
} from 'lucide-react';
import Navbar from '@/components/ui/navbar';

interface ReportData {
  totalRevenue: number;
  monthlyRevenue: number;
  revenueGrowth: number;
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  avgProjectValue: number;
  conversionRate: number;
  topSalesperson: string;
  topSalespersonRevenue: number;
  monthlyData: Array<{ month: string; revenue: number; projects: number }>;
  salesPersonData: Array<{ name: string; revenue: number; projects: number; conversion: number }>;
}

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [selectedReport, setSelectedReport] = useState('overview');

  // Fetch report data
  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ['/api/reports/overview', selectedPeriod],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderGrowthIndicator = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
        <span>{Math.abs(growth)}%</span>
      </div>
    );
  };

  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              TOTAL OMSÄTTNING
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reportData ? formatCurrency(reportData.totalRevenue) : '2.450.000 kr'}
            </div>
            {renderGrowthIndicator(12)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              AKTIVA PROJEKT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reportData ? reportData.activeProjects : 8}
            </div>
            <div className="text-sm text-gray-600">
              av {reportData ? reportData.totalProjects : 24} totalt
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="w-4 h-4 mr-2 text-purple-600" />
              KONVERTERING
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reportData ? `${reportData.conversionRate}%` : '65%'}
            </div>
            {renderGrowthIndicator(5)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
              SNITT PROJEKTVÄRDE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {reportData ? formatCurrency(reportData.avgProjectValue) : '125.000 kr'}
            </div>
            {renderGrowthIndicator(-3)}
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Månatlig omsättning</span>
              <Badge variant="outline">{selectedPeriod === 'monthly' ? 'Månadsvis' : 'Kvartalsvis'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                <p>Omsättningsdiagram</p>
                <p className="text-sm">Visar trend över tid</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projektstatistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                <p>Projektdiagram</p>
                <p className="text-sm">Pågående vs Avslutade</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderSalesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Säljprestation</h2>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportera rapport
        </Button>
      </div>

      {/* Top Performer */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-800">
            <Users className="w-5 h-5 mr-2" />
            Månadens säljare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-green-900">
                {reportData ? reportData.topSalesperson : 'Anna Andersson'}
              </h3>
              <p className="text-green-700">
                {reportData ? formatCurrency(reportData.topSalespersonRevenue) : '485.000 kr'} i omsättning
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800">
              #1 Säljare
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sales Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Säljteam prestation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Anna Andersson', revenue: 485000, projects: 8, conversion: 72 },
              { name: 'Lars Pettersson', revenue: 423000, projects: 6, conversion: 68 },
              { name: 'Maria Johansson', revenue: 387000, projects: 7, conversion: 65 },
              { name: 'Erik Svensson', revenue: 312000, projects: 5, conversion: 58 },
            ].map((person, index) => (
              <div key={person.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">{index + 1}</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">{person.name}</h4>
                    <p className="text-sm text-gray-600">{person.projects} projekt</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatCurrency(person.revenue)}</p>
                  <p className="text-sm text-gray-600">{person.conversion}% konvertering</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Projektanalys</h2>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exportera data
        </Button>
      </div>

      {/* Project Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">
              PÅGÅENDE PROJEKT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">8</div>
            <div className="text-sm text-blue-700">+2 sedan förra månaden</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">
              AVSLUTADE PROJEKT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">16</div>
            <div className="text-sm text-green-700">+5 sedan förra månaden</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600">
              PLANERADE PROJEKT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">12</div>
            <div className="text-sm text-orange-700">Nästa 30 dagar</div>
          </CardContent>
        </Card>
      </div>

      {/* Project Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Projekttidslinje</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2" />
              <p>Tidslinjediagram</p>
              <p className="text-sm">Projekt per månad</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Rapporter & Analys</h1>
          </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Månadsvis</SelectItem>
              <SelectItem value="quarterly">Kvartalsvis</SelectItem>
              <SelectItem value="yearly">Årsvis</SelectItem>
            </SelectContent>
          </Select>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            Generera rapport
          </Button>
        </div>
      </div>

      <Tabs value={selectedReport} onValueChange={setSelectedReport}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="sales">Säljstatistik</TabsTrigger>
          <TabsTrigger value="projects">Projektanalys</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {renderOverviewTab()}
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {renderSalesTab()}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6">
          {renderProjectsTab()}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}