import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useImpersonation } from '@/contexts/impersonation-context';
import { useAuth } from '@/hooks/use-auth';
import { UserRole, getRoleDisplayName } from '@/lib/role-utils';
import { Eye, EyeOff, User, Crown } from 'lucide-react';

const RoleImpersonationBar: React.FC = () => {
  const { user } = useAuth();
  const { 
    impersonatedRole, 
    setImpersonatedRole, 
    isImpersonating,
    actualRole,
    effectiveRole 
  } = useImpersonation();

  // Only show for head_admin
  if (!user || user.role !== 'head_admin') {
    return null;
  }

  const availableRoles: UserRole[] = ['sales_admin', 'project_admin', 'sales_person'];

  const handleRoleChange = (value: string) => {
    if (value === 'none') {
      setImpersonatedRole(null);
    } else {
      setImpersonatedRole(value as UserRole);
    }
  };

  return (
    <Card className="border-l-4 border-l-orange-500 bg-orange-50 mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5 text-orange-600" />
              <span className="font-semibold text-orange-800">Rollvisning (Head Admin)</span>
            </div>
            
            {isImpersonating && (
              <div className="flex items-center space-x-2">
                <Eye className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-gray-600">Visar systemet som:</span>
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {getRoleDisplayName(impersonatedRole!)}
                </Badge>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <Select 
              value={impersonatedRole || 'none'} 
              onValueChange={handleRoleChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Välj roll att förhandsgranska" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Normal vy (Head Admin)</span>
                  </div>
                </SelectItem>
                {availableRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4" />
                      <span>{getRoleDisplayName(role)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {isImpersonating && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setImpersonatedRole(null)}
                className="text-orange-700 border-orange-300 hover:bg-orange-100"
              >
                <EyeOff className="h-4 w-4 mr-1" />
                Avsluta förhandsgranskning
              </Button>
            )}
          </div>
        </div>

        {isImpersonating && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Förhandsgranskning aktiv:</strong> Du ser nu systemet som en {getRoleDisplayName(impersonatedRole!)} skulle se det. 
              Navigation, behörigheter och tillgängliga funktioner visas enligt denna rolls begränsningar.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RoleImpersonationBar;