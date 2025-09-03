import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, Users, Calculator, DollarSign, Target, Building, ClipboardList, Clock, CheckCircle, AlertTriangle, Truck, Calendar, PieChart, BarChart3, MapPin, Phone, Mail } from "lucide-react";

type AdminTab = 'sales' | 'project' | 'economy';

type AdminStats = {
  totalSales: number;
  monthlySales: number;
  monthlyGrowth: number;
  activeProjects: number;
  pendingDeals: number;
  materialDeliveries: number;
  conversionRate: number;
  avgDealSize: number;
  teamPerformance: Array<{
    name: string;
    deals: number;
    revenue: number;
    conversion: number;
  }>;
  projectProgress: Array<{
    id: number;
    name: string;
    progress: number;
    status: 'planning' | 'active' | 'delayed' | 'completed';
    deadline: string;
  }>;
  financialData: {
    totalRevenue: number;
    totalCosts: number;
    grossMargin: number;
    netProfit: number;
    outstandingInvoices: number;
    cashFlow: number;
  };
};

export default function AdminDashboardTabs() {
  const [activeTab, setActiveTab] = useState<AdminTab>('sales');

  // Fetch admin statistics
  const { data: adminStats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/dashboard-stats"],
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
        <span className="text-gray-500 text-xs">Senaste månaden</span>
      </div>
    );
  };

  const tabs = [
    { id: 'sales' as AdminTab, label: 'Säljchef', icon: DollarSign },
    { id: 'project' as AdminTab, label: 'Projektledare', icon: Building },
    { id: 'economy' as AdminTab, label: 'Ekonomi', icon: ClipboardList },
  ];

  const renderSalesTab = () => (
    <div className="space-y-6">
      {/* Key Sales Metrics */}
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
              {adminStats ? formatCurrency(adminStats.totalSales) : '2.450.000 kr'}
            </div>
            {renderGrowthIndicator(adminStats?.monthlyGrowth || 12)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Target className="w-4 h-4 mr-2 text-blue-600" />
              KONVERTERINGSGRAD
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats?.conversionRate || 68}%
            </div>
            {renderGrowthIndicator(5)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Calculator className="w-4 h-4 mr-2 text-purple-600" />
              SNITT AFFÄRSSTORLEK
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats ? formatCurrency(adminStats.avgDealSize) : '125.000 kr'}
            </div>
            {renderGrowthIndicator(-2)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Users className="w-4 h-4 mr-2 text-orange-600" />
              AKTIVA AFFÄRER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats?.pendingDeals || 23}
            </div>
            <div className="text-sm text-gray-600">Väntande beslut</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance & Sales Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Säljteam Prestanda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Tobias Lundgren', deals: 28, revenue: 3420000, conversion: 72 },
                { name: 'Magnus Svensson', deals: 22, revenue: 2650000, conversion: 65 },
                { name: 'Sofia Andersson', deals: 19, revenue: 2280000, conversion: 58 },
                { name: 'Erik Karlsson', deals: 15, revenue: 1890000, conversion: 61 }
              ].map((member) => (
                <div key={member.name} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{member.name}</h4>
                    <Badge variant="outline">{member.conversion}% konv.</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Affärer: </span>
                      <span className="font-medium">{member.deals}st</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Omsättning: </span>
                      <span className="font-medium">{formatCurrency(member.revenue)}</span>
                    </div>
                  </div>
                  <Progress value={member.conversion} className="mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Försäljningspipeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">23</div>
                  <div className="text-sm text-orange-700">Nya Demos</div>
                  <div className="text-xs text-orange-600">Denna vecka</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">15</div>
                  <div className="text-sm text-blue-700">Väntande Affärer</div>
                  <div className="text-xs text-blue-600">Redo för uppföljning</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700">Uppföljningar denna vecka:</h4>
                {[
                  { customer: 'Anna Persson', value: 145000, days: 3, status: 'high' },
                  { customer: 'Lars Johansson', value: 95000, days: 7, status: 'medium' },
                  { customer: 'Maria Nilsson', value: 180000, days: 12, status: 'low' }
                ].map((followUp, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <div className="font-medium text-sm">{followUp.customer}</div>
                      <div className="text-xs text-gray-600">{formatCurrency(followUp.value)}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs px-2 py-1 rounded ${
                        followUp.status === 'high' ? 'bg-red-100 text-red-700' :
                        followUp.status === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {followUp.days} dagar
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Sales Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <TrendingUpIcon className="w-5 h-5 mr-2" />
              Veckovis Försäljning
            </span>
            <Button variant="outline" size="sm">
              Exportera Data
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-blue-400 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Försäljningsdiagram</p>
              <p className="text-sm text-gray-500">Veckovis prestanda och trender</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectTab = () => (
    <div className="space-y-6">
      {/* Project Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Building className="w-4 h-4 mr-2 text-blue-600" />
              AKTIVA PROJEKT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {adminStats?.activeProjects || 8}
            </div>
            <div className="text-sm text-gray-600">2 försenade</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              VÄNTANDE PROJEKTERING
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">3</div>
            <div className="text-sm text-orange-600">Behöver åtgärd</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Truck className="w-4 h-4 mr-2 text-purple-600" />
              MATERIALLEVERANSER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">5</div>
            <div className="text-sm text-gray-600">Denna vecka</div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              SLUTFÖRDA PROJEKT
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">16</div>
            <div className="text-sm text-green-600">Denna månad</div>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress & Team Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Pågående Projekt
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'Andersson Tak', progress: 75, status: 'active', deadline: '2025-07-15' },
                { name: 'Karlsson Villa', progress: 45, status: 'active', deadline: '2025-07-20' },
                { name: 'Nilsson Garage', progress: 90, status: 'delayed', deadline: '2025-07-10' },
                { name: 'Persson Hus', progress: 25, status: 'planning', deadline: '2025-07-25' }
              ].map((project, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{project.name}</h4>
                    <Badge variant="outline" className={
                      project.status === 'active' ? 'text-blue-600 border-blue-200' :
                      project.status === 'delayed' ? 'text-red-600 border-red-200' :
                      'text-orange-600 border-orange-200'
                    }>
                      {project.status === 'active' ? 'Aktiv' :
                       project.status === 'delayed' ? 'Försenad' : 'Planering'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Framsteg</span>
                      <span>{project.progress}%</span>
                    </div>
                    <Progress value={project.progress} />
                    <div className="text-xs text-gray-600">
                      Deadline: {new Date(project.deadline).toLocaleDateString('sv-SE')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team & Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Team Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { team: 'Team Alpha', members: ['Erik', 'Magnus'], status: 'available', location: 'Andersson Tak' },
                { team: 'Team Beta', members: ['Sofia', 'Lars'], status: 'busy', location: 'Karlsson Villa' },
                { team: 'Team Gamma', members: ['Johan', 'Peter'], status: 'busy', location: 'Nilsson Garage' },
                { team: 'Team Delta', members: ['Anna', 'Marcus'], status: 'available', location: 'Ledig' }
              ].map((team, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{team.team}</h4>
                    <Badge variant="outline" className={
                      team.status === 'available' ? 'text-green-600 border-green-200' : 'text-red-600 border-red-200'
                    }>
                      {team.status === 'available' ? 'Tillgänglig' : 'Upptagen'}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Medlemmar: {team.members.join(', ')}</div>
                    <div className="flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {team.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Åtgärder Krävs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <div className="font-medium text-red-800">3 affärer redo för projektering</div>
                <div className="text-sm text-red-600">Försenade sedan 5 dagar</div>
              </div>
              <Button size="sm" className="bg-red-600 hover:bg-red-700">
                Hantera
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div>
                <div className="font-medium text-orange-800">2 materialleveranser att skicka</div>
                <div className="text-sm text-orange-600">Deadline imorgon</div>
              </div>
              <Button size="sm" variant="outline">
                Visa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderEconomyTab = () => (
    <div className="space-y-6">
      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
              TOTAL INTÄKTER
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(2450000)}
            </div>
            {renderGrowthIndicator(8)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <TrendingUpIcon className="w-4 h-4 mr-2 text-blue-600" />
              BRUTTOMARGINAL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">42%</div>
            {renderGrowthIndicator(3)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <PieChart className="w-4 h-4 mr-2 text-purple-600" />
              NETTOVINST
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(485000)}
            </div>
            {renderGrowthIndicator(12)}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
              <Clock className="w-4 h-4 mr-2 text-orange-600" />
              UTESTÅENDE FAKTUROR
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(125000)}
            </div>
            <div className="text-sm text-gray-600">8 fakturor</div>
          </CardContent>
        </Card>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Kostnadsfördelning
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { category: 'Material', amount: 890000, percentage: 36, color: 'bg-blue-500' },
                { category: 'Löner', amount: 720000, percentage: 29, color: 'bg-green-500' },
                { category: 'Overhead', amount: 345000, percentage: 14, color: 'bg-yellow-500' },
                { category: 'Transport', amount: 185000, percentage: 8, color: 'bg-purple-500' },
                { category: 'Övrigt', amount: 310000, percentage: 13, color: 'bg-gray-500' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded ${item.color}`}></div>
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(item.amount)}</div>
                    <div className="text-xs text-gray-600">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cash Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Kassaflöde
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatCurrency(1250000)}
                  </div>
                  <div className="text-sm text-green-700">Inbetalningar</div>
                  <div className="text-xs text-green-600">Denna månad</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="text-lg font-bold text-red-600">
                    {formatCurrency(980000)}
                  </div>
                  <div className="text-sm text-red-700">Utbetalningar</div>
                  <div className="text-xs text-red-600">Denna månad</div>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Netto kassaflöde</span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(270000)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Outstanding Invoices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Mail className="w-5 h-5 mr-2" />
              Utestående Fakturor
            </span>
            <Button variant="outline" size="sm">
              Skicka Påminnelser
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { customer: 'Andersson Tak AB', amount: 45000, days: 15, status: 'overdue' },
              { customer: 'Villa Karlsson', amount: 32000, days: 8, status: 'pending' },
              { customer: 'Nilsson Fastigheter', amount: 28000, days: 3, status: 'recent' },
              { customer: 'Persson Bygg', amount: 20000, days: 1, status: 'recent' }
            ].map((invoice, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="font-medium">{invoice.customer}</div>
                  <div className="text-sm text-gray-600">{formatCurrency(invoice.amount)}</div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className={
                    invoice.status === 'overdue' ? 'text-red-600 border-red-200' :
                    invoice.status === 'pending' ? 'text-yellow-600 border-yellow-200' :
                    'text-green-600 border-green-200'
                  }>
                    {invoice.days} dagar
                  </Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {invoice.status === 'overdue' ? 'Försenad' :
                     invoice.status === 'pending' ? 'Väntande' : 'Ny'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className={`mr-2 w-5 h-5 ${isActive ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}`} />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'sales' && renderSalesTab()}
      {activeTab === 'project' && renderProjectTab()}
      {activeTab === 'economy' && renderEconomyTab()}
    </div>
  );
}