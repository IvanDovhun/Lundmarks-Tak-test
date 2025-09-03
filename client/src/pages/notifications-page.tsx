import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
  Bell, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Users, 
  Calendar,
  Settings,
  X,
  Eye,
  BellOff
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import Navbar from '@/components/ui/navbar';

interface Notification {
  id: number;
  type: 'follow_up' | 'deal_status' | 'project_update' | 'material_request' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  relatedId?: number;
  relatedType?: string;
  createdAt: string;
  scheduledFor?: string;
}

interface NotificationSettings {
  followUpReminders: boolean;
  dealStatusChanges: boolean;
  projectUpdates: boolean;
  materialRequests: boolean;
  systemAlerts: boolean;
  emailNotifications: boolean;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('notifications');
  const [filterType, setFilterType] = useState<string>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch notifications
  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Poll every 30 seconds
  });

  // Fetch notification settings
  const { data: settings } = useQuery<NotificationSettings>({
    queryKey: ['/api/notifications/settings'],
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/settings'] });
      toast({
        title: "Inställningar sparade",
        description: "Dina notifikationsinställningar har uppdaterats.",
      });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'follow_up':
        return <Clock className="w-5 h-5 text-orange-500" />;
      case 'deal_status':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'project_update':
        return <Users className="w-5 h-5 text-blue-500" />;
      case 'material_request':
        return <AlertCircle className="w-5 h-5 text-purple-500" />;
      case 'system':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredNotifications = notifications?.filter(notification => {
    if (filterType === 'all') return true;
    if (filterType === 'unread') return !notification.isRead;
    return notification.type === filterType;
  });

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-semibold">Notifikationer</h2>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-blue-600">
              {notifications?.filter(n => !n.isRead).length || 0} olästa
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setFilterType('all')}>
            Alla
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterType('unread')}>
            Olästa
          </Button>
          <Button variant="outline" size="sm" onClick={() => setFilterType('follow_up')}>
            Påminnelser
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications?.length === 0 ? (
            <Card className="p-8 text-center">
              <BellOff className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Inga notifikationer</h3>
              <p className="text-gray-600">
                {filterType === 'unread' 
                  ? 'Du har inga olästa notifikationer just nu.'
                  : 'Du har inga notifikationer att visa.'
                }
              </p>
            </Card>
          ) : (
            filteredNotifications?.map((notification) => (
              <Card 
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-blue-200 bg-blue-50' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {notification.title}
                          </h3>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(notification.priority)}
                          >
                            {notification.priority === 'high' ? 'Hög' : 
                             notification.priority === 'medium' ? 'Medel' : 'Låg'}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>
                            {formatDistanceToNow(new Date(notification.createdAt), { 
                              addSuffix: true, 
                              locale: sv 
                            })}
                          </span>
                          {notification.scheduledFor && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Schemalagd: {new Date(notification.scheduledFor).toLocaleString('sv-SE')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.isRead && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          disabled={markAsReadMutation.isPending}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Notifikationsinställningar</h2>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Notifikationstyper
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Följ upp-påminnelser</Label>
                <p className="text-sm text-gray-600">
                  Automatiska påminnelser var 2:a vecka för väntande affärer
                </p>
              </div>
              <Switch 
                checked={settings?.followUpReminders ?? true}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ followUpReminders: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Affärsstatusändringar</Label>
                <p className="text-sm text-gray-600">
                  Notifikationer när affärer ändrar status i Kanban-tavlan
                </p>
              </div>
              <Switch 
                checked={settings?.dealStatusChanges ?? true}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ dealStatusChanges: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Projektuppdateringar</Label>
                <p className="text-sm text-gray-600">
                  Notifiera när projekt tilldelas team eller ändrar status
                </p>
              </div>
              <Switch 
                checked={settings?.projectUpdates ?? true}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ projectUpdates: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Materialbeställningar</Label>
                <p className="text-sm text-gray-600">
                  Notifiera vid nya materialbeställningar från Beijer Bygg
                </p>
              </div>
              <Switch 
                checked={settings?.materialRequests ?? true}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ materialRequests: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">Systemvarningar</Label>
                <p className="text-sm text-gray-600">
                  Viktiga systemmeddelanden och uppdateringar
                </p>
              </div>
              <Switch 
                checked={settings?.systemAlerts ?? true}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ systemAlerts: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leveransmetoder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-medium">E-postnotifikationer</Label>
                <p className="text-sm text-gray-600">
                  Skicka notifikationer till din e-postadress
                </p>
              </div>
              <Switch 
                checked={settings?.emailNotifications ?? false}
                onCheckedChange={(checked) => 
                  updateSettingsMutation.mutate({ emailNotifications: checked })
                }
              />
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
          <Bell className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold">Notifikationer</h1>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notifikationer
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Inställningar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6">
          {renderNotificationsTab()}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          {renderSettingsTab()}
        </TabsContent>
      </Tabs>
    </div>
    </>
  );
}

// Add missing Label component
const Label = ({ children, className = "", ...props }: any) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props}>
    {children}
  </label>
);