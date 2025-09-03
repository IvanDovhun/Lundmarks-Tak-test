import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  FileText,
  Image,
  Download,
  ExternalLink,
  Euro
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Link } from "wouter";
import Navbar from "@/components/ui/navbar";

interface CustomerRecord {
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
  notes?: string;
  // Customer files
  imageFileUrls?: string[];
  agreementFileUrl?: string;
}

export default function CustomerRegistry() {
  const [expandedRecords, setExpandedRecords] = useState<Set<number>>(new Set());
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customerRecords, isLoading } = useQuery({
    queryKey: ['/api/admin/calculations'],
    retry: false,
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ recordId, data }: { recordId: number; data: any }) => {
      const response = await fetch(`/api/admin/calculations/${recordId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        throw new Error('Failed to update customer record');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/calculations'] });
      toast({
        title: "Kund uppdaterad",
        description: "Kundinformationen har sparats.",
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

  const toggleRecord = (recordId: number) => {
    const newExpanded = new Set(expandedRecords);
    if (newExpanded.has(recordId)) {
      newExpanded.delete(recordId);
    } else {
      newExpanded.add(recordId);
    }
    setExpandedRecords(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'deal': return 'bg-green-100 text-green-800';
      case 'demo': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-purple-100 text-purple-800';
      case 'review': return 'bg-orange-100 text-orange-800';
      case 'new': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'deal': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'demo': return <Clock className="w-3 h-3 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'in_progress': return <Clock className="w-3 h-3 text-blue-600" />;
      case 'approved': return <CheckCircle className="w-3 h-3 text-purple-600" />;
      case 'review': return <AlertCircle className="w-3 h-3 text-orange-600" />;
      case 'new': return <Circle className="w-3 h-3 text-gray-600" />;
      default: return <Circle className="w-3 h-3 text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Slutfört';
      case 'in_progress': return 'Pågår';
      case 'approved': return 'Godkänt';
      case 'review': return 'Under granskning';
      case 'new': return 'Ny';
      default: return 'Ny';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('sv-SE', {
      style: 'currency',
      currency: 'SEK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Laddar kundregister...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 py-2">
        <div className="status-toggle-container mb-2">
          <Link href="/deals">
            <button className="status-toggle-button inactive">
              Pågående Affärer
            </button>
          </Link>
          <Link href="/deals">
            <button className="status-toggle-button inactive">
              Klara Affärer
            </button>
          </Link>
          <Link href="/demos">
            <button className="status-toggle-button inactive">
              Demo
            </button>
          </Link>
          <button className="status-toggle-button active">
            Kundregister
          </button>
        </div>
      </div>
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Kundregister</h1>
            <p className="text-gray-600 mt-1">Alla kunder och beräkningar</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {customerRecords?.calculations?.length || 0} kunder
            </Badge>
          </div>
        </div>
      </div>

      {/* Customer Records List */}
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          {customerRecords?.calculations?.map((record: CustomerRecord) => (
            <Card key={record.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleRecord(record.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {expandedRecords.has(record.id) ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                    
                    <div>
                      <CardTitle className="text-lg font-semibold text-gray-900">
                        {record.inputData?.customerName || record.customerName || 'Okänd kund'}
                      </CardTitle>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Phone className="w-4 h-4" />
                          {record.inputData?.customerPhone || record.customerPhone || 'Ej angett'}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {record.inputData?.customerAdress || record.customerAdress || 'Ej angett'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900">
                        {formatPrice(record.totalCost || record.totalPrice || 0)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {record.inputData?.area || record.area || 0} m² • {record.inputData?.roofType?.name || record.roofType || 'Okänt tak'}
                      </div>
                    </div>
                    
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.calculationType || record.status || 'new')}`}>
                      {getStatusIcon(record.calculationType || record.status || 'new')}
                      {record.calculationType === 'demo' ? 'Demo' : record.calculationType === 'deal' ? 'Affär' : getStatusText(record.status || 'new')}
                    </div>
                  </div>
                </div>
              </CardHeader>

              {expandedRecords.has(record.id) && (
                <>
                  <Separator />
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Customer Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Kunduppgifter</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{record.inputData?.customerName || record.customerName || 'Okänd kund'}</p>
                              <p className="text-xs text-gray-600">Kund</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Phone className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{record.inputData?.customerPhone || record.customerPhone || 'Ej angett'}</p>
                              <p className="text-xs text-gray-600">Telefon</p>
                            </div>
                          </div>

                          {(record.inputData?.customerEmail || record.customerEmail) && (
                            <div className="flex items-center gap-3">
                              <User className="w-4 h-4 text-gray-500" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">{record.inputData?.customerEmail || record.customerEmail}</p>
                                <p className="text-xs text-gray-600">E-post</p>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">{record.inputData?.customerAdress || record.customerAdress || 'Ej angett'}</p>
                              <p className="text-xs text-gray-600">Adress</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(record.createdAt), 'dd MMM yyyy', { locale: sv })}
                              </p>
                              <p className="text-xs text-gray-600">Skapad datum</p>
                            </div>
                          </div>
                        </div>

                        {record.notes && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Anteckningar</h4>
                            <p className="text-sm text-gray-700">{record.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Project Details */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Projektdetaljer</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <Euro className="w-4 h-4 text-blue-600" />
                              <span className="text-xs font-medium text-blue-700">Totalpris</span>
                            </div>
                            <p className="text-lg font-bold text-blue-900">{formatPrice(record.totalPrice)}</p>
                          </div>

                          <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">Yta</span>
                            </div>
                            <p className="text-lg font-bold text-green-900">{record.area} m²</p>
                          </div>

                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-purple-600" />
                              <span className="text-xs font-medium text-purple-700">Taktyp</span>
                            </div>
                            <p className="text-sm font-medium text-purple-900">{record.roofType}</p>
                          </div>

                          <div className="p-3 bg-orange-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                              <FileText className="w-4 h-4 text-orange-600" />
                              <span className="text-xs font-medium text-orange-700">Material</span>
                            </div>
                            <p className="text-sm font-medium text-orange-900">{record.materialType}</p>
                          </div>
                        </div>

                        {/* Customer Images */}
                        {record.imageFileUrls && record.imageFileUrls.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium flex items-center gap-2">
                              <Image className="w-4 h-4" />
                              Bilder ({record.imageFileUrls.length})
                            </h4>
                            <div className="grid grid-cols-2 gap-2">
                              {record.imageFileUrls.slice(0, 4).map((imageUrl, index) => (
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
                            {record.imageFileUrls.length > 4 && (
                              <p className="text-xs text-gray-500">
                                +{record.imageFileUrls.length - 4} fler bilder
                              </p>
                            )}
                          </div>
                        )}

                        {/* Calculation Link */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(`/revised-calculation/${record.calculationId}`, '_blank')}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Öppna Kalkyl #{record.calculationId}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </>
              )}
            </Card>
          ))}
        </div>

        {(!customerRecords?.calculations || customerRecords.calculations.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inga kunder ännu</h3>
              <p>Det finns inga kunder att visa just nu.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}