import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import Navbar from "@/components/ui/navbar";
import RoleImpersonationBar from "@/components/ui/role-impersonation-bar";
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Eye,
  Edit,
  Truck,
  Building,
  Package,
  Calendar,
  MapPin,
  User,
  Phone,
  Mail,
  FileText,
  Image,
  File,
  Download,
  ExternalLink,
  Monitor,
  BarChart3
} from "lucide-react";

interface ProjectTicket {
  id: number;
  calculationId: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAdress: string;
  status: 'new' | 'review' | 'approved' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
  updatedAt: Date;
  totalPrice: number;
  area: number;
  roofType: string;
  materialType: string;
  // Project phases
  bortforslingStatus: 'pending' | 'scheduled' | 'completed';
  bortforslingStatusDate?: Date; // Date when any status was set
  bortforslingDate?: Date; // Date when completed
  byggställningStatus: 'pending' | 'scheduled' | 'completed';
  byggställningStatusDate?: Date; // Date when any status was set
  byggställningDate?: Date; // Date when completed
  materialStatus: 'pending' | 'ordered' | 'delivered';
  materialStatusDate?: Date; // Date when any status was set
  materialDate?: Date; // Date when completed
  notes?: string;
  // Project files
  imageFileUrls?: string[];
  agreementFileUrl?: string;
}

