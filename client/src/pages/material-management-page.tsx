import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Calendar,
  MapPin,
  User,
  Building,
  DollarSign,
  TrendingUp,
  Search,
  Filter,
  Download,
  Plus,
  Edit
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/ui/navbar";
import type { MaterialRequest, Project, User as UserType } from "@/shared/schema";

interface MaterialRequestWithProject extends MaterialRequest {
  project?: Project;
  requestedByUser?: UserType;
}

export default function MaterialManagementPage() {
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<MaterialRequestWithProject | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch material requests
  const { data: materialRequests, isLoading } = useQuery<MaterialRequestWithProject[]>({
    queryKey: ['/api/material-requests'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch dashboard stats
  const { data: dashboardStats } = useQuery({
    queryKey: ['/api/material-requests/stats'],
  });

  // Update material request status
  const updateRequestMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<MaterialRequest> }) => {
      return await apiRequest(`/api/material-requests/${id}`, 'PUT', updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests/stats'] });
      toast({
        title: "Uppdaterat",
        description: "Materialförfrågan har uppdaterats",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera förfrågan",
        variant: "destructive",
      });
    },
  });

  // Create new material request
  const createRequestMutation = useMutation({
    mutationFn: async (data: Partial<MaterialRequest>) => {
      return await apiRequest('/api/material-requests', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/material-requests/stats'] });
      setIsCreateOpen(false);
      toast({
        title: "Skapat",
        description: "Ny materialförfrågan har skapats",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa förfrågan",
        variant: "destructive",
      });
    },
  });

  // Generate export report
  const exportMutation = useMutation({
    mutationFn: async (params: { status?: string; priority?: string }) => {
      return await apiRequest('/api/material-requests/export', 'POST', params);
    },
    onSuccess: (data) => {
      // Handle CSV download
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material-requests-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    },
  });

  // Filter material requests
  const filteredRequests = materialRequests?.filter(request => {
    const matchesStatus = selectedStatus === "all" || request.status === selectedStatus;
    const matchesPriority = selectedPriority === "all" || request.priority === selectedPriority;
    const matchesSearch = searchTerm === "" || 
      request.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.customerAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.orderReference?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'ordered': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'ordered': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK' }).format(amount);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('sv-SE');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto py-8">
          <div className="text-center">Laddar materialförfrågningar...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Building className="h-8 w-8 text-blue-600" />
                Materialhantering - Beijer Bygg
              </h1>
              <p className="text-gray-600 mt-2">
                Hantera och beställ material för alla projekt
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => exportMutation.mutate({ status: selectedStatus, priority: selectedPriority })}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportera
              </Button>
              <Button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Ny förfrågan
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Väntande</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {dashboardStats?.pending || 0}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Beställda</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {dashboardStats?.ordered || 0}
                  </p>
                </div>
                <Package className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Levererade</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardStats?.delivered || 0}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total kostnad</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatCurrency(dashboardStats?.totalCost || 0)}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Sök</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Sök kund, adress eller referens..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="pending">Väntande</SelectItem>
                    <SelectItem value="approved">Godkänd</SelectItem>
                    <SelectItem value="ordered">Beställd</SelectItem>
                    <SelectItem value="delivered">Levererad</SelectItem>
                    <SelectItem value="cancelled">Avbruten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Prioritet</Label>
                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="urgent">Brådskande</SelectItem>
                    <SelectItem value="high">Hög</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Låg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedStatus("all");
                    setSelectedPriority("all");
                    setSearchTerm("");
                  }}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Rensa filter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Materialförfrågningar ({filteredRequests.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kund</TableHead>
                    <TableHead>Projekt</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prioritet</TableHead>
                    <TableHead>Materialkostnad</TableHead>
                    <TableHead>Projektstart</TableHead>
                    <TableHead>Leverans</TableHead>
                    <TableHead>Åtgärder</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.customerName}</div>
                          <div className="text-sm text-gray-500">{request.customerAddress}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">#{request.projectId}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          {getStatusIcon(request.status)}
                          <span className="ml-2 capitalize">{request.status}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(request.priority)}>
                          {request.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatCurrency(request.totalMaterialCost)}
                      </TableCell>
                      <TableCell>
                        {formatDate(request.projectStartDate)}
                      </TableCell>
                      <TableCell>
                        {request.actualDelivery ? (
                          <span className="text-green-600">
                            {formatDate(request.actualDelivery)}
                          </span>
                        ) : request.estimatedDelivery ? (
                          <span className="text-blue-600">
                            ~{formatDate(request.estimatedDelivery)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // Open edit dialog
                              setSelectedRequest(request);
                              setIsDetailsOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {filteredRequests.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                Inga materialförfrågningar hittades
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Materialförfrågan #{selectedRequest?.id}</DialogTitle>
            </DialogHeader>
            
            {selectedRequest && (
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Detaljer</TabsTrigger>
                  <TabsTrigger value="materials">Material</TabsTrigger>
                  <TabsTrigger value="actions">Åtgärder</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kund</Label>
                      <p className="font-medium">{selectedRequest.customerName}</p>
                    </div>
                    <div>
                      <Label>Adress</Label>
                      <p className="text-sm">{selectedRequest.customerAddress}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Badge className={getStatusColor(selectedRequest.status)}>
                        {selectedRequest.status}
                      </Badge>
                    </div>
                    <div>
                      <Label>Prioritet</Label>
                      <Badge className={getPriorityColor(selectedRequest.priority)}>
                        {selectedRequest.priority}
                      </Badge>
                    </div>
                    <div>
                      <Label>Total materialkostnad</Label>
                      <p className="font-bold text-lg">{formatCurrency(selectedRequest.totalMaterialCost)}</p>
                    </div>
                    <div>
                      <Label>Projektstart</Label>
                      <p>{formatDate(selectedRequest.projectStartDate)}</p>
                    </div>
                  </div>
                  
                  {selectedRequest.notes && (
                    <div>
                      <Label>Anteckningar</Label>
                      <p className="text-sm bg-gray-50 p-3 rounded">{selectedRequest.notes}</p>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="materials">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Materiallista</h3>
                    {selectedRequest.materialList && (
                      <div className="space-y-2">
                        {JSON.parse(selectedRequest.materialList as string).map((item: any, index: number) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-gray-600">{item.quantity} {item.unit}</p>
                            </div>
                            <p className="font-medium">{formatCurrency(item.cost)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Uppdatera status</Label>
                      <Select
                        value={selectedRequest.status}
                        onValueChange={(value) => 
                          updateRequestMutation.mutate({
                            id: selectedRequest.id,
                            updates: { status: value }
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Väntande</SelectItem>
                          <SelectItem value="approved">Godkänd</SelectItem>
                          <SelectItem value="ordered">Beställd</SelectItem>
                          <SelectItem value="delivered">Levererad</SelectItem>
                          <SelectItem value="cancelled">Avbruten</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Leveransdatum</Label>
                      <Input
                        type="date"
                        value={selectedRequest.estimatedDelivery || ''}
                        onChange={(e) => 
                          updateRequestMutation.mutate({
                            id: selectedRequest.id,
                            updates: { estimatedDelivery: e.target.value }
                          })
                        }
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Distributörsanteckningar</Label>
                    <Textarea
                      placeholder="Anteckningar från Beijer Bygg..."
                      value={selectedRequest.distributorNotes || ''}
                      onChange={(e) => 
                        updateRequestMutation.mutate({
                          id: selectedRequest.id,
                          updates: { distributorNotes: e.target.value }
                        })
                      }
                    />
                  </div>
                  
                  <div>
                    <Label>Orderreferens</Label>
                    <Input
                      placeholder="Beijer Bygg orderreferens..."
                      value={selectedRequest.orderReference || ''}
                      onChange={(e) => 
                        updateRequestMutation.mutate({
                          id: selectedRequest.id,
                          updates: { orderReference: e.target.value }
                        })
                      }
                    />
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}