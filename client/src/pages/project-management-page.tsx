import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, Package, FileText, Settings, ArrowLeft, Save, Plus, Edit, Trash2, CheckCircle, Clock, AlertCircle, Truck, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/ui/navbar";

interface ProjectData {
  id: number;
  calculationId: number;
  kundnummer: string;
  kundFirstName: string;
  kundLastName: string;
  address: string;
  tel1: string;
  startDatum: string;
  slutDatum: string;
  typAvTak: string;
  valAvTakmaterial: string;
  totalYta: number;
  status: string;
  teamName?: string;
  teamColor?: string;
  notes?: string;
  
  // Excel workflow tracking fields
  projektCode?: string;
  stallningStatus?: string;
  stallningCompletedDate?: string;
  borttagningStatus?: string;
  borttagningCompletedDate?: string;
  materialStatus?: string;
  materialCompletedDate?: string;
  platskassa?: number;
  materialLeverans1Date?: string;
  materialLeverans2Date?: string;
  slutbesiktningDate?: string;
  faktura1Status?: string;
  faktura1Date?: string;
  overallStatus?: string;
}

interface TeamMember {
  id: number;
  name: string;
  role: string;
  phone: string;
}

interface Material {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  ordered: boolean;
  deliveryDate?: string;
}

export default function ProjectManagementPage() {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get project ID from URL params using wouter's useSearch
  const searchParams = useSearch();
  const projectId = new URLSearchParams(searchParams).get('id');
  
  const [activeTab, setActiveTab] = useState("workflow");
  const [notes, setNotes] = useState("");
  const [newTeamMember, setNewTeamMember] = useState({ name: "", role: "", phone: "" });
  const [newMaterial, setNewMaterial] = useState({ name: "", quantity: 0, unit: "", cost: 0 });

  // Update project status mutations
  const updateStatusMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Status uppdaterad" });
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering", variant: "destructive" });
    }
  });

  const updatePhaseMutation = useMutation({
    mutationFn: async ({ phase, status, completedDate }: { phase: string; status: string; completedDate?: string }) => {
      return apiRequest(`/api/projects/${projectId}/phase/${phase}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, completedDate }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
      toast({ title: "Fas uppdaterad" });
    },
    onError: () => {
      toast({ title: "Fel vid uppdatering", variant: "destructive" });
    }
  });

  // Fetch project data or all projects if no ID provided
  const { data: project, isLoading, error } = useQuery({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
  });

  // Fetch all projects when no specific project ID is provided
  const { data: allProjects, isLoading: isLoadingAllProjects } = useQuery({
    queryKey: ['/api/montage/projects'],
    enabled: !projectId,
  });

  // Mock data for team and materials (these would come from API in real implementation)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    { id: 1, name: "Erik Lundmark", role: "Projektledare", phone: "070-123-4567" },
    { id: 2, name: "Magnus Andersson", role: "Snickare", phone: "070-234-5678" },
  ]);

  const [materials, setMaterials] = useState<Material[]>([
    { id: 1, name: "Betongpannor", quantity: 200, unit: "st", cost: 15000, ordered: true, deliveryDate: "2025-07-15" },
    { id: 2, name: "Underlagsduk", quantity: 180, unit: "m²", cost: 3600, ordered: false },
    { id: 3, name: "Takstege", quantity: 1, unit: "st", cost: 2500, ordered: false },
  ]);

  // Update project notes
  const updateNotesMutation = useMutation({
    mutationFn: async (data: { notes: string }) => {
      return apiRequest('/api/projects/notes', {
        method: 'PATCH',
        body: JSON.stringify({ projectId, notes: data.notes }),
      });
    },
    onSuccess: () => {
      toast({ title: "Anteckningar sparade" });
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
    },
  });

  // Add team member
  const addTeamMember = () => {
    if (newTeamMember.name && newTeamMember.role) {
      const id = Math.max(...teamMembers.map(m => m.id), 0) + 1;
      setTeamMembers([...teamMembers, { ...newTeamMember, id }]);
      setNewTeamMember({ name: "", role: "", phone: "" });
      toast({ title: "Teammedlem tillagd" });
    }
  };

  // Add material
  const addMaterial = () => {
    if (newMaterial.name && newMaterial.quantity > 0) {
      const id = Math.max(...materials.map(m => m.id), 0) + 1;
      setMaterials([...materials, { ...newMaterial, id, ordered: false }]);
      setNewMaterial({ name: "", quantity: 0, unit: "", cost: 0 });
      toast({ title: "Material tillagt" });
    }
  };

  // Toggle material order status
  const toggleMaterialOrder = (materialId: number) => {
    setMaterials(materials.map(m => 
      m.id === materialId ? { ...m, ordered: !m.ordered } : m
    ));
  };

  if (isLoading || isLoadingAllProjects) {
    return <div className="flex items-center justify-center h-screen">Laddar projekt...</div>;
  }

  // Show project list when no specific project ID is provided
  if (!projectId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Projekthantering</h1>
            <p className="text-gray-600">Alla reviderade kalkyler och projekt</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allProjects && allProjects.length > 0 ? (
              allProjects.map((project: any) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Projekt #{project.id}</span>
                      <Badge variant={project.status === 'pågående' ? 'default' : 'secondary'}>
                        {project.status || 'Pågående'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {project.kundFirstName} {project.kundLastName}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adress:</span>
                        <span className="truncate ml-2">{project.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taktyp:</span>
                        <span>{project.typAvTak}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Material:</span>
                        <span>{project.valAvTakmaterial}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yta:</span>
                        <span>{project.totalYta} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Startdatum:</span>
                        <span>{new Date(project.startDatum).toLocaleDateString('sv-SE')}</span>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                      <Button 
                        className="w-full" 
                        size="sm"
                        onClick={() => navigate(`/project-management?id=${project.id}`)}
                      >
                        Hantera projekt
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Inga projekt än</h3>
                  <p className="text-gray-600">Skapa ditt första projekt genom att revidera en kalkyl från CRM.</p>
                  <Button className="mt-4" onClick={() => navigate('/deals')}>
                    Gå till Affärer
                  </Button>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Projekt hittades inte</h1>
          <p className="text-gray-600 mb-4">Projektet med ID {projectId} kunde inte hittas.</p>
          <Button onClick={() => navigate('/crm')}>Gå till CRM</Button>
        </div>
      </div>
    );
  }

  const totalMaterialCost = materials.reduce((sum, material) => sum + material.cost, 0);
  const orderedMaterials = materials.filter(m => m.ordered).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/deals')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Tillbaka till CRM
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Projekt #{project.id}
                </h1>
                <p className="text-gray-600">
                  {project.kundFirstName} {project.kundLastName} - {project.address}
                </p>
              </div>
            </div>
            <Badge variant={project.status === 'pågående' ? 'default' : 'secondary'}>
              {project.status || 'Pågående'}
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="workflow" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Workflow
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Översikt
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Material
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Inställningar
            </TabsTrigger>
          </TabsList>

          {/* Workflow Tab - Excel style project tracking */}
          <TabsContent value="workflow" className="space-y-6">
            {/* Enhanced Workflow Progress Overview */}
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Projektframsteg
                </CardTitle>
                <CardDescription>Visuell översikt av projektets huvudfaser</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Progress Bar */}
                  <div className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Slutförande</span>
                      <span className="text-sm text-gray-600">
                        {(() => {
                          const phases = [
                            project.stallningStatus === 'grädad',
                            project.borttagningStatus === 'grädad', 
                            project.materialStatus === 'grädad',
                            project.faktura1Status === 'completed'
                          ];
                          const completed = phases.filter(Boolean).length;
                          return `${Math.round((completed / 4) * 100)}%`;
                        })()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(() => {
                            const phases = [
                              project.stallningStatus === 'grädad',
                              project.borttagningStatus === 'grädad', 
                              project.materialStatus === 'grädad',
                              project.faktura1Status === 'completed'
                            ];
                            return (phases.filter(Boolean).length / 4) * 100;
                          })()}%`
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Enhanced Phase Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      project.stallningStatus === 'grädad' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Settings className="h-5 w-5 text-gray-600" />
                        {project.stallningStatus === 'grädad' ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <Clock className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                      <div className="text-sm font-medium">Ställning</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.stallningCompletedDate ? 
                          new Date(project.stallningCompletedDate).toLocaleDateString('sv-SE') : 
                          'Inte startad'
                        }
                      </div>
                    </div>

                    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      project.borttagningStatus === 'grädad' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Trash2 className="h-5 w-5 text-gray-600" />
                        {project.borttagningStatus === 'grädad' ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <Clock className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                      <div className="text-sm font-medium">Borttagning</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.borttagningCompletedDate ? 
                          new Date(project.borttagningCompletedDate).toLocaleDateString('sv-SE') : 
                          'Inte startad'
                        }
                      </div>
                    </div>

                    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      project.materialStatus === 'grädad' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Package className="h-5 w-5 text-gray-600" />
                        {project.materialStatus === 'grädad' ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <Clock className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                      <div className="text-sm font-medium">Material</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.materialCompletedDate ? 
                          new Date(project.materialCompletedDate).toLocaleDateString('sv-SE') : 
                          'Inte startad'
                        }
                      </div>
                    </div>

                    <div className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                      project.faktura1Status === 'completed' 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-white hover:border-blue-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <Receipt className="h-5 w-5 text-gray-600" />
                        {project.faktura1Status === 'completed' ? 
                          <CheckCircle className="h-5 w-5 text-green-500" /> : 
                          <Clock className="h-5 w-5 text-gray-400" />
                        }
                      </div>
                      <div className="text-sm font-medium">Faktura</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {project.faktura1Date ? 
                          new Date(project.faktura1Date).toLocaleDateString('sv-SE') : 
                          'Inte startad'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Projektworkflow</CardTitle>
                <CardDescription>Hantera projektets status enligt Excel-struktur</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Project Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="border-blue-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Projektkod</div>
                          <Input
                            value={project.projektCode || ''}
                            onChange={(e) => updateStatusMutation.mutate({ projektCode: e.target.value })}
                            placeholder="P101, P103, etc."
                            className="mt-1 h-8"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-green-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-full">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Status</div>
                          <Select 
                            value={project.overallStatus || 'active'}
                            onValueChange={(value) => updateStatusMutation.mutate({ overallStatus: value })}
                          >
                            <SelectTrigger className="mt-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">🟢 Aktiv</SelectItem>
                              <SelectItem value="completed">✅ Avslutad</SelectItem>
                              <SelectItem value="on_hold">⏸️ På vent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-full">
                          <Receipt className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium">Platskassa</div>
                          <div className="text-lg font-bold text-orange-600">
                            {project.platskassa ? `${project.platskassa.toLocaleString('sv-SE')} kr` : '0 kr'}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Workflow phases */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-6">
                    <h3 className="text-lg font-semibold">Projektfaser</h3>
                    <div className="h-px bg-gray-200 flex-1"></div>
                  </div>
                  
                  {/* Scaffolding Phase */}
                  <Card className={`transition-all duration-200 ${
                    project.stallningStatus === 'grädad' 
                      ? 'border-green-300 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            project.stallningStatus === 'grädad' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Settings className={`h-5 w-5 ${
                              project.stallningStatus === 'grädad' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <h4 className="font-semibold text-lg">1. Ställning</h4>
                        </div>
                        <Badge variant={project.stallningStatus === 'grädad' ? 'default' : 'secondary'} className="text-sm">
                          {project.stallningStatus === 'grädad' ? '✅ Grädad' : '⏳ Pending'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Arbetsstatus</Label>
                          <Select 
                            value={project.stallningStatus || 'pending'}
                            onValueChange={(value) => updatePhaseMutation.mutate({ 
                              phase: 'stallning', 
                              status: value,
                              completedDate: value === 'grädad' ? new Date().toISOString() : undefined
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="grädad">✅ Grädad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Slutförandedatum</Label>
                          <Input
                            type="date"
                            value={project.stallningCompletedDate || ''}
                            onChange={(e) => updatePhaseMutation.mutate({ 
                              phase: 'stallning', 
                              status: project.stallningStatus || 'pending',
                              completedDate: e.target.value 
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Removal Phase */}
                  <Card className={`transition-all duration-200 ${
                    project.borttagningStatus === 'grädad' 
                      ? 'border-green-300 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            project.borttagningStatus === 'grädad' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Trash2 className={`h-5 w-5 ${
                              project.borttagningStatus === 'grädad' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <h4 className="font-semibold text-lg">2. Borttagning</h4>
                        </div>
                        <Badge variant={project.borttagningStatus === 'grädad' ? 'default' : 'secondary'} className="text-sm">
                          {project.borttagningStatus === 'grädad' ? '✅ Grädad' : '⏳ Pending'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Arbetsstatus</Label>
                          <Select 
                            value={project.borttagningStatus || 'pending'}
                            onValueChange={(value) => updatePhaseMutation.mutate({ 
                              phase: 'borttagning', 
                              status: value,
                              completedDate: value === 'grädad' ? new Date().toISOString() : undefined
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="grädad">✅ Grädad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Slutförandedatum</Label>
                          <Input
                            type="date"
                            value={project.borttagningCompletedDate || ''}
                            onChange={(e) => updatePhaseMutation.mutate({ 
                              phase: 'borttagning', 
                              status: project.borttagningStatus || 'pending',
                              completedDate: e.target.value 
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Material Phase */}
                  <Card className={`transition-all duration-200 ${
                    project.materialStatus === 'grädad' 
                      ? 'border-green-300 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            project.materialStatus === 'grädad' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Package className={`h-5 w-5 ${
                              project.materialStatus === 'grädad' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <h4 className="font-semibold text-lg">3. Material</h4>
                        </div>
                        <Badge variant={project.materialStatus === 'grädad' ? 'default' : 'secondary'} className="text-sm">
                          {project.materialStatus === 'grädad' ? '✅ Grädad' : '⏳ Pending'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Arbetsstatus</Label>
                          <Select 
                            value={project.materialStatus || 'pending'}
                            onValueChange={(value) => updatePhaseMutation.mutate({ 
                              phase: 'material', 
                              status: value,
                              completedDate: value === 'grädad' ? new Date().toISOString() : undefined
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="grädad">✅ Grädad</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Slutförandedatum</Label>
                          <Input
                            type="date"
                            value={project.materialCompletedDate || ''}
                            onChange={(e) => updatePhaseMutation.mutate({ 
                              phase: 'material', 
                              status: project.materialStatus || 'pending',
                              completedDate: e.target.value 
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Invoice Phase */}
                  <Card className={`transition-all duration-200 ${
                    project.faktura1Status === 'completed' 
                      ? 'border-green-300 bg-green-50 shadow-md' 
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            project.faktura1Status === 'completed' ? 'bg-green-100' : 'bg-gray-100'
                          }`}>
                            <Receipt className={`h-5 w-5 ${
                              project.faktura1Status === 'completed' ? 'text-green-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <h4 className="font-semibold text-lg">4. Fakturering</h4>
                        </div>
                        <Badge variant={project.faktura1Status === 'completed' ? 'default' : 'secondary'} className="text-sm">
                          {project.faktura1Status === 'completed' ? '✅ Klar' : '⏳ Pending'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Faktureringsstatus</Label>
                          <Select 
                            value={project.faktura1Status || 'pending'}
                            onValueChange={(value) => updatePhaseMutation.mutate({ 
                              phase: 'faktura1', 
                              status: value,
                              completedDate: value === 'completed' ? new Date().toISOString() : undefined
                            })}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">⏳ Pending</SelectItem>
                              <SelectItem value="completed">✅ Klar</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Faktureringsdatum</Label>
                          <Input
                            type="date"
                            value={project.faktura1Date || ''}
                            onChange={(e) => updatePhaseMutation.mutate({ 
                              phase: 'faktura1', 
                              status: project.faktura1Status || 'pending',
                              completedDate: e.target.value 
                            })}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Enhanced Material Deliveries & Other Tracking */}
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Leveranser & Inspektioner
                    </CardTitle>
                    <CardDescription>Spåra materialleveranser och projektmilstolpar</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Truck className="h-4 w-4 text-orange-600" />
                            <Label className="font-medium">Leverans 1</Label>
                          </div>
                          <Input
                            type="date"
                            value={project.materialLeverans1Date || ''}
                            onChange={(e) => updateStatusMutation.mutate({ materialLeverans1Date: e.target.value })}
                            className="bg-white"
                          />
                          {project.materialLeverans1Date && (
                            <div className="text-xs text-orange-600 mt-1">
                              Planerad: {new Date(project.materialLeverans1Date).toLocaleDateString('sv-SE')}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-orange-200 bg-orange-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Truck className="h-4 w-4 text-orange-600" />
                            <Label className="font-medium">Leverans 2</Label>
                          </div>
                          <Input
                            type="date"
                            value={project.materialLeverans2Date || ''}
                            onChange={(e) => updateStatusMutation.mutate({ materialLeverans2Date: e.target.value })}
                            className="bg-white"
                          />
                          {project.materialLeverans2Date && (
                            <div className="text-xs text-orange-600 mt-1">
                              Planerad: {new Date(project.materialLeverans2Date).toLocaleDateString('sv-SE')}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-purple-200 bg-purple-50">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-4 w-4 text-purple-600" />
                            <Label className="font-medium">Slutbesiktning</Label>
                          </div>
                          <Input
                            type="date"
                            value={project.slutbesiktningDate || ''}
                            onChange={(e) => updateStatusMutation.mutate({ slutbesiktningDate: e.target.value })}
                            className="bg-white"
                          />
                          {project.slutbesiktningDate && (
                            <div className="text-xs text-purple-600 mt-1">
                              Planerad: {new Date(project.slutbesiktningDate).toLocaleDateString('sv-SE')}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Receipt className="h-4 w-4 text-green-600" />
                          <Label className="font-medium">Platskassa</Label>
                        </div>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            value={project.platskassa || 0}
                            onChange={(e) => updateStatusMutation.mutate({ platskassa: parseFloat(e.target.value) || 0 })}
                            className="bg-white max-w-xs"
                            placeholder="0"
                          />
                          <span className="text-sm text-green-600 font-medium">SEK</span>
                        </div>
                        <div className="text-xs text-green-600 mt-2">
                          Nuvarande saldo för projektets utgifter
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Projektdetaljer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Kund</Label>
                    <p className="text-sm text-gray-600">{project.kundFirstName} {project.kundLastName}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Adress</Label>
                    <p className="text-sm text-gray-600">{project.address}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Telefon</Label>
                    <p className="text-sm text-gray-600">{project.tel1}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Kundnummer</Label>
                    <p className="text-sm text-gray-600">{project.kundnummer}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Takspecifikationer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Taktyp</Label>
                    <p className="text-sm text-gray-600">{project.typAvTak}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Material</Label>
                    <p className="text-sm text-gray-600">{project.valAvTakmaterial}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total yta</Label>
                    <p className="text-sm text-gray-600">{project.totalYta} m²</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Projektöversikt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Startdatum</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(project.startDatum).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Slutdatum</Label>
                    <p className="text-sm text-gray-600">
                      {new Date(project.slutDatum).toLocaleDateString('sv-SE')}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Materialbeställningar</Label>
                    <p className="text-sm text-gray-600">{orderedMaterials}/{materials.length} beställda</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle>Projektanteckningar</CardTitle>
                <CardDescription>
                  Lägg till viktiga anteckningar och kommentarer för projektet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Textarea
                    placeholder="Skriv projektanteckningar här..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                  />
                  <Button
                    onClick={() => updateNotesMutation.mutate({ notes })}
                    disabled={updateNotesMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Spara anteckningar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projektteam</CardTitle>
                <CardDescription>
                  Hantera teammedlemmar och roller för projektet
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{member.name}</p>
                        <p className="text-sm text-gray-600">{member.role}</p>
                        <p className="text-sm text-gray-500">{member.phone}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add new team member */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Lägg till teammedlem</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Namn"
                        value={newTeamMember.name}
                        onChange={(e) => setNewTeamMember({...newTeamMember, name: e.target.value})}
                      />
                      <Input
                        placeholder="Roll"
                        value={newTeamMember.role}
                        onChange={(e) => setNewTeamMember({...newTeamMember, role: e.target.value})}
                      />
                      <Input
                        placeholder="Telefon"
                        value={newTeamMember.phone}
                        onChange={(e) => setNewTeamMember({...newTeamMember, phone: e.target.value})}
                      />
                      <Button onClick={addTeamMember} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Materialhantering</CardTitle>
                <CardDescription>
                  Hantera material, beställningar och leveranser
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Total materialkostnad</p>
                      <p className="text-2xl font-bold">{totalMaterialCost.toLocaleString()} kr</p>
                    </div>
                    <Badge variant="outline">
                      {orderedMaterials}/{materials.length} beställda
                    </Badge>
                  </div>
                  
                  {materials.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-medium">{material.name}</p>
                          <Badge variant={material.ordered ? "default" : "secondary"}>
                            {material.ordered ? "Beställd" : "Ej beställd"}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {material.quantity} {material.unit} - {material.cost.toLocaleString()} kr
                        </p>
                        {material.deliveryDate && (
                          <p className="text-sm text-green-600">
                            Leverans: {new Date(material.deliveryDate).toLocaleDateString('sv-SE')}
                          </p>
                        )}
                      </div>
                      <Button
                        variant={material.ordered ? "secondary" : "default"}
                        size="sm"
                        onClick={() => toggleMaterialOrder(material.id)}
                      >
                        {material.ordered ? "Avmarkera" : "Beställ"}
                      </Button>
                    </div>
                  ))}
                  
                  {/* Add new material */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium">Lägg till material</h4>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                      <Input
                        placeholder="Materialnamn"
                        value={newMaterial.name}
                        onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Antal"
                        value={newMaterial.quantity || ''}
                        onChange={(e) => setNewMaterial({...newMaterial, quantity: Number(e.target.value)})}
                      />
                      <Input
                        placeholder="Enhet"
                        value={newMaterial.unit}
                        onChange={(e) => setNewMaterial({...newMaterial, unit: e.target.value})}
                      />
                      <Input
                        type="number"
                        placeholder="Kostnad"
                        value={newMaterial.cost || ''}
                        onChange={(e) => setNewMaterial({...newMaterial, cost: Number(e.target.value)})}
                      />
                      <Button onClick={addMaterial} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Lägg till
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tidplan</CardTitle>
                <CardDescription>
                  Hantera projektets tidplan och milstolpar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Startdatum</Label>
                      <Input
                        type="date"
                        value={project.startDatum ? new Date(project.startDatum).toISOString().split('T')[0] : ''}
                        readOnly
                      />
                    </div>
                    <div>
                      <Label>Beräknat slutdatum</Label>
                      <Input
                        type="date"
                        value={project.slutDatum ? new Date(project.slutDatum).toISOString().split('T')[0] : ''}
                        readOnly
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Projektfaser</h4>
                    <div className="space-y-2">
                      {[
                        { phase: "Materialbeställning", status: "completed", date: "2025-07-10" },
                        { phase: "Byggnadslov", status: "in-progress", date: "2025-07-12" },
                        { phase: "Rivning av gamla material", status: "pending", date: "2025-07-15" },
                        { phase: "Installation av underlag", status: "pending", date: "2025-07-16" },
                        { phase: "Takläggning", status: "pending", date: "2025-07-18" },
                        { phase: "Slutbesiktning", status: "pending", date: "2025-07-22" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              item.status === 'completed' ? 'bg-green-500' :
                              item.status === 'in-progress' ? 'bg-blue-500' : 'bg-gray-300'
                            }`} />
                            <span>{item.phase}</span>
                          </div>
                          <span className="text-sm text-gray-500">{item.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Projektinställningar</CardTitle>
                <CardDescription>
                  Hantera projektstatus och leverantörer
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Projektstatus</Label>
                  <Select defaultValue={project.status || 'pågående'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pågående">Pågående</SelectItem>
                      <SelectItem value="pausad">Pausad</SelectItem>
                      <SelectItem value="avslutad">Avslutad</SelectItem>
                      <SelectItem value="avbruten">Avbruten</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Materialleverantör</Label>
                  <Select defaultValue="beijer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beijer">Beijer Bygg</SelectItem>
                      <SelectItem value="byggmax">Byggmax</SelectItem>
                      <SelectItem value="hornbach">Hornbach</SelectItem>
                      <SelectItem value="other">Annan leverantör</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Teamfärg</Label>
                  <div className="flex gap-2 mt-2">
                    {['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500'].map((color) => (
                      <div
                        key={color}
                        className={`w-8 h-8 rounded cursor-pointer border-2 ${color} ${
                          project.teamColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}