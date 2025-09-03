import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { User, Lock, Save, Eye, EyeOff, Shield, Settings, MapPin } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import Navbar from '@/components/ui/navbar';

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState<PasswordChangeData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for location dropdown setting (only for head_admin)
  const { data: locationDropdownEnabled, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/admin/settings/location_dropdown_enabled'],
    enabled: user?.role === 'head_admin', // Only fetch for head_admin
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      if (data.newPassword !== data.confirmPassword) {
        throw new Error('Lösenorden matchar inte');
      }
      if (data.newPassword.length < 6) {
        throw new Error('Lösenordet måste vara minst 6 tecken');
      }
      return apiRequest('/api/user/change-password', 'POST', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    },
    onSuccess: () => {
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      toast({
        title: "Lösenord ändrat",
        description: "Ditt lösenord har uppdaterats framgångsrikt.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fel",
        description: error.message || "Kunde inte ändra lösenord. Kontrollera att nuvarande lösenord är korrekt.",
        variant: "destructive",
      });
    },
  });

  // System settings mutation (only for head_admin)
  const updateSystemSettingMutation = useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string; settingValue: boolean }) => {
      return await apiRequest(`/api/admin/settings/${settingKey}`, 'PUT', { settingValue });
    },
    onSuccess: () => {
      toast({
        title: "Systeminställning uppdaterad",
        description: "Inställningen har sparats framgångsrikt.",
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

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    changePasswordMutation.mutate(passwordData);
  };

  const handlePasswordInputChange = (field: keyof PasswordChangeData, value: string) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleLocationDropdownToggle = (enabled: boolean) => {
    updateSystemSettingMutation.mutate({
      settingKey: 'location_dropdown_enabled',
      settingValue: enabled,
    });
  };

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <User className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Min Profil</h1>
        </div>

        <Tabs defaultValue="profile" className="max-w-4xl">
          <TabsList className={`grid w-full ${user?.role === 'head_admin' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <TabsTrigger value="profile">Profil</TabsTrigger>
            {user?.role === 'head_admin' && (
              <TabsTrigger value="system">Systeminställningar</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <div className="grid gap-6 max-w-2xl">
        {/* User Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Användarinformation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Användarnamn</Label>
                <Input
                  id="username"
                  value={user?.username || ''}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div>
                <Label htmlFor="role">Roll</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    id="role"
                    value={user?.isAdmin ? 'Administratör' : 'Användare'}
                    disabled
                    className="bg-gray-50"
                  />
                  {user?.isAdmin && (
                    <Shield className="w-4 h-4 text-yellow-500" />
                  )}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
              <p><strong>Information:</strong> Användarnamn och roll kan endast ändras av en administratör.</p>
            </div>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="w-5 h-5 mr-2" />
              Ändra lösenord
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <Label htmlFor="current-password">Nuvarande lösenord</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => handlePasswordInputChange('currentPassword', e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="new-password">Nytt lösenord</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordInputChange('newPassword', e.target.value)}
                    required
                    minLength={6}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Lösenordet måste vara minst 6 tecken långt.
                </p>
              </div>

              <div>
                <Label htmlFor="confirm-password">Bekräfta nytt lösenord</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange('confirmPassword', e.target.value)}
                    required
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {passwordData.newPassword && passwordData.confirmPassword && 
                 passwordData.newPassword !== passwordData.confirmPassword && (
                  <p className="text-sm text-red-600 mt-1">
                    Lösenorden matchar inte.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={
                  changePasswordMutation.isPending ||
                  !passwordData.currentPassword ||
                  !passwordData.newPassword ||
                  !passwordData.confirmPassword ||
                  passwordData.newPassword !== passwordData.confirmPassword
                }
                className="w-full"
              >
                {changePasswordMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Ändrar lösenord...
                  </div>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Ändra lösenord
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Kontostatistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">Skapade kalkyler</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">Avslutade affärer</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-sm text-gray-600">Aktiva projekt</div>
              </div>
            </div>
          </CardContent>
        </Card>
            </div>
          </TabsContent>

          {/* System Settings Tab - Only for head_admin */}
          {user?.role === 'head_admin' && (
            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Systeminställningar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Användarinterfaceinställningar</h3>
                    <p className="text-sm text-gray-600">
                      Kontrollera vilka UI-komponenter som visas för olika användarroller.
                    </p>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <Label className="text-base font-medium">Platsväljare (Städer)</Label>
                        </div>
                        <div className="text-sm text-gray-600">
                          Visa stadsdropdown i navigeringsmenyn för säljadmin och projektadmin roller.
                          Säljare och andra roller ser aldrig denna funktion.
                        </div>
                      </div>
                      <Switch
                        checked={locationDropdownEnabled === true}
                        onCheckedChange={handleLocationDropdownToggle}
                        disabled={updateSystemSettingMutation.isPending || settingsLoading}
                      />
                    </div>
                    
                    {settingsLoading && (
                      <div className="text-center py-4">
                        <Settings className="animate-spin h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-600">Laddar systeminställningar...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </>
  );
}