import React, { useState, useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FormDataSchemaType, formDataSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { PlusCircle, MinusCircle, Upload, FileText, Home, Calculator } from "lucide-react";
import { Link } from 'wouter';
import SignatureCanvas from 'react-signature-canvas';
import { z } from 'zod';

const initialFormData: FormDataSchemaType = {
  calculationId: 0,
  kundnummer: "",
  tel1: "",
  tel2: "",
  kundFirstName: "",
  kundLastName: "",
  address: "",
  startDatum: new Date(),
  slutDatum: new Date(),
  projektorFirstName: "",
  projektorLastName: "",
  projektorTel: "",
  projektledareFirstName: "",
  projektledareLastName: "",
  projektledareTel: "",
  lutning: 1,
  takbredd: 1,
  takfall: 1,
  takfotTillMark: 1,
  totalYta: 1,
  typAvTak: "Sadeltak",
  raspont: 0,
  valAvTakmaterial: "Plåt",
  farg: "Svart",
  snorasskydd: 0,
  placeringSnorasskydd: "",
  snorasskyddFarg: "",
  hangranna: 0,
  hangrannaFarg: "",
  ranndalar: 0,
  ranndalarFarg: "",
  fotplat: 0,
  fotplatFarg: "",
  vindskiveplat: 0,
  vindskiveplatFarg: "",
  stupror: 0,
  stuprorFarg: "",
  takstege: 0,
  takstegeFarg: "",
  avsatsSkorsten: "",
  skorsten: "Ingen",
  skorstenFarg: "",
  avluftning: 0,
  ventilation: 0,
  tillagg: {
    malaVindskivor: false,
    vaderskyddSkorsten: false,
  },
  ovrigt: "",
  kundFirstName2: "",
  kundLastName2: "",
  preliminarROT: 0,
};

export default function RevisedCalculationForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [showSignPlaceholder, setShowSignPlaceholder] = useState(true);
  const [formData, setFormData] = useState<FormDataSchemaType>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Get dealId from URL params or calculationId from route params
  const urlParams = new URLSearchParams(window.location.search);
  const dealId = urlParams.get('dealId');
  const [match, params] = useRoute('/revised-calculation/:id');
  const calculationId = params?.id;

  // Fetch deal data if dealId is provided
  const { data: dealData, isLoading: isDealLoading } = useQuery({
    queryKey: ['/api/deals', dealId],
    queryFn: async () => {
      if (!dealId) return null;
      const res = await fetch(`/api/deals/${dealId}`);
      if (!res.ok) throw new Error('Failed to fetch deal');
      return res.json();
    },
    enabled: !!dealId,
  });

  // Fetch calculation data if calculationId is provided (from project leader dashboard)
  const { data: calculationData, isLoading: isCalculationLoading } = useQuery({
    queryKey: ['/api/calculations', calculationId],
    queryFn: async () => {
      if (!calculationId) return null;
      const res = await fetch(`/api/calculations/${calculationId}`);
      if (!res.ok) throw new Error('Failed to fetch calculation');
      return res.json();
    },
    enabled: !!calculationId,
  });

  // Populate form data when deal data is loaded
  useEffect(() => {
    if (dealData) {
      let input = {};
      
      // Handle inputData - it might be a string or already an object
      if (dealData.inputData) {
        if (typeof dealData.inputData === 'string') {
          try {
            input = JSON.parse(dealData.inputData);
          } catch (e) {
            console.error('Failed to parse inputData string:', e);
            input = {};
          }
        } else {
          input = dealData.inputData;
        }
      }
      
      const customerNameParts = dealData.customerName?.split(' ') || [];
      const firstName = customerNameParts[0] || '';
      const lastName = customerNameParts.slice(1).join(' ') || '';
      
      console.log('Deal data loaded:', dealData);
      console.log('Parsed input data:', input);
      
      setFormData(prev => ({
        ...prev,
        calculationId: dealData.id,
        kundnummer: dealData.dealId || prev.kundnummer,
        kundFirstName: firstName,
        kundLastName: lastName,
        kundFirstName2: firstName,
        kundLastName2: lastName,
        address: dealData.adress || input.customerAdress || prev.address,
        tel1: input.tel1 || prev.tel1,
        // Map calculation data if available
        totalYta: input.area || prev.totalYta,
        typAvTak: input.roofType || prev.typAvTak,
        valAvTakmaterial: input.materialType || prev.valAvTakmaterial,
        farg: input.color || prev.farg,
        // Set default values for required numeric fields
        lutning: input.lutning || prev.lutning || 0,
        takbredd: input.takbredd || prev.takbredd || 0,
        takfall: input.takfall || prev.takfall || 0,
        takfotTillMark: input.takfotTillMark || prev.takfotTillMark || 0,
        raspont: input.raspont || prev.raspont || 0,
        // Default values for accessories
        snorasskydd: input.snorasskydd || prev.snorasskydd || 0,
        hangranna: input.hangranna || prev.hangranna || 0,
        ranndalar: input.ranndalar || prev.ranndalar || 0,
        fotplat: input.fotplat || prev.fotplat || 0,
        vindskiveplat: input.vindskiveplat || prev.vindskiveplat || 0,
        stupror: input.stupror || prev.stupror || 0,
        takstege: input.takstege || prev.takstege || 0,
        avluftning: input.avluftning || prev.avluftning || 0,
        ventilation: input.ventilation || prev.ventilation || 0,
        preliminarROT: input.preliminarROT || prev.preliminarROT || 0,
        // Set required select fields
        skorsten: input.skorsten || prev.skorsten || 'Ingen',
      }));
    }
  }, [dealData]);

  // Populate form data when calculation data is loaded (from project leader dashboard)
  useEffect(() => {
    if (calculationData) {
      console.log('Calculation data loaded:', calculationData);
      
      setFormData(prev => ({
        ...prev,
        calculationId: calculationData.id,
        kundnummer: calculationData.kundnummer || prev.kundnummer,
        kundFirstName: calculationData.kundFirstName || prev.kundFirstName,
        kundLastName: calculationData.kundLastName || prev.kundLastName,
        address: calculationData.address || prev.address,
        tel1: calculationData.tel1 || prev.tel1,
        tel2: calculationData.tel2 || prev.tel2,
        // Map all calculation fields
        totalYta: calculationData.totalYta || prev.totalYta,
        typAvTak: calculationData.typAvTak || prev.typAvTak,
        valAvTakmaterial: calculationData.valAvTakmaterial || prev.valAvTakmaterial,
        farg: calculationData.farg || prev.farg,
        lutning: calculationData.lutning || prev.lutning || 0,
        takbredd: calculationData.takbredd || prev.takbredd || 0,
        takfall: calculationData.takfall || prev.takfall || 0,
        takfotTillMark: calculationData.takfotTillMark || prev.takfotTillMark || 0,
        raspont: calculationData.raspont || prev.raspont || 0,
        snorasskydd: calculationData.snorasskydd || prev.snorasskydd || 0,
        hangranna: calculationData.hangranna || prev.hangranna || 0,
        ranndalar: calculationData.ranndalar || prev.ranndalar || 0,
        fotplat: calculationData.fotplat || prev.fotplat || 0,
        vindskiveplat: calculationData.vindskiveplat || prev.vindskiveplat || 0,
        stupror: calculationData.stupror || prev.stupror || 0,
        takstege: calculationData.takstege || prev.takstege || 0,
        avluftning: calculationData.avluftning || prev.avluftning || 0,
        ventilation: calculationData.ventilation || prev.ventilation || 0,
        preliminarROT: calculationData.preliminarROT || prev.preliminarROT || 0,
        skorsten: calculationData.skorsten || prev.skorsten || 'Ingen',
      }));
    }
  }, [calculationData]);

  const handleInputChange = (field: keyof FormDataSchemaType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTillaggChange = (field: keyof FormDataSchemaType['tillagg'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      tillagg: {
        ...prev.tillagg,
        [field]: value
      }
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async (data: FormDataSchemaType & { signature: string }) => {
      const res = await apiRequest("POST", "/api/project-form/submit", data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Kunde inte skicka formulär");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Projektering inskickad!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calculations"] });
      // Navigate to project management page with the project ID
      const projectId = data.projectId || data.id || dealId;
      navigate(`/project-management?id=${projectId}`);
    },
    onError: (error: Error) => {
      toast({
        title: "Inskickning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    try {
      formDataSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path) {
            newErrors[err.path.join('.')] = err.message;
          }
        });
        setErrors(newErrors);
        console.log('Form validation errors:', newErrors);
        console.log('Form data:', formData);
        toast({
          title: "Formulärfel",
          description: "Vänligen kontrollera alla obligatoriska fält",
          variant: "destructive",
        });
        return;
      }
    }

    // Get signature
    const signature = sigPadRef.current?.toDataURL();
    if (!signature || sigPadRef.current?.isEmpty()) {
      toast({
        title: "Signatur krävs",
        description: "Vänligen signera formuläret",
        variant: "destructive",
      });
      return;
    }

    submitMutation.mutate({ ...formData, signature });
  };

  const clearSignature = () => {
    sigPadRef.current?.clear();
    setShowSignPlaceholder(true);
  };

  if (isDealLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laddar affärsdata...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LUNDMARKS</h1>
                  <p className="text-sm text-gray-500">TAK & MONTAGE</p>
                </div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Projekteringsmall</h2>
                {dealData && (
                  <p className="text-sm text-gray-500">
                    Affär: {dealData.customerName} - {dealData.dealId || `#${dealData.id}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link href="/deals">
                <Button variant="outline">
                  <Home className="w-4 h-4 mr-2" />
                  Tillbaka
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Kontaktuppgifter</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="kundnummer">Kundnummer</Label>
                  <Input
                    id="kundnummer"
                    placeholder="Exempel: P1000"
                    value={formData.kundnummer}
                    onChange={(e) => handleInputChange('kundnummer', e.target.value)}
                    className={errors.kundnummer ? 'border-red-500' : ''}
                  />
                  {errors.kundnummer && <p className="text-red-500 text-sm mt-1">{errors.kundnummer}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tel1">Tel 1</Label>
                  <Input
                    id="tel1"
                    placeholder="(000) 000-0000"
                    value={formData.tel1}
                    onChange={(e) => handleInputChange('tel1', e.target.value)}
                    className={errors.tel1 ? 'border-red-500' : ''}
                  />
                  {errors.tel1 && <p className="text-red-500 text-sm mt-1">{errors.tel1}</p>}
                  <p className="text-sm text-gray-500 mt-1">Vänligen skriv ett giltigt telefonnummer.</p>
                </div>
                <div>
                  <Label htmlFor="tel2">Tel 2</Label>
                  <Input
                    id="tel2"
                    placeholder="(000) 000-0000"
                    value={formData.tel2}
                    onChange={(e) => handleInputChange('tel2', e.target.value)}
                    className={errors.tel2 ? 'border-red-500' : ''}
                  />
                  {errors.tel2 && <p className="text-red-500 text-sm mt-1">{errors.tel2}</p>}
                  <p className="text-sm text-gray-500 mt-1">Vänligen skriv ett giltigt telefonnummer.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Kund</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kundFirstName">Förnamn</Label>
                    <Input
                      id="kundFirstName"
                      value={formData.kundFirstName}
                      onChange={(e) => handleInputChange('kundFirstName', e.target.value)}
                      className={errors.kundFirstName ? 'border-red-500' : ''}
                    />
                    {errors.kundFirstName && <p className="text-red-500 text-sm mt-1">{errors.kundFirstName}</p>}
                  </div>
                  <div>
                    <Label htmlFor="kundLastName">Efternamn</Label>
                    <Input
                      id="kundLastName"
                      value={formData.kundLastName}
                      onChange={(e) => handleInputChange('kundLastName', e.target.value)}
                      className={errors.kundLastName ? 'border-red-500' : ''}
                    />
                    {errors.kundLastName && <p className="text-red-500 text-sm mt-1">{errors.kundLastName}</p>}
                  </div>
                </div>
                <div>
                  <Label htmlFor="kundAdress">Adress</Label>
                  <Input
                    id="kundAdress"
                    placeholder="Gata, Postnummer, Stad"
                    value={formData.kundAdress}
                    onChange={(e) => handleInputChange('kundAdress', e.target.value)}
                    className={errors.kundAdress ? 'border-red-500' : ''}
                  />
                  {errors.kundAdress && <p className="text-red-500 text-sm mt-1">{errors.kundAdress}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Projektör</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projektorFirstName">Förnamn</Label>
                    <Input
                      id="projektorFirstName"
                      value={formData.projektorFirstName}
                      onChange={(e) => handleInputChange('projektorFirstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="projektorLastName">Efternamn</Label>
                    <Input
                      id="projektorLastName"
                      value={formData.projektorLastName}
                      onChange={(e) => handleInputChange('projektorLastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="projektorTel">Telefonnummer</Label>
                  <Input
                    id="projektorTel"
                    placeholder="(000) 000-0000"
                    value={formData.projektorTel}
                    onChange={(e) => handleInputChange('projektorTel', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Vänligen skriv ett giltigt telefonnummer.</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Projektledare</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="projektledareFirstName">Förnamn</Label>
                    <Input
                      id="projektledareFirstName"
                      value={formData.projektledareFirstName}
                      onChange={(e) => handleInputChange('projektledareFirstName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="projektledareLastName">Efternamn</Label>
                    <Input
                      id="projektledareLastName"
                      value={formData.projektledareLastName}
                      onChange={(e) => handleInputChange('projektledareLastName', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="projektledareTel">Telefonnummer</Label>
                  <Input
                    id="projektledareTel"
                    placeholder="(000) 000-0000"
                    value={formData.projektledareTel}
                    onChange={(e) => handleInputChange('projektledareTel', e.target.value)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Vänligen skriv ett giltigt telefonnummer.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Roof Measurements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="w-5 h-5" />
                <span>Takmätningar</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lutning">Lutning</Label>
                  <Input
                    id="lutning"
                    type="number"
                    placeholder="Takfall i grader"
                    value={formData.lutning || ''}
                    onChange={(e) => handleInputChange('lutning', parseFloat(e.target.value) || 0)}
                    className={errors.lutning ? 'border-red-500' : ''}
                  />
                  {errors.lutning && <p className="text-red-500 text-sm mt-1">{errors.lutning}</p>}
                </div>
                <div>
                  <Label htmlFor="takbredd">Takbredd</Label>
                  <Input
                    id="takbredd"
                    type="number"
                    placeholder="Meter"
                    value={formData.takbredd || ''}
                    onChange={(e) => handleInputChange('takbredd', parseFloat(e.target.value) || 0)}
                    className={errors.takbredd ? 'border-red-500' : ''}
                  />
                  {errors.takbredd && <p className="text-red-500 text-sm mt-1">{errors.takbredd}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="takfall">Takfall</Label>
                  <Input
                    id="takfall"
                    type="number"
                    placeholder="Meter"
                    value={formData.takfall || ''}
                    onChange={(e) => handleInputChange('takfall', parseFloat(e.target.value) || 0)}
                    className={errors.takfall ? 'border-red-500' : ''}
                  />
                  {errors.takfall && <p className="text-red-500 text-sm mt-1">{errors.takfall}</p>}
                </div>
                <div>
                  <Label htmlFor="takfotTillMark">Takfot till mark</Label>
                  <Input
                    id="takfotTillMark"
                    type="number"
                    placeholder="Meter"
                    value={formData.takfotTillMark || ''}
                    onChange={(e) => handleInputChange('takfotTillMark', parseFloat(e.target.value) || 0)}
                    className={errors.takfotTillMark ? 'border-red-500' : ''}
                  />
                  {errors.takfotTillMark && <p className="text-red-500 text-sm mt-1">{errors.takfotTillMark}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalYta">Total yta</Label>
                  <Input
                    id="totalYta"
                    type="number"
                    placeholder="kvm"
                    value={formData.totalYta || ''}
                    onChange={(e) => handleInputChange('totalYta', parseFloat(e.target.value) || 0)}
                    className={errors.totalYta ? 'border-red-500' : ''}
                  />
                  {errors.totalYta && <p className="text-red-500 text-sm mt-1">{errors.totalYta}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Vilken typ av fasad</Label>
                  <RadioGroup
                    value={formData.fasadTyp}
                    onValueChange={(value) => handleInputChange('fasadTyp', value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Trä" id="tra" />
                      <Label htmlFor="tra">Trä</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Tegel" id="tegel" />
                      <Label htmlFor="tegel">Tegel</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div>
                  <Label htmlFor="typAvTak">Typ av tak</Label>
                  <Select value={formData.typAvTak} onValueChange={(value) => handleInputChange('typAvTak', value)}>
                    <SelectTrigger className={errors.typAvTak ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sadeltak">Sadeltak</SelectItem>
                      <SelectItem value="Valmat tak">Valmat tak</SelectItem>
                      <SelectItem value="Pulpettak">Pulpettak</SelectItem>
                      <SelectItem value="Mansardtak">Mansardtak</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.typAvTak && <p className="text-red-500 text-sm mt-1">{errors.typAvTak}</p>}
                </div>

                <div>
                  <Label>Underlagspapp</Label>
                  <RadioGroup
                    value={formData.underlagspapp}
                    onValueChange={(value) => handleInputChange('underlagspapp', value)}
                    className="flex space-x-4 mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Trampsäkerduk" id="trampsakerduk" />
                      <Label htmlFor="trampsakerduk">Trampsäkerduk</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="Underlagspapp RAW" id="underlagspapp-raw" />
                      <Label htmlFor="underlagspapp-raw">Underlagspapp RAW</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials and Accessories */}
          <Card>
            <CardHeader>
              <CardTitle>Material och Tillbehör</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="raspont">Råspont</Label>
                  <Input
                    id="raspont"
                    type="number"
                    placeholder="kvm"
                    value={formData.raspont || ''}
                    onChange={(e) => handleInputChange('raspont', parseFloat(e.target.value) || 0)}
                    className={errors.raspont ? 'border-red-500' : ''}
                  />
                  {errors.raspont && <p className="text-red-500 text-sm mt-1">{errors.raspont}</p>}
                </div>
                <div>
                  <Label htmlFor="snorasskydd">Snörasskydd</Label>
                  <Input
                    id="snorasskydd"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.snorasskydd || ''}
                    onChange={(e) => handleInputChange('snorasskydd', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Meter</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hangranna">Hängränna</Label>
                  <Input
                    id="hangranna"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.hangranna || ''}
                    onChange={(e) => handleInputChange('hangranna', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Meter</p>
                </div>
                <div>
                  <Label htmlFor="ranndalar">Ränndalar</Label>
                  <Input
                    id="ranndalar"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.ranndalar || ''}
                    onChange={(e) => handleInputChange('ranndalar', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Meter</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fotplat">Fotplåt</Label>
                  <Input
                    id="fotplat"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.fotplat || ''}
                    onChange={(e) => handleInputChange('fotplat', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Meter</p>
                </div>
                <div>
                  <Label htmlFor="vindskiveplat">Vindskiveplåt</Label>
                  <Input
                    id="vindskiveplat"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.vindskiveplat || ''}
                    onChange={(e) => handleInputChange('vindskiveplat', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Meter</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stupror">Stuprör</Label>
                  <Input
                    id="stupror"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.stupror || ''}
                    onChange={(e) => handleInputChange('stupror', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Antal</p>
                </div>
                <div>
                  <Label htmlFor="lovsilar">Lövsilar</Label>
                  <Input
                    id="lovsilar"
                    placeholder="Antal och vilken typ (självrensande, renstratt)"
                    value={formData.lovsilar}
                    onChange={(e) => handleInputChange('lovsilar', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="takstege">Takstege</Label>
                  <Select value={formData.takstege.toString()} onValueChange={(value) => handleInputChange('takstege', parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Ingen</SelectItem>
                      <SelectItem value="1">1 meter</SelectItem>
                      <SelectItem value="2">2 meter</SelectItem>
                      <SelectItem value="3">3 meter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="avsatsSkorsten">Avsats skorsten</Label>
                  <Select value={formData.avsatsSkorsten} onValueChange={(value) => handleInputChange('avsatsSkorsten', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ja">Ja</SelectItem>
                      <SelectItem value="Nej">Nej</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Chimney and Ventilation */}
          <Card>
            <CardHeader>
              <CardTitle>Skorsten och Ventilation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Skorsten</Label>
                <RadioGroup
                  value={formData.skorsten}
                  onValueChange={(value) => handleInputChange('skorsten', value)}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Hel (1m hög)" id="hel" />
                    <Label htmlFor="hel">Hel (1m hög)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Halv" id="halv" />
                    <Label htmlFor="halv">Halv</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Ingen" id="ingen" />
                    <Label htmlFor="ingen">Ingen</Label>
                  </div>
                </RadioGroup>
                {errors.skorsten && <p className="text-red-500 text-sm mt-1">{errors.skorsten}</p>}
              </div>

              <div>
                <Label htmlFor="skorstenFarg">Färg skorsten, avluftning och ventilation</Label>
                <Select value={formData.skorstenFarg} onValueChange={(value) => handleInputChange('skorstenFarg', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Vänligen Välj" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Svart">Svart</SelectItem>
                    <SelectItem value="Brun">Brun</SelectItem>
                    <SelectItem value="Grå">Grå</SelectItem>
                    <SelectItem value="Röd">Röd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="avluftning">Avluftning</Label>
                  <Input
                    id="avluftning"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.avluftning || ''}
                    onChange={(e) => handleInputChange('avluftning', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Antal</p>
                </div>
                <div>
                  <Label htmlFor="ventilation">Ventilation</Label>
                  <Input
                    id="ventilation"
                    type="number"
                    placeholder="t.ex. 23"
                    value={formData.ventilation || ''}
                    onChange={(e) => handleInputChange('ventilation', parseFloat(e.target.value) || 0)}
                  />
                  <p className="text-sm text-gray-500 mt-1">Antal</p>
                </div>
              </div>

              <div>
                <Label>Tillägg plåtslagare</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="platslucka"
                      checked={formData.tillagg.malaVindskivor}
                      onCheckedChange={(checked) => handleTillaggChange('malaVindskivor', checked as boolean)}
                    />
                    <Label htmlFor="platslucka">Plåtlucka</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="vaderskydd"
                      checked={formData.tillagg.vaderskyddSkorsten}
                      onCheckedChange={(checked) => handleTillaggChange('vaderskyddSkorsten', checked as boolean)}
                    />
                    <Label htmlFor="vaderskydd">Väderskydd till skorsten</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Materials and Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Material och Färgval</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="valAvTakmaterial">Val av takmaterial</Label>
                <Select value={formData.valAvTakmaterial} onValueChange={(value) => handleInputChange('valAvTakmaterial', value)}>
                  <SelectTrigger className={errors.valAvTakmaterial ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Vänligen Välj" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Plåt">Plåt</SelectItem>
                    <SelectItem value="Betong">Betong</SelectItem>
                    <SelectItem value="Tegel">Tegel</SelectItem>
                    <SelectItem value="Skiffer">Skiffer</SelectItem>
                  </SelectContent>
                </Select>
                {errors.valAvTakmaterial && <p className="text-red-500 text-sm mt-1">{errors.valAvTakmaterial}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="farg">Takmaterial färg</Label>
                  <Select value={formData.farg} onValueChange={(value) => handleInputChange('farg', value)}>
                    <SelectTrigger className={errors.farg ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Röd">Röd</SelectItem>
                      <SelectItem value="Blå">Blå</SelectItem>
                      <SelectItem value="Grön">Grön</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.farg && <p className="text-red-500 text-sm mt-1">{errors.farg}</p>}
                </div>
                <div>
                  <Label htmlFor="hangrannaFarg">Hängränna Färg</Label>
                  <Select value={formData.hangrannaFarg} onValueChange={(value) => handleInputChange('hangrannaFarg', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Vit">Vit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stuprorFarg">Stuprör färg</Label>
                  <Select value={formData.stuprorFarg} onValueChange={(value) => handleInputChange('stuprorFarg', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Vit">Vit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="fotplatFarg">Fotplåt Färg</Label>
                  <Select value={formData.fotplatFarg} onValueChange={(value) => handleInputChange('fotplatFarg', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Vit">Vit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vindskiveplatFarg">Vindskiveplåt färg</Label>
                  <Select value={formData.vindskiveplatFarg} onValueChange={(value) => handleInputChange('vindskiveplatFarg', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Vit">Vit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ranndalarFarg">Ränndalar Färg</Label>
                  <Select value={formData.ranndalarFarg} onValueChange={(value) => handleInputChange('ranndalarFarg', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Vit">Vit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="snorasskyddFarg">Snörasskydd Färg</Label>
                  <Select value={formData.snorasskyddFarg} onValueChange={(value) => handleInputChange('snorasskyddFarg', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Vänligen Välj" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Svart">Svart</SelectItem>
                      <SelectItem value="Brun">Brun</SelectItem>
                      <SelectItem value="Grå">Grå</SelectItem>
                      <SelectItem value="Vit">Vit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="placeringSnorasskydd">Placering Snörasskydd</Label>
                  <Input
                    id="placeringSnorasskydd"
                    value={formData.placeringSnorasskydd}
                    onChange={(e) => handleInputChange('placeringSnorasskydd', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Services */}
          <Card>
            <CardHeader>
              <CardTitle>Tillägg och Övrigt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>Tillägg</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mala-vindskivor" />
                      <Label htmlFor="mala-vindskivor">Måla vindskivor VIT (+5200kr)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="mala-vindskivor-svart" />
                      <Label htmlFor="mala-vindskivor-svart">Måla vindskivor SVART (+5200kr)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="glidskydd" />
                      <Label htmlFor="glidskydd">Glidskydd (till takstege)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="personalbod" />
                      <Label htmlFor="personalbod">Personalbod (+4000kr)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="tillagg-ovrigt" />
                      <Label htmlFor="tillagg-ovrigt">Tillägg i Övrigt</Label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bortforsling">Bortforsling</Label>
                    <Select value={formData.bortforsling} onValueChange={(value) => handleInputChange('bortforsling', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vänligen Välj" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ja">Ja</SelectItem>
                        <SelectItem value="Nej">Nej</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="rivning">Rivning</Label>
                    <Select value={formData.rivning} onValueChange={(value) => handleInputChange('rivning', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vänligen Välj" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ja">Ja</SelectItem>
                        <SelectItem value="Nej">Nej</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="ovrigt">Övrigt</Label>
                  <Textarea
                    id="ovrigt"
                    placeholder="Övriga kommentarer..."
                    value={formData.ovrigt}
                    onChange={(e) => handleInputChange('ovrigt', e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signature and Submit */}
          <Card>
            <CardHeader>
              <CardTitle>Signatur och Slutförande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Undertecknas av</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="kundFirstName2">Förnamn</Label>
                    <Input
                      id="kundFirstName2"
                      value={formData.kundFirstName2}
                      onChange={(e) => handleInputChange('kundFirstName2', e.target.value)}
                      className={errors.kundFirstName2 ? 'border-red-500' : ''}
                    />
                    {errors.kundFirstName2 && <p className="text-red-500 text-sm mt-1">{errors.kundFirstName2}</p>}
                  </div>
                  <div>
                    <Label htmlFor="kundLastName2">Efternamn</Label>
                    <Input
                      id="kundLastName2"
                      value={formData.kundLastName2}
                      onChange={(e) => handleInputChange('kundLastName2', e.target.value)}
                      className={errors.kundLastName2 ? 'border-red-500' : ''}
                    />
                    {errors.kundLastName2 && <p className="text-red-500 text-sm mt-1">{errors.kundLastName2}</p>}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="preliminarROT">Preliminärt ROT-avdrag (kr)</Label>
                <Input
                  id="preliminarROT"
                  type="number"
                  placeholder="t.ex. 23"
                  value={formData.preliminarROT || ''}
                  onChange={(e) => handleInputChange('preliminarROT', parseFloat(e.target.value) || 0)}
                  className={errors.preliminarROT ? 'border-red-500' : ''}
                />
                {errors.preliminarROT && <p className="text-red-500 text-sm mt-1">{errors.preliminarROT}</p>}
                <p className="text-sm text-gray-500 mt-2">
                  Kunden godkänner att ett preliminärt ROT-avdrag motsvarande ovanstående belopp kommer att sökas. 
                  Om Skatteverket helt eller delvis avslår ROT-avdraget förbinder sig kunden att betala det nekade beloppet 
                  till Lundmarks Tak & Montage AB.
                </p>
              </div>

              <div>
                <Label>Signatur</Label>
                <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
                  <div className="relative">
                    <SignatureCanvas
                      ref={sigPadRef}
                      canvasProps={{
                        width: 400,
                        height: 200,
                        className: 'signature-canvas w-full h-48 border rounded'
                      }}
                      onBegin={() => setShowSignPlaceholder(false)}
                    />
                    {showSignPlaceholder && (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                        <p>Signera här</p>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                      Rensa
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={() => navigate("/deals")}>
                  Avbryt
                </Button>
                <Button type="submit" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? "Skickar..." : "Skicka in"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </main>
    </div>
  );
}