export default function ProjectLeaderDashboard() {
  const [selectedTicket, setSelectedTicket] = useState<ProjectTicket | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any>({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectTickets, isLoading } = useQuery({
    queryKey: ['/api/project-leader/tickets'],
    retry: false,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['/api/projects'],
    retry: false,
  });

  // Calculate task indicators
  const pendingTickets = projectTickets?.filter(ticket => ticket.status === 'new' || ticket.status === 'review').length || 0;
  const activeProjects = projects.filter(project => project.status === 'ongoing').length || 0;
  const materialRequests = projects.filter(project => project.materialStatus === 'pending').length || 0;

  const updateProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch(`/api/project-leader/tickets/${selectedTicket?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to update project');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/project-leader/tickets'] });
      setEditMode(false);
      toast({
        title: "Projekt uppdaterat",
        description: "Projektinformationen har sparats.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel vid uppdatering",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'scheduled': return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-4 h-4 text-gray-400" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const handlePhaseUpdate = (phase: string, status: string) => {
    const now = new Date();
    const updateData = {
      [`${phase}Status`]: status,
      [`${phase}StatusDate`]: now, // Always save date for any status change
      // Keep existing completion date if marking as completed
      ...(status === 'completed' && { [`${phase}Date`]: now })
    };
    updateProjectMutation.mutate(updateData);
  };

  const handleOpenCalculation = (calculationId: number) => {
    // Open the revised calculation form with the calculation data
    window.open(`/revised-calculation/${calculationId}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Laddar projektkö...</div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-4">
        <RoleImpersonationBar />
        <div className="flex items-center gap-4 mb-6">
          <h1 className="text-3xl font-bold">Projektledare Dashboard</h1>
        <Badge variant="outline" className="px-3 py-1">
          {projectTickets?.length || 0} aktiva projekt
        </Badge>
      </div>
      <p className="text-gray-600 mb-8">Projektfokuserad översikt med uppgiftsindikatorer och snabblänkar</p>
      
      {/* Navigation Cards with Task Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-lg transition-shadow relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Gantt Planering
              {activeProjects > 0 && (
                <Badge variant="secondary" className="ml-auto">
                  {activeProjects}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/planning-gantt">
              <Button className="w-full">Öppna Planering</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              TV-Display
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/tv-display">
              <Button className="w-full">Öppna TV-Display</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow relative">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Projekt Support
              {pendingTickets > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {pendingTickets}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/project-leader-zendesk">
              <Button className="w-full">Zendesk Support</Button>
            </Link>
          </CardContent>
        </Card>
      </div>




        {/* Ticket Queue */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Projektkö
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {projectTickets?.map((ticket: ProjectTicket) => (
                <div
                  key={ticket.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedTicket?.id === ticket.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{ticket.customerName}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {ticket.customerAdress}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={`text-xs ${getStatusColor(ticket.status)}`}>
                          {ticket.status}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      #{ticket.id}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="space-y-6">
              {/* Customer Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Projekt #{selectedTicket.id}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(!editMode)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        {editMode ? 'Avbryt' : 'Redigera'}
                      </Button>
                      {editMode && (
                        <Button
                          size="sm"
                          onClick={() => updateProjectMutation.mutate(editData)}
                          disabled={updateProjectMutation.isPending}
                        >
                          Spara
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Kund:</span>
                        {editMode ? (
                          <Input
                            value={editData.customerName || selectedTicket.customerName}
                            onChange={(e) => setEditData({...editData, customerName: e.target.value})}
                            className="h-8"
                          />
                        ) : (
                          <span>{selectedTicket.customerName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Telefon:</span>
                        {editMode ? (
                          <Input
                            value={editData.customerPhone || selectedTicket.customerPhone}
                            onChange={(e) => setEditData({...editData, customerPhone: e.target.value})}
                            className="h-8"
                          />
                        ) : (
                          <span>{selectedTicket.customerPhone}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Email:</span>
                        {editMode ? (
                          <Input
                            value={editData.customerEmail || selectedTicket.customerEmail}
                            onChange={(e) => setEditData({...editData, customerEmail: e.target.value})}
                            className="h-8"
                          />
                        ) : (
                          <span>{selectedTicket.customerEmail}</span>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">Adress:</span>
                        {editMode ? (
                          <Input
                            value={editData.customerAdress || selectedTicket.customerAdress}
                            onChange={(e) => setEditData({...editData, customerAdress: e.target.value})}
                            className="h-8"
                          />
                        ) : (
                          <span>{selectedTicket.customerAdress}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Pris:</span>
                        <span className="text-lg font-bold text-green-600">
                          {selectedTicket.totalPrice?.toLocaleString()} kr
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Yta:</span>
                        <span>{selectedTicket.area} m²</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Phases */}
              <Card>
                <CardHeader>
                  <CardTitle>Projektfaser</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Bortforsling */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Truck className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium">Bortforsling</div>
                            <div className="text-sm text-gray-500">
                              Rivning och bortforsling av gammalt material
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPhaseIcon(selectedTicket.bortforslingStatus)}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={selectedTicket.bortforslingStatus === 'pending' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('bortforsling', 'pending')}
                            >
                              Väntar
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket.bortforslingStatus === 'scheduled' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('bortforsling', 'scheduled')}
                            >
                              Schemalagd
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket.bortforslingStatus === 'completed' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('bortforsling', 'completed')}
                            >
                              Klar
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        {selectedTicket.bortforslingStatusDate && (
                          <div>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Status uppdaterad: {new Date(selectedTicket.bortforslingStatusDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                        {selectedTicket.bortforslingDate && (
                          <div>
                            <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                            Slutförd: {new Date(selectedTicket.bortforslingDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Byggställning */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-orange-600" />
                          <div>
                            <div className="font-medium">Byggställning</div>
                            <div className="text-sm text-gray-500">
                              Uppsättning av byggställning
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPhaseIcon(selectedTicket.byggställningStatus)}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={selectedTicket.byggställningStatus === 'pending' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('byggställning', 'pending')}
                            >
                              Väntar
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket.byggställningStatus === 'scheduled' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('byggställning', 'scheduled')}
                            >
                              Schemalagd
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket.byggställningStatus === 'completed' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('byggställning', 'completed')}
                            >
                              Klar
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        {selectedTicket.byggställningStatusDate && (
                          <div>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Status uppdaterad: {new Date(selectedTicket.byggställningStatusDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                        {selectedTicket.byggställningDate && (
                          <div>
                            <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                            Slutförd: {new Date(selectedTicket.byggställningDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Material */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-green-600" />
                          <div>
                            <div className="font-medium">Material</div>
                            <div className="text-sm text-gray-500">
                              Beställning och leverans av material
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getPhaseIcon(selectedTicket.materialStatus)}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={selectedTicket.materialStatus === 'pending' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('material', 'pending')}
                            >
                              Väntar
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket.materialStatus === 'ordered' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('material', 'ordered')}
                            >
                              Beställd
                            </Button>
                            <Button
                              size="sm"
                              variant={selectedTicket.materialStatus === 'delivered' ? 'default' : 'outline'}
                              onClick={() => handlePhaseUpdate('material', 'delivered')}
                            >
                              Levererad
                            </Button>
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600 mt-2 space-y-1">
                        {selectedTicket.materialStatusDate && (
                          <div>
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Status uppdaterad: {new Date(selectedTicket.materialStatusDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                        {selectedTicket.materialDate && (
                          <div>
                            <CheckCircle className="w-4 h-4 inline mr-1 text-green-600" />
                            Slutförd: {new Date(selectedTicket.materialDate).toLocaleDateString('sv-SE')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Project Template/Calculation */}
              <Card>
                <CardHeader>
                  <CardTitle>Projektmall</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      Öppna den ursprungliga kalkylen för att se fullständiga detaljer och gör eventuella justeringar.
                    </div>
                    <Button
                      onClick={() => handleOpenCalculation(selectedTicket.calculationId)}
                      variant="outline"
                      className="w-full"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Öppna Projektmall (Kalkyl #{selectedTicket.calculationId})
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Project Files */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <File className="w-5 h-5" />
                    Projektfiler
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Agreement File */}
                    {selectedTicket.agreementFileUrl && (
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium">Avtal</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(selectedTicket.agreementFileUrl, '_blank')}
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Öppna
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const link = document.createElement('a');
                                link.href = selectedTicket.agreementFileUrl!;
                                link.download = `avtal-${selectedTicket.customerName}.pdf`;
                                link.click();
                              }}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Ladda ner
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Project Images */}
                    {selectedTicket.imageFileUrls && selectedTicket.imageFileUrls.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Image className="w-4 h-4" />
                          Projektbilder ({selectedTicket.imageFileUrls.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedTicket.imageFileUrls.map((imageUrl, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={imageUrl}
                                alt={`Projektbild ${index + 1}`}
                                className="w-full h-24 object-cover rounded-lg border cursor-pointer hover:opacity-75 transition-opacity"
                                onClick={() => window.open(imageUrl, '_blank')}
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all flex items-center justify-center">
                                <ExternalLink className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* No files message */}
                    {(!selectedTicket.agreementFileUrl && (!selectedTicket.imageFileUrls || selectedTicket.imageFileUrls.length === 0)) && (
                      <div className="text-center py-6 text-gray-500">
                        <File className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm">Inga filer uppladdade för detta projekt</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Anteckningar</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={editData.notes || selectedTicket.notes || ''}
                    onChange={(e) => setEditData({...editData, notes: e.target.value})}
                    placeholder="Lägg till anteckningar om projektet..."
                    className="min-h-[100px]"
                  />
                  <Button
                    className="mt-2"
                    onClick={() => updateProjectMutation.mutate({ notes: editData.notes })}
                    disabled={updateProjectMutation.isPending}
                  >
                    Spara anteckningar
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Välj ett projekt
                  </h3>
                  <p className="text-gray-500">
                    Klicka på ett projekt i kön för att visa detaljer
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}