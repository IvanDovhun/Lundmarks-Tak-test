import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { MapPin, Save, X } from 'lucide-react';
import { User, City } from '@shared/schema';

interface UserWithCityAccess extends User {
  accessibleCities: string[];
}

export function UserCityAccessManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedCityIds, setSelectedCityIds] = useState<string[]>([]);

  // Fetch all cities
  const { data: cities = [] } = useQuery<City[]>({
    queryKey: ['/api/cities'],
  });

  // Fetch users with their city access
  const { data: usersWithAccess = [], isLoading } = useQuery<UserWithCityAccess[]>({
    queryKey: ['/api/admin/users-city-access'],
  });

  // Update user city access mutation
  const updateAccessMutation = useMutation({
    mutationFn: async ({ userId, cityIds }: { userId: number; cityIds: string[] }) => {
      await apiRequest(`/api/admin/user-city-access/${userId}`, 'PUT', { cityIds });
    },
    onSuccess: () => {
      toast({
        title: "Framgång",
        description: "Användarens stadstillgång har uppdaterats",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users-city-access'] });
      setSelectedUserId(null);
      setSelectedCityIds([]);
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte uppdatera stadstillgång",
        variant: "destructive",
      });
    },
  });

  const handleEditUser = (user: UserWithCityAccess) => {
    setSelectedUserId(user.id);
    setSelectedCityIds(user.accessibleCities);
  };

  const handleSave = () => {
    if (selectedUserId) {
      updateAccessMutation.mutate({
        userId: selectedUserId,
        cityIds: selectedCityIds,
      });
    }
  };

  const handleCancel = () => {
    setSelectedUserId(null);
    setSelectedCityIds([]);
  };

  const handleCityToggle = (cityId: string) => {
    setSelectedCityIds(prev => 
      prev.includes(cityId) 
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Hantera Stadstillgång
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
          Hantera Stadstillgång för Användare
        </CardTitle>
        <p className="text-sm text-gray-600">
          Kontrollera vilka städer varje användare kan komma åt. Användare med tillgång till flera städer kommer att se en stadsväljare i navigeringen.
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usersWithAccess.map((user) => (
            <div key={user.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{user.name || user.username}</h3>
                  <p className="text-sm text-gray-600">
                    {user.role === 'head_admin' && 'Huvudadministratör'}
                    {user.role === 'sales_admin' && 'Säljchef'}
                    {user.role === 'project_admin' && 'Projektledare'}
                    {user.role === 'sales_person' && 'Säljare'}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {user.role === 'head_admin' ? (
                      <Badge variant="outline" className="text-xs">
                        Alla städer (Huvudadmin)
                      </Badge>
                    ) : user.accessibleCities.length > 0 ? (
                      user.accessibleCities.map(cityId => {
                        const city = cities.find(c => c.id === cityId);
                        return (
                          <Badge key={cityId} variant="outline" className="text-xs">
                            {city?.name || cityId}
                          </Badge>
                        );
                      })
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Ingen stadstillgång
                      </Badge>
                    )}
                  </div>
                </div>
                
                {user.role !== 'head_admin' && (
                  <div>
                    {selectedUserId === user.id ? (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={handleSave}
                          disabled={updateAccessMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Spara
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCancel}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Avbryt
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleEditUser(user)}
                      >
                        Redigera
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {selectedUserId === user.id && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-3">Välj tillgängliga städer:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {cities.filter(city => city.isActive).map((city) => (
                      <div key={city.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`city-${city.id}`}
                          checked={selectedCityIds.includes(city.id)}
                          onCheckedChange={() => handleCityToggle(city.id)}
                        />
                        <label 
                          htmlFor={`city-${city.id}`} 
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {city.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}