import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { 
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Truck,
  Building,
  Package,
  FileText,
  Image,
  Download,
  ExternalLink
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "wouter";
import Navbar from "@/components/ui/navbar";

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
  bortforslingStatusDate?: Date;
  bortforslingDate?: Date;
  byggställningStatus: 'pending' | 'scheduled' | 'completed';
  byggställningStatusDate?: Date;
  byggställningDate?: Date;
  materialStatus: 'pending' | 'ordered' | 'delivered';
  materialStatusDate?: Date;
  materialDate?: Date;
  materialLeverans1Date?: Date;
  materialLeverans2Date?: Date;
  materialLeverans2Status?: 'pending' | 'ordered' | 'delivered';
  teamAssigned?: string;
  platslare?: string;
  platslareCompleted?: boolean;
  notes?: string;
  // Project files
  imageFileUrls?: string[];
  agreementFileUrl?: string;
}

// Status Column Component with Dropdown and Date Picker
function StatusColumn({ 
  ticketId, 
  status, 
  date, 
  type, 
  onUpdate 
}: { 
  ticketId: number, 
  status: string, 
  date?: Date, 
  type: 'byggställning' | 'bortforsling' | 'material',
  onUpdate: (ticketId: number, type: string, status: string, date?: Date) => void 
}) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date ? new Date(date) : undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const statusOptions = {
    byggställning: [
      { value: 'pending', label: 'Väntande' },
      { value: 'ordered', label: 'Beställt' },
      { value: 'scheduled', label: 'Schemalagt' },
      { value: 'completed', label: 'Slutfört' }
    ],
    bortforsling: [
      { value: 'pending', label: 'Väntande' },
      { value: 'ordered', label: 'Beställt' },
      { value: 'scheduled', label: 'Schemalagt' },
      { value: 'completed', label: 'Slutfört' }
    ],
    material: [
      { value: 'pending', label: 'Väntande' },
      { value: 'ordered', label: 'Beställt' },
      { value: 'delivered', label: 'Levererat' }
    ]
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'delivered': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'scheduled': return <Clock className="w-3 h-3 text-blue-600" />;
      case 'ordered': return <Package className="w-3 h-3 text-orange-600" />;
      case 'pending': return <AlertCircle className="w-3 h-3 text-gray-600" />;
      default: return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    const option = statusOptions[type].find(opt => opt.value === status);
    return option?.label || 'Väntande';
  };

  const handleStatusChange = (newStatus: string) => {
    onUpdate(ticketId, type, newStatus, selectedDate);
  };

  const handleDateChange = (newDate: Date | undefined) => {
    setSelectedDate(newDate);
    setIsCalendarOpen(false);
    onUpdate(ticketId, type, status, newDate);
  };

  return (
    <div className="flex flex-col items-center space-y-1">
      {/* Status Dropdown */}
      <Popover>
        <PopoverTrigger asChild>
          <div className="cursor-pointer hover:bg-blue-50 rounded p-1 transition-colors flex flex-col items-center">
            {getStatusIcon(status)}
            <span className="text-xs text-gray-500">{getStatusText(status)}</span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-2" onClick={(e) => e.stopPropagation()}>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions[type].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(option.value)}
                    <span>{option.label}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </PopoverContent>
      </Popover>

      {/* Date Display/Picker */}
      {date ? (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <span 
              className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 rounded px-1"
              onClick={(e) => e.stopPropagation()}
            >
              {format(new Date(date), 'MMM dd', { locale: sv })}
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              locale={sv}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <span 
              className="text-xs text-gray-400 cursor-pointer hover:bg-gray-100 rounded px-1 flex items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <Calendar className="w-3 h-3 mr-1" />
              Sätt datum
            </span>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" onClick={(e) => e.stopPropagation()}>
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleDateChange}
              initialFocus
              locale={sv}
            />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

export default function ProjectLeaderZendesk() {
  const [expandedTickets, setExpandedTickets] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: projectTickets, isLoading } = useQuery({
    queryKey: ['/api/project-leader/tickets'],
    retry: false,
  });

  const updateProjectMutation = useMutation({
    mutationFn: async ({ ticketId, data }: { ticketId: number; data: any }) => {
      const response = await fetch(`/api/project-leader/tickets/${ticketId}`, {
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

  const toggleTicket = (ticketId: number) => {
    const newExpanded = new Set(expandedTickets);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
    }
    setExpandedTickets(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': 
      case 'delivered': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'scheduled': 
      case 'ordered': return <Clock className="w-3 h-3 text-blue-600" />;
      case 'pending': return <AlertCircle className="w-3 h-3 text-gray-600" />;
      default: return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Slutfört';
      case 'delivered': return 'Levererat';
      case 'scheduled': return 'Schemalagt';
      case 'ordered': return 'Beställt';
      case 'pending': return 'Väntande';
      default: return 'Väntande';
    }
  };

  const updatePhaseStatus = (ticketId: number, type: string, newStatus: string, date?: Date) => {
    const updateData: any = {};
    updateData[`${type}Status`] = newStatus;
    
    // If a date is provided, update the appropriate date field
    if (date) {
      if (type === 'byggställning') {
        updateData.byggställningDate = date;
      } else if (type === 'bortforsling') {
        updateData.bortforslingDate = date;
      } else if (type === 'material') {
        updateData.materialLeverans1Date = date;
      }
    }
    
    updateProjectMutation.mutate({
      ticketId,
      data: updateData
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Laddar projekt...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Projekthantering (Zendesk-stil)</h1>
            <p className="text-sm text-gray-600 mt-1">{projectTickets?.length || 0} aktiva projekt</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link href="/planning">
              <Button variant="outline" size="sm">
                <Calendar className="w-4 h-4 mr-2" />
                Planering
              </Button>
            </Link>
          </div>
        </div>

        {/* Column Headers */}
        <div className="mt-4 px-4">
          <div className="grid grid-cols-12 gap-2 text-xs text-gray-500 uppercase font-medium border-b border-gray-200 pb-2">
            <div className="col-span-1"></div>
            <div className="col-span-2">Gata</div>
            <div className="col-span-2">Kundnamn</div>
            <div className="col-span-1">Projektnummer</div>
            <div className="col-span-1">Team</div>
            <div className="col-span-1">Ställning</div>
            <div className="col-span-1">Bortforsling</div>
            <div className="col-span-1">Material 1</div>
            <div className="col-span-1">Material 2</div>
            <div className="col-span-1">Plåtslagare</div>
          </div>
        </div>
      </div>

      {/* Ticket List */}
      <div className="mx-auto p-6">
        <div className="space-y-1">
          {projectTickets?.map((ticket: ProjectTicket) => (
            <Card key={ticket.id} className="bg-white border border-gray-200 hover:border-gray-300 transition-colors">
              {/* Ticket Header */}
              <div className="px-4 py-3">
                <div className="grid grid-cols-12 gap-2 items-center text-sm">
                  {/* Expand/Collapse Icon - Only this area is clickable for expanding */}
                  <div 
                    className="col-span-1 flex justify-center cursor-pointer hover:bg-gray-100 rounded p-1"
                    onClick={() => toggleTicket(ticket.id)}
                  >
                    {expandedTickets.has(ticket.id) ? (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>

                  {/* Gata (Street) */}
                  <div className="col-span-2 truncate">
                    <div className="font-medium text-gray-900 truncate">
                      {ticket.customerAdress.split(',')[0]?.trim() || 'Okänd gata'}
                    </div>
                  </div>

                  {/* Kundnamn */}
                  <div className="col-span-2 truncate">
                    <div className="font-medium text-gray-900 truncate">{ticket.customerName}</div>
                  </div>

                  {/* Projektnummer */}
                  <div className="col-span-1">
                    <div className="font-medium text-gray-900">#{ticket.calculationId}</div>
                  </div>

                  {/* Team */}
                  <div className="col-span-1">
                    <div className="text-gray-700">{ticket.teamAssigned || 'Team A'}</div>
                  </div>

                  {/* Ställning+Datum - Status Column with Dropdown */}
                  <div className="col-span-1">
                    <StatusColumn
                      ticketId={ticket.id}
                      status={ticket.byggställningStatus}
                      date={ticket.byggställningDate}
                      type="byggställning"
                      onUpdate={updatePhaseStatus}
                    />
                  </div>

                  {/* Bortforsling+datum - Status Column with Dropdown */}
                  <div className="col-span-1">
                    <StatusColumn
                      ticketId={ticket.id}
                      status={ticket.bortforslingStatus}
                      date={ticket.bortforslingDate}
                      type="bortforsling"
                      onUpdate={updatePhaseStatus}
                    />
                  </div>

                  {/* Material 1 - Status Column with Dropdown */}
                  <div className="col-span-1">
                    <StatusColumn
                      ticketId={ticket.id}
                      status={ticket.materialStatus}
                      date={ticket.materialLeverans1Date}
                      type="material"
                      onUpdate={updatePhaseStatus}
                    />
                  </div>

                  {/* Material 2 - Status Column with Dropdown */}
                  <div className="col-span-1">
                    <StatusColumn
                      ticketId={ticket.id}
                      status={ticket.materialLeverans2Status || 'pending'}
                      date={ticket.materialLeverans2Date}
                      type="material"
                      onUpdate={(ticketId, type, status, date) => {
                        // Handle Material 2 updates differently
                        const updateData: any = {};
                        updateData.materialLeverans2Status = status;
                        if (date) {
                          updateData.materialLeverans2Date = date;
                        }
                        updateProjectMutation.mutate({
                          ticketId,
                          data: updateData
                        });
                      }}
                    />
                  </div>

                  {/* Plåtslagare */}
                  <div className="col-span-1">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="cursor-pointer hover:bg-blue-50 rounded p-1 transition-colors flex flex-col items-center space-y-1">
                          <div className="flex items-center space-x-1">
                            {ticket.platslareCompleted ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <Circle className="w-3 h-3 text-gray-400" />
                            )}
                            <User className="w-3 h-3 text-gray-600" />
                          </div>
                          <div className="text-xs text-gray-600 text-center max-w-20 truncate">
                            {ticket.platslare || 'Inte tilldelad'}
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-3" onClick={(e) => e.stopPropagation()}>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-700 block mb-1">
                              Plåtslagare
                            </label>
                            <input
                              type="text"
                              value={ticket.platslare || ''}
                              onChange={(e) => {
                                updateProjectMutation.mutate({
                                  ticketId: ticket.id,
                                  data: { platslare: e.target.value }
                                });
                              }}
                              className="w-full text-sm border rounded px-2 py-1"
                              placeholder="Ange plåtslagare..."
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`platslare-${ticket.id}`}
                              checked={ticket.platslareCompleted || false}
                              onChange={(e) => {
                                updateProjectMutation.mutate({
                                  ticketId: ticket.id,
                                  data: { platslareCompleted: e.target.checked }
                                });
                              }}
                              className="rounded"
                            />
                            <label htmlFor={`platslare-${ticket.id}`} className="text-sm text-gray-700">
                              Plåtslagare klar
                            </label>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedTickets.has(ticket.id) && (
                <>
                  <Separator />
                  <CardContent className="px-4 py-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Customer Details */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Kunduppgifter
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{ticket.customerPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{ticket.customerAdress}</span>
                          </div>
                        </div>
                      </div>



                      {/* Project Files */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Projektfiler
                        </h3>

                        {/* Agreement File */}
                        {ticket.agreementFileUrl && (
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
                                  onClick={() => window.open(ticket.agreementFileUrl, '_blank')}
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Project Images */}
                        {ticket.imageFileUrls && ticket.imageFileUrls.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Image className="w-4 h-4" />
                              Bilder ({ticket.imageFileUrls.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {ticket.imageFileUrls.slice(0, 4).map((imageUrl, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={imageUrl}
                                    alt={`Bild ${index + 1}`}
                                    className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-75 transition-opacity"
                                    onClick={() => window.open(imageUrl, '_blank')}
                                  />
                                </div>
                              ))}
                            </div>
                            {ticket.imageFileUrls.length > 4 && (
                              <p className="text-xs text-gray-500">
                                +{ticket.imageFileUrls.length - 4} fler bilder
                              </p>
                            )}
                          </div>
                        )}

                        {/* Projektmall Link */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`/revised-calculation/${ticket.calculationId}`, '_blank')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Öppna Projektmall (Kalkyl #{ticket.calculationId})
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {projectTickets?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inga aktiva projekt</h3>
              <p>Det finns inga projekt att visa just nu.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}