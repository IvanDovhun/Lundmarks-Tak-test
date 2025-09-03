import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Settings, Save, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import RoleImpersonationBar from '@/components/ui/role-impersonation-bar';

export default function SystemSettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect if not head_admin
  if (!user || user.role !== 'head_admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center text-red-600 mb-4">
              <Settings size={48} className="mx-auto mb-2" />
              <h2 className="text-xl font-semibold">Åtkomst nekad</h2>
              <p className="text-gray-600 mt-2">Endast teknikadministratörer har tillgång till systeminställningar.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Query for location dropdown setting
  const { data: locationDropdownEnabled, isLoading } = useQuery({
    queryKey: ['/api/admin/settings/location_dropdown_enabled'],
  });

  // Mutation to update settings
  const updateSettingMutation = useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string; settingValue: boolean }) => {
      return await apiRequest(`/api/admin/settings/${settingKey}`, {
        method: 'PUT',
        body: { settingValue },
      });
    },
    onSuccess: () => {
      toast({
        title: "Inställning uppdaterad",
        description: "Systeminställningen har sparats framgångsrikt.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/settings/location_dropdown_enabled'] });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte spara systeminställningen. Försök igen.",
        variant: "destructive",
      });
      console.error("Error updating setting:", error);
    },
  });

  const handleLocationDropdownToggle = (enabled: boolean) => {
    updateSettingMutation.mutate({
      settingKey: 'location_dropdown_enabled',
      settingValue: enabled,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Settings className="animate-spin h-8 w-8 mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Laddar systeminställningar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleImpersonationBar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Systeminställningar</h1>
          </div>
          <p className="text-gray-600">Hantera systemfunktioner och funktionalitet för alla användare.</p>
        </div>

        <div className="grid gap-6 max-w-4xl">
          {/* User Interface Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Användarinterfaceinställningar
              </CardTitle>
              <CardDescription>
                Kontrollera vilka UI-komponenter som visas för olika användarroller.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Platsväljare (Städer)</Label>
                  <div className="text-sm text-gray-600">
                    Visa stadsdropdown i navigeringsmenyn för säljadmin och projektadmin roller.
                    Säljare och andra roller ser aldrig denna funktion.
                  </div>
                </div>
                <Switch
                  checked={locationDropdownEnabled === true}
                  onCheckedChange={handleLocationDropdownToggle}
                  disabled={updateSettingMutation.isPending}
                />
              </div>
              
              <div className="pt-4 border-t">
                <div className="text-xs text-gray-500 space-y-1">
                  <p><strong>Säljadmin & Projektadmin:</strong> Kan se stadsdropdown när funktionen är aktiverad</p>
                  <p><strong>Säljare & andra roller:</strong> Ser aldrig stadsdropdown oavsett inställning</p>
                  <p><strong>Status:</strong> {locationDropdownEnabled ? 'Aktiverad' : 'Inaktiverad'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Future Settings Placeholder */}
          <Card className="opacity-60">
            <CardHeader>
              <CardTitle>Ytterligare inställningar</CardTitle>
              <CardDescription>
                Fler systeminställningar kommer att läggas till här i framtiden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-500 space-y-2">
                <p>• Rapportinställningar</p>
                <p>• Notifikationskonfiguration</p>
                <p>• Användarroller och behörigheter</p>
                <p>• Systemintegrationsinställningar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Save Status */}
        {updateSettingMutation.isPending && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <Save className="h-4 w-4 animate-spin" />
            Sparar inställningar...
          </div>
        )}
      </div>
    </div>
  );
}