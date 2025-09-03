import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Employee, InsertEmployee, employeeSchema } from "@shared/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import Navbar from "@/components/ui/navbar";
import { UserCityAccessManager } from "@/components/user-city-access-manager";
import { CityManager } from "@/components/city-manager";
import { 
  User, 
  Plus, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Shield,
  Building2,
  Users
} from "lucide-react";

export default function EmployeeManagementPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch employees
  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/admin/employees"],
  });

  // Create employee mutation
  const createEmployeeMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return apiRequest("/api/admin/employees", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Framgång",
        description: "Anställd skapad framgångsrikt",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte skapa anställd",
        variant: "destructive",
      });
    },
  });

  // Update employee mutation
  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InsertEmployee> }) => {
      return apiRequest(`/api/admin/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Framgång",
        description: "Anställd uppdaterad framgångsrikt",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera anställd",
        variant: "destructive",
      });
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/employees/${id}/toggle-status`, {
        method: "PATCH",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({
        title: "Framgång",
        description: "Anställd status uppdaterad",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera status",
        variant: "destructive",
      });
    },
  });

  // Delete employee mutation
  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/employees/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/employees"] });
      toast({
        title: "Framgång",
        description: "Anställd inaktiverad",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte inaktivera anställd",
        variant: "destructive",
      });
    },
  });

  // Create form
  const createForm = useForm<InsertEmployee>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "Säljare",
      username: "",
      password: "",
      isActive: true,
    },
  });

  // Edit form
  const editForm = useForm<Partial<InsertEmployee>>({
    resolver: zodResolver(employeeSchema.partial()),
  });

  const handleCreateSubmit = (data: InsertEmployee) => {
    createEmployeeMutation.mutate(data);
  };

  const handleEditSubmit = (data: Partial<InsertEmployee>) => {
    if (selectedEmployee) {
      updateEmployeeMutation.mutate({ id: selectedEmployee.id, data });
    }
  };

  const openEditDialog = (employee: Employee) => {
    setSelectedEmployee(employee);
    editForm.reset({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role as any,
      isActive: employee.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "Admin": return "bg-red-100 text-red-800";
      case "Säljchef": return "bg-purple-100 text-purple-800";
      case "Projektledare": return "bg-blue-100 text-blue-800";
      case "Ekonomi": return "bg-green-100 text-green-800";
      case "Säljare": return "bg-orange-100 text-orange-800";
      case "Snickare": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Admin": return <Shield className="w-4 h-4" />;
      case "Säljchef": case "Projektledare": return <Users className="w-4 h-4" />;
      case "Ekonomi": return <Building2 className="w-4 h-4" />;
      case "Säljare": case "Snickare": return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const needsAccount = (role: string) => {
    return ['Admin', 'Projektledare', 'Ekonomi', 'Säljchef', 'Säljare'].includes(role);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">👥 Personalhantering</h1>
          <p className="text-muted-foreground mt-1">
            Hantera företagets anställda och deras roller i systemet
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
              <Plus className="w-4 h-4 mr-2" />
              Lägg till anställd
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Skapa ny anställd</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namn *</FormLabel>
                      <FormControl>
                        <Input placeholder="Förnamn Efternamn" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Välj roll" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Snickare">🔨 Snickare (ingen systemåtkomst)</SelectItem>
                          <SelectItem value="Säljare">💼 Säljare</SelectItem>
                          <SelectItem value="Projektledare">👷 Projektledare</SelectItem>
                          <SelectItem value="Ekonomi">💰 Ekonomi</SelectItem>
                          <SelectItem value="Säljchef">👔 Säljchef</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefon *</FormLabel>
                      <FormControl>
                        <Input placeholder="070-123 45 67" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-post</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="namn@exempel.se" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {createForm.watch("role") && needsAccount(createForm.watch("role")) && (
                  <>
                    <FormField
                      control={createForm.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Användarnamn *</FormLabel>
                          <FormControl>
                            <Input placeholder="användarnamn" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lösenord *</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Minst 6 tecken" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Avbryt
                  </Button>
                  <Button
                    type="submit"
                    disabled={createEmployeeMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createEmployeeMutation.isPending ? "Skapar..." : "Skapa"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-700">Totalt anställda</p>
                <p className="text-2xl font-bold text-blue-900">{employees?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserCheck className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-700">Aktiva</p>
                <p className="text-2xl font-bold text-green-900">
                  {employees?.filter(emp => emp.isActive).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <UserX className="w-8 h-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-orange-700">Inaktiva</p>
                <p className="text-2xl font-bold text-orange-900">
                  {employees?.filter(emp => !emp.isActive).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-purple-700">Systemåtkomst</p>
                <p className="text-2xl font-bold text-purple-900">
                  {employees?.filter(emp => needsAccount(emp.role)).length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee List */}
      <Card className="bg-white/50 backdrop-blur-sm border border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Anställda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees?.map((employee) => (
              <Card 
                key={employee.id} 
                className={`transition-all duration-200 hover:shadow-lg ${
                  employee.isActive 
                    ? 'bg-white border-gray-200 hover:border-blue-300' 
                    : 'bg-gray-50 border-gray-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${getRoleBadgeColor(employee.role)}`}>
                        {getRoleIcon(employee.role)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                        <Badge variant="secondary" className={getRoleBadgeColor(employee.role)}>
                          {employee.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      {employee.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Aktiv
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-800">
                          Inaktiv
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Login Credentials Section - prominent display */}
                  {needsAccount(employee.role) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">Inloggningsuppgifter</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Användarnamn:</span>
                          <span className="font-mono bg-white px-2 py-1 rounded border text-gray-900">
                            {employee.username || 'Ej tilldelat'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Lösenord:</span>
                          <span className="font-mono bg-white px-2 py-1 rounded border text-gray-900">
                            {employee.username === 'Admin' ? 'admin' : 
                             employee.username === 'Sälj' ? 'Chef' :
                             employee.username === 'Projekt' ? 'Ledare' :
                             employee.username === 'Tobias' ? 'Lundgren' :
                             employee.username === 'Bengt' ? 'Bengt' :
                             employee.username === 'Magnus' ? 'Magnus' :
                             employee.username ? 'Lösenord' : 'Ej tilldelat'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {employee.phone && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4" />
                        <span>{employee.phone}</span>
                      </div>
                    )}
                    {employee.email && (
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4" />
                        <span>{employee.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(employee)}
                        className="h-8"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleStatusMutation.mutate(employee.id)}
                        disabled={toggleStatusMutation.isPending}
                        className="h-8"
                      >
                        {employee.isActive ? (
                          <ToggleRight className="w-3 h-3 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-3 h-3 text-gray-400" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs text-gray-500">
                      ID: {employee.id}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {employees?.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Inga anställda registrerade ännu</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* City Management */}
      <CityManager />

      {/* City Access Management */}
      <UserCityAccessManager />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redigera anställd</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Namn</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefon</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-post</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Roll</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Snickare">🔨 Snickare</SelectItem>
                        <SelectItem value="Säljare">💼 Säljare</SelectItem>
                        <SelectItem value="Projektledare">👷 Projektledare</SelectItem>
                        <SelectItem value="Ekonomi">💰 Ekonomi</SelectItem>
                        <SelectItem value="Säljchef">👔 Säljchef</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Avbryt
                </Button>
                <Button
                  type="submit"
                  disabled={updateEmployeeMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {updateEmployeeMutation.isPending ? "Uppdaterar..." : "Uppdatera"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}