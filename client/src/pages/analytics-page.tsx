import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Users,
  MapPin,
  AlertTriangle,
  Wrench,
  Calendar,
  FileText,
  Download
} from "lucide-react";
import Navbar from "@/components/ui/navbar";
import { useAuth } from "@/hooks/use-auth";

type AdvancedAnalytics = {
  rotImpact: {
    totalSavings: number;
    avgSavingsPerDeal: number;
    conversionBoost: number;
  };
  materialEfficiency: {
    totalOrdered: number;
    totalUsed: number;
    efficiencyRate: number;
    wasteReduction: number;
  };
  capacityAnalysis: {
    totalCapacity: number;
    utilisedCapacity: number;
    utilizationRate: number;
    availableCapacity: number;
    recommendedTeams: number;
  };
  riskMetrics: {
    pendingDealsAtRisk: number;
    potentialLostRevenue: number;
    followUpRecommendations: number;
    weatherRiskFactor: number;
  };
};

type AdminStats = {
  totalSales: number;
  monthlySales: number;
  monthlyGrowth: number;
  activeProjects: number;
  pendingDeals: number;
  conversionRate: number;
  avgDealSize: number;
  grossMargin: number;
  teamPerformance: Array<{
    name: string;
    deals: number;
    revenue: number;
    conversion: number;
  }>;
  geographicData: Array<{
    city: string;
    deals: number;
    revenue: number;
    avgDealSize: number;
  }>;
  materialStats: {
    totalRequests: number;
    pending: number;
    approved: number;
    totalValue: number;
  };
  seasonalData: Array<{
    month: number;
    deals: number;
    revenue: number;
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

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch comprehensive analytics data
  const { data: adminStats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/dashboard-stats"],
    enabled: user?.isAdmin
  });

  const { data: advancedAnalytics, isLoading: analyticsLoading } = useQuery<AdvancedAnalytics>({
    queryKey: ["/api/analytics/advanced"],
    enabled: user?.isAdmin
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => `${value}%`;

  const getMonthName = (month: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  const renderGrowthIndicator = (growth: number) => {
    const isPositive = growth > 0;
    const Icon = isPositive ? TrendingUp : TrendingDown;
    const colorClass = isPositive ? "text-green-600" : "text-red-600";
    
    return (
      <div className={`flex items-center text-sm ${colorClass}`}>
        <Icon className="w-4 h-4 mr-1" />
        {Math.abs(growth)}%
      </div>
    );
  };

  if (!user?.isAdmin) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Åtkomst nekad</h1>
            <p className="text-gray-600">Du behöver administratörsbehörighet för att komma åt denna sida.</p>
          </div>
        </div>
      </>
    );
  }

  if (statsLoading || analyticsLoading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-lg">Laddar analyser...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold">Prestandaanalys & Business Intelligence</h1>
          </div>
          <div className="flex gap-3">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Exportera rapport
            </Button>
            <Button>
              <FileText className="w-4 h-4 mr-2" />
              Skapa rapport
            </Button>
          </div>
        </div>

        {/* Key Performance Indicators */}
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
                {adminStats ? formatCurrency(adminStats.totalSales) : '-'}
              </div>
              {adminStats && renderGrowthIndicator(adminStats.monthlyGrowth)}
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
                {adminStats ? `${adminStats.conversionRate}%` : '-'}
              </div>
              <div className="text-sm text-gray-600">av alla kalkyler</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-purple-600" />
                GENOMSNITTLIG AFFÄR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {adminStats ? formatCurrency(adminStats.avgDealSize) : '-'}
              </div>
              <div className="text-sm text-gray-600">per slutförd affär</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-orange-600" />
                BRUTTOMARGINAL
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {adminStats ? `${adminStats.grossMargin}%` : '-'}
              </div>
              <div className="text-sm text-gray-600">efter material & arbete</div>
            </CardContent>
          </Card>
        </div>

        {/* Advanced Analytics Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Översikt</TabsTrigger>
            <TabsTrigger value="team">Team & Prestanda</TabsTrigger>
            <TabsTrigger value="geographic">Geografisk analys</TabsTrigger>
            <TabsTrigger value="efficiency">Effektivitet</TabsTrigger>
            <TabsTrigger value="risks">Riskanalys</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Financial Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Finansiell översikt
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {adminStats ? formatCurrency(adminStats.financialData.totalRevenue) : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Total intäkt</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {adminStats ? formatCurrency(adminStats.financialData.totalCosts) : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Totala kostnader</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {adminStats ? formatCurrency(adminStats.financialData.netProfit) : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Nettovinst</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ROT Deduction Impact */}
            {advancedAnalytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Target className="w-5 h-5 mr-2" />
                    ROT-avdrag påverkan
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(advancedAnalytics.rotImpact.totalSavings)}
                      </div>
                      <div className="text-sm text-gray-600">Total kundbesparing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(advancedAnalytics.rotImpact.avgSavingsPerDeal)}
                      </div>
                      <div className="text-sm text-gray-600">Genomsnitt per affär</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        +{advancedAnalytics.rotImpact.conversionBoost}%
                      </div>
                      <div className="text-sm text-gray-600">Konverteringsökning</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Seasonal Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Säsongstrender
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {adminStats?.seasonalData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium">{getMonthName(data.month)}</div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-600">{data.deals} affärer</div>
                        <div className="font-medium">{formatCurrency(data.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Teamprestanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Säljare</TableHead>
                      <TableHead className="text-right">Affärer</TableHead>
                      <TableHead className="text-right">Intäkter</TableHead>
                      <TableHead className="text-right">Konvertering</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats?.teamPerformance.map((member, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell className="text-right">{member.deals}</TableCell>
                        <TableCell className="text-right">{formatCurrency(member.revenue)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant={member.conversion >= 60 ? "default" : "secondary"}>
                            {member.conversion}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Capacity Analysis */}
            {advancedAnalytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="w-5 h-5 mr-2" />
                    Kapacitetsanalys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-lg font-semibold mb-2">Nuvarande månadskapacitet</div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Total kapacitet:</span>
                          <span className="font-medium">{advancedAnalytics.capacityAnalysis.totalCapacity}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Använd kapacitet:</span>
                          <span className="font-medium">{advancedAnalytics.capacityAnalysis.utilisedCapacity}h</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tillgänglig kapacitet:</span>
                          <span className="font-medium">{advancedAnalytics.capacityAnalysis.availableCapacity}h</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-2">Utnyttjandegrad</div>
                      <div className="text-3xl font-bold text-blue-600 mb-2">
                        {advancedAnalytics.capacityAnalysis.utilizationRate}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Rekommenderat antal team: {advancedAnalytics.capacityAnalysis.recommendedTeams}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="geographic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Geografisk prestanda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stad</TableHead>
                      <TableHead className="text-right">Affärer</TableHead>
                      <TableHead className="text-right">Intäkter</TableHead>
                      <TableHead className="text-right">Snitt per affär</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminStats?.geographicData.slice(0, 10).map((location, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{location.city}</TableCell>
                        <TableCell className="text-right">{location.deals}</TableCell>
                        <TableCell className="text-right">{formatCurrency(location.revenue)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(location.avgDealSize)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="efficiency" className="space-y-6">
            {/* Material Efficiency */}
            {advancedAnalytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Wrench className="w-5 h-5 mr-2" />
                    Materialeffektivitet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-lg font-semibold mb-4">Materialanvändning</div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Totalt beställt:</span>
                          <span className="font-medium">{formatCurrency(advancedAnalytics.materialEfficiency.totalOrdered)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Totalt använt:</span>
                          <span className="font-medium">{formatCurrency(advancedAnalytics.materialEfficiency.totalUsed)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spill/Överskott:</span>
                          <span className="font-medium text-orange-600">{formatCurrency(advancedAnalytics.materialEfficiency.wasteReduction)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold mb-2">Effektivitetsgrad</div>
                      <div className="text-4xl font-bold text-green-600 mb-2">
                        {advancedAnalytics.materialEfficiency.efficiencyRate}%
                      </div>
                      <div className="text-sm text-gray-600">av beställt material används</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Material Requests Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="w-5 h-5 mr-2" />
                  Materialbeställningar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {adminStats?.materialStats.pending || 0}
                    </div>
                    <div className="text-sm text-gray-600">Väntande</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {adminStats?.materialStats.approved || 0}
                    </div>
                    <div className="text-sm text-gray-600">Godkända</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {adminStats?.materialStats.totalRequests || 0}
                    </div>
                    <div className="text-sm text-gray-600">Totalt</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {adminStats ? formatCurrency(adminStats.materialStats.totalValue) : '-'}
                    </div>
                    <div className="text-sm text-gray-600">Totalt värde</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-6">
            {/* Risk Metrics */}
            {advancedAnalytics && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                    Riskanalys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-red-600 mb-2">
                          Affärer i riskzonen
                        </div>
                        <div className="text-3xl font-bold">{advancedAnalytics.riskMetrics.pendingDealsAtRisk}</div>
                        <div className="text-sm text-gray-600">väntande över 2 veckor</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-orange-600 mb-2">
                          Potentiell förlorad intäkt
                        </div>
                        <div className="text-3xl font-bold">{formatCurrency(advancedAnalytics.riskMetrics.potentialLostRevenue)}</div>
                        <div className="text-sm text-gray-600">om affärer förloras</div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-blue-600 mb-2">
                          Uppföljningsrekommendationer
                        </div>
                        <div className="text-3xl font-bold">{advancedAnalytics.riskMetrics.followUpRecommendations}</div>
                        <div className="text-sm text-gray-600">kunder att kontakta</div>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="text-lg font-semibold text-purple-600 mb-2">
                          Väderrisk
                        </div>
                        <div className="text-3xl font-bold">{advancedAnalytics.riskMetrics.weatherRiskFactor}%</div>
                        <div className="text-sm text-gray-600">säsongsberoende risk</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="w-5 h-5 mr-2" />
                  Rekommenderade åtgärder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {advancedAnalytics && advancedAnalytics.riskMetrics.pendingDealsAtRisk > 0 && (
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div>
                        <div className="font-medium text-red-800">Kontakta väntande kunder</div>
                        <div className="text-sm text-red-600">
                          {advancedAnalytics.riskMetrics.pendingDealsAtRisk} affärer behöver uppföljning
                        </div>
                      </div>
                      <Badge variant="destructive">Hög prioritet</Badge>
                    </div>
                  )}
                  {advancedAnalytics && advancedAnalytics.capacityAnalysis.utilizationRate > 85 && (
                    <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div>
                        <div className="font-medium text-orange-800">Öka teamkapacitet</div>
                        <div className="text-sm text-orange-600">
                          Utnyttjandegrad över 85% - överväg att anställa fler team
                        </div>
                      </div>
                      <Badge variant="secondary">Medium prioritet</Badge>
                    </div>
                  )}
                  {advancedAnalytics && advancedAnalytics.materialEfficiency.efficiencyRate < 90 && (
                    <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div>
                        <div className="font-medium text-yellow-800">Optimera materialbeställningar</div>
                        <div className="text-sm text-yellow-600">
                          Materialeffektivitet under 90% - granska beställningsprocesser
                        </div>
                      </div>
                      <Badge variant="outline">Låg prioritet</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}