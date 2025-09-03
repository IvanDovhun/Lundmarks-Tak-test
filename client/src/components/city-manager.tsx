import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Edit, Trash2, Save, X } from 'lucide-react';
import { City } from '@shared/schema';

export function CityManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [newCityName, setNewCityName] = useState('');
  const [editCityName, setEditCityName] = useState('');

  // Fetch all cities
  const { data: cities = [], isLoading } = useQuery<City[]>({
    queryKey: ['/api/cities'],
  });

  // Create city mutation
  const createCityMutation = useMutation({
    mutationFn: async (name: string) => {
      const cityId = name.toLowerCase().replace(/[åäö]/g, (match) => {
        const map: { [key: string]: string } = { 'å': 'a', 'ä': 'a', 'ö': 'o' };
        return map[match] || match;
      }).replace(/\s+/g, '_');
      
      await apiRequest('/api/admin/cities', 'POST', {
        id: cityId,
        name: name,
        isActive: true,
      });
    },
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Stad skapad framgångsrikt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
      setIsAdding(false);
      setNewCityName('');
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte skapa stad",
        variant: "destructive",
      });
    },
  });

  // Update city mutation
  const updateCityMutation = useMutation({
    mutationFn: async ({ cityId, updates }: { cityId: string; updates: Partial<City> }) => {
      await apiRequest(`/api/admin/cities/${cityId}`, 'PUT', updates);
    },
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Stad uppdaterad framgångsrikt",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
      setEditingCity(null);
      setEditCityName('');
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera stad",
        variant: "destructive",
      });
    },
  });

  // Delete city mutation
  const deleteCityMutation = useMutation({
    mutationFn: async (cityId: string) => {
      await apiRequest(`/api/admin/cities/${cityId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Stad borttagen",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cities'] });
    },
    onError: () => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort stad",
        variant: "destructive",
      });
    },
  });

  const handleCreateCity = () => {
    if (newCityName.trim()) {
      createCityMutation.mutate(newCityName.trim());
    }
  };

  const handleEditCity = (city: City) => {
    setEditingCity(city);
    setEditCityName(city.name);
  };

  const handleUpdateCity = () => {
    if (editingCity && editCityName.trim()) {
      updateCityMutation.mutate({
        cityId: editingCity.id,
        updates: { name: editCityName.trim() },
      });
    }
  };

  const handleToggleActive = (city: City) => {
    updateCityMutation.mutate({
      cityId: city.id,
      updates: { isActive: !city.isActive },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hantera Städer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">Laddar...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Hantera Städer
        </CardTitle>
        <p className="text-sm text-gray-600">
          Lägg till och hantera städer som är tillgängliga för användare i systemet.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add New City */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">Lägg till ny stad</h3>
              {!isAdding && (
                <Button size="sm" onClick={() => setIsAdding(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Lägg till
                </Button>
              )}
            </div>
            
            {isAdding && (
              <div className="flex gap-2">
                <Input
                  placeholder="Stadnamn (t.ex. Stockholm)"
                  value={newCityName}
                  onChange={(e) => setNewCityName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateCity()}
                />
                <Button 
                  size="sm" 
                  onClick={handleCreateCity}
                  disabled={createCityMutation.isPending || !newCityName.trim()}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Spara
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsAdding(false);
                    setNewCityName('');
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Avbryt
                </Button>
              </div>
            )}
          </div>

          {/* Existing Cities */}
          <div className="space-y-3">
            {cities.map((city) => (
              <div key={city.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    
                    {editingCity?.id === city.id ? (
                      <Input
                        value={editCityName}
                        onChange={(e) => setEditCityName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUpdateCity()}
                        className="w-48"
                      />
                    ) : (
                      <div>
                        <h3 className="font-medium">{city.name}</h3>
                        <p className="text-sm text-gray-500">ID: {city.id}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={city.isActive}
                        onCheckedChange={() => handleToggleActive(city)}
                        disabled={updateCityMutation.isPending}
                      />
                      <Badge variant={city.isActive ? "default" : "secondary"}>
                        {city.isActive ? "Aktiv" : "Inaktiv"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {editingCity?.id === city.id ? (
                      <>
                        <Button 
                          size="sm" 
                          onClick={handleUpdateCity}
                          disabled={updateCityMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Spara
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => {
                            setEditingCity(null);
                            setEditCityName('');
                          }}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Avbryt
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleEditCity(city)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => deleteCityMutation.mutate(city.id)}
                          disabled={deleteCityMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {cities.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inga städer konfigurerade ännu</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}