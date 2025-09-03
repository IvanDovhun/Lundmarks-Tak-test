import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Settings, DollarSign, Wrench, Building, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import Navbar from '@/components/ui/navbar';

interface PriceItem {
  id: string;
  name: string;
  materialCost: number;
  laborCost: number;
  unit: string;
}

interface ConfigItem {
  id: string;
  name: string;
  isActive: boolean;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('prices');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch price data
  const { data: prices, isLoading: pricesLoading } = useQuery<PriceItem[]>({
    queryKey: ['/api/settings/prices'],
  });

  // Fetch configuration data
  const { data: roofTypes } = useQuery<ConfigItem[]>({
    queryKey: ['/api/settings/roof-types'],
  });

  const { data: materialTypes } = useQuery<ConfigItem[]>({
    queryKey: ['/api/settings/material-types'],
  });

  const { data: scaffoldingSizes } = useQuery<ConfigItem[]>({
    queryKey: ['/api/settings/scaffolding-sizes'],
  });

  // Mutations
  const updatePriceMutation = useMutation({
    mutationFn: async (data: PriceItem) => {
      return apiRequest(`/api/settings/prices/${data.id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/prices'] });
      setEditingItem(null);
      toast({
        title: "Pris uppdaterat",
        description: "Prislistan har uppdaterats framgångsrikt.",
      });
    },
  });

  const createConfigMutation = useMutation({
    mutationFn: async ({ type, data }: { type: string; data: any }) => {
      return apiRequest(`/api/settings/${type}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/settings/${variables.type}`] });
      setIsAddingNew(false);
      toast({
        title: "Objekt skapat",
        description: "Nytt objekt har lagts till framgångsrikt.",
      });
    },
  });

  const renderPricesTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Prislista</h2>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Lägg till pris
        </Button>
      </div>

      <div className="grid gap-4">
        {pricesLoading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          prices?.map((price) => (
            <Card key={price.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{price.name}</h3>
                      <Badge variant="outline">{price.unit}</Badge>
                    </div>
                    <div className="flex items-center gap-6 mt-2">
                      <div className="text-sm">
                        <span className="text-gray-600">Material:</span>
                        <span className="ml-1 font-medium">{price.materialCost.toLocaleString()} kr</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600">Arbete:</span>
                        <span className="ml-1 font-medium">{price.laborCost.toLocaleString()} kr</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(price)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Redigera
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );

  const renderConfigTab = (title: string, data: ConfigItem[] | undefined, type: string) => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <Button onClick={() => setIsAddingNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Lägg till {title.toLowerCase()}
        </Button>
      </div>

      <div className="grid gap-4">
        {data?.map((item) => (
          <Card key={item.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{item.name}</h3>
                  <Badge variant={item.isActive ? "default" : "secondary"}>
                    {item.isActive ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(item)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Redigera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Ta bort
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSystemTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Systeminställningar</h2>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Företagsinformation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company-name">Företagsnamn</Label>
                <Input
                  id="company-name"
                  defaultValue="Lundmarks Tak & Montage"
                />
              </div>
              <div>
                <Label htmlFor="org-number">Organisationsnummer</Label>
                <Input
                  id="org-number"
                  defaultValue="559999-9999"
                />
              </div>
              <div>
                <Label htmlFor="address">Adress</Label>
                <Input
                  id="address"
                  defaultValue="Företagsgatan 1"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  defaultValue="08-123 456 78"
                />
              </div>
            </div>
            <Button className="w-full">
              <Save className="w-4 h-4 mr-2" />
              Spara ändringar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifikationsinställningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Följ upp-påminnelser</Label>
                <p className="text-sm text-gray-600">
                  Automatiska påminnelser var 2:a vecka för väntande affärer
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Projektnotifikationer</Label>
                <p className="text-sm text-gray-600">
                  Notifiera projektledare när affärer blir redo för projektering
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Materialbeställningar</Label>
                <p className="text-sm text-gray-600">
                  Notifiera vid nya materialbeställningar från Beijer Bygg
                </p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Inställningar</h1>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="prices" className="flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Priser
          </TabsTrigger>
          <TabsTrigger value="roofTypes" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Taktyper
          </TabsTrigger>
          <TabsTrigger value="materials" className="flex items-center gap-2">
            <Wrench className="w-4 h-4" />
            Material
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            System
          </TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-6">
          {renderPricesTab()}
        </TabsContent>

        <TabsContent value="roofTypes" className="space-y-6">
          {renderConfigTab("Taktyper", roofTypes, "roof-types")}
        </TabsContent>

        <TabsContent value="materials" className="space-y-6">
          {renderConfigTab("Materialtyper", materialTypes, "material-types")}
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          {renderSystemTab()}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}