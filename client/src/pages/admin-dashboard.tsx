import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RotateCw, X, Undo2, PlusCircle, KeySquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type Calculation, insertUserSchema, type User, type Prices, type RoofType, type MaterialType, type ScaffoldingSize, type ChimneyCovering } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AdminIcon, HomeIcon, TrashIcon } from '../icons/svg';
import Navbar from "@/components/ui/navbar";
import { generateRandomPassword } from "@/lib/utils";
import { type ColumnConfig, AdminSectionCard, AdminSectionTable } from "@/components/ui/admin-section-card";

export default function AdminDashboard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [newFieldName, setNewFieldName] = useState("");
  const [removedField, setRemovedField] = useState<{ name: string; value: { material: number; arbete: number } } | null>(null);
  const [fieldToRemove, setFieldToRemove] = useState<string | null>(null);

  const [showNewRoofTypeDialog, setShowNewRoofTypeDialog] = useState(false);
  const [showNewMaterialTypeDialog, setShowNewMaterialTypeDialog] = useState(false);
  const [showNewScaffoldingSizeDialog, setShowNewScaffoldingSizeDialog] = useState(false);
  const [showNewChimneyTypeDialog, setShowNewChimneyTypeDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'roof' | 'material' | 'scaffolding' | 'chimney', id: string } | null>(null);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);


  // Data queries

  const { data: prices } = useQuery<Prices>({
    queryKey: ["/api/admin/prices"],
  });

  const { data: roofTypes } = useQuery<RoofType[]>({
    queryKey: ["/api/admin/roof-types"],
  });

  const { data: materialTypes } = useQuery<MaterialType[]>({
    queryKey: ["/api/admin/material-types"],
  });

  const { data: scaffoldingSizes } = useQuery<ScaffoldingSize[]>({
    queryKey: ["/api/admin/scaffolding-sizes"],
  });

  const { data: chimneyTypes } = useQuery<ChimneyCovering[]>({
    queryKey: ["/api/admin/chimney-types"],
  });

  const { data: calculationDetails } = useQuery<{name: string, value: number, valueSuffix?: string}[]>({
    queryKey: ["/api/admin/calculation-details"],
  });

  const { data: materialCosts } = useQuery<{name: string, materialCost: number, laborCost: number}[]>({
    queryKey: ["/api/admin/material-costs"],
  });

  const { data: users } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  console.log(calculationDetails);
  console.log(scaffoldingSizes);

  // Forms
  const form = useForm({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const pricesForm = useForm<Prices>({
    defaultValues: prices || {},
  });

  // Initialize form values when prices are first loaded
  useEffect(() => {
    if (prices) {
      pricesForm.reset(prices);
    }
  }, [prices, pricesForm]);

  // Mutations
  const createUserMutation = useMutation({
    mutationFn: async (data: { username: string; password: string }) => {
      await apiRequest("POST", "/api/admin/users", data);
    },
    onSuccess: () => {
      toast({ title: "Användare skapad" });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte skapa användare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { userId: number }) => {
      // Assuming your API endpoint is something like this:
      // The backend should handle hashing the newPassword before saving.
      const response = await apiRequest("PATCH", `/api/admin/users/${data.userId}/reset-password`);
      const responseData = await response.json();

      console.log("Response data from server (after await):", responseData);
      return responseData.newPassword; // Return the new password to display it
    },
    onSuccess: (newPassword, variables) => { // newPassword is the returned value from mutationFn
      const user = users?.find(u => u.id === variables.userId);
      toast({
        title: "Lösenord återställt",
        description: (
          <div>
            <p>Nytt lösenord för {user?.username || 'användaren'} är:</p>
            <div className="mt-2 flex items-center gap-2">
              <Input readOnly value={newPassword} className="bg-muted text-muted-foreground" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(newPassword);
                  toast({ title: "Kopierat!", duration: 2000 });
                }}
              >
                Kopiera
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kopiera lösenordet.</p>
          </div>
        ),
        duration: 15000, // Keep toast longer to allow copying
      });
      // Optionally, close any dialogs or reset state here
      setUserToResetPassword(null); // Close the confirmation dialog
    },
    onError: (error: Error, variables) => {
      const user = users?.find(u => u.id === variables.userId);
      toast({
        title: `Kunde inte återställa lösenord för ${user?.username || 'användaren'}`,
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      await apiRequest("DELETE", `/api/admin/users/${userId}`);
    },
    onSuccess: () => {
      toast({ title: "Användare borttagen" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calculations"] });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort användare",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updatePricesMutation = useMutation({
    mutationFn: async (prices: Prices) => {
      const res = await apiRequest("PUT", "/api/admin/prices", prices);
      return res.json();
    },
    onSuccess: (updatedPrices: Prices) => {
      toast({ title: "Priser uppdaterade" });
      queryClient.setQueryData(["/api/admin/prices"], updatedPrices);
      pricesForm.reset(updatedPrices);
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte uppdatera priser",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCalculationDetailsMutation = useMutation({
    mutationFn: async (calculationDetail: {name: string, value: number}) => {
      const res = await apiRequest("PUT", "/api/admin/calculation-details", calculationDetail);
      return res.json();
    },
    onSuccess: (updatedCalculationDetail: {name: string, value: number}) => {
      toast({ title: "Beräkningsanpassningar uppdaterade" });
      queryClient.setQueryData(["/api/admin/calculation-details"], calculationDetails?.map(detail => detail.name === updatedCalculationDetail.name ? updatedCalculationDetail : detail));
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte uppdatera beräkningsanpassningar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMaterialCostsMutation = useMutation({
    mutationFn: async (materialCost: {name: string, materialCost: number, laborCost: number}) => {
      const body = materialCost;
      const res = await apiRequest("PUT", "/api/admin/material-costs", body);
      return res.json();
    },
    onSuccess: (updatedMaterialCost: {name: string, materialCost: number, laborCost: string}) => {
      toast({ title: "Kostnad uppdaterad" });
      queryClient.setQueryData(["/api/admin/material-costs"], materialCosts?.map(detail => detail.name === updatedMaterialCost.name ? updatedMaterialCost : detail));
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte uppdatera kostnader",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRoofTypeMutation = useMutation({
    mutationFn: async (data: RoofType) => {
      const res = await apiRequest("PUT", `/api/admin/roof-types/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Taktyp uppdaterad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roof-types"] });
    },
  });

  const updateMaterialTypeMutation = useMutation({
    mutationFn: async (data: MaterialType) => {
      const res = await apiRequest("PUT", `/api/admin/material-types/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Materialtyp uppdaterad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/material-types"] });
    },
  });

  const updateScaffoldingSizeMutation = useMutation({
    mutationFn: async (data: ScaffoldingSize) => {
      const res = await apiRequest("PUT", `/api/admin/scaffolding-sizes/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Byggställning uppdaterad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scaffolding-sizes"] });
    },
  });


  // Create mutations
  const createRoofTypeMutation = useMutation({
    mutationFn: async (data: Omit<RoofType, "id" | "sortOrder">) => {
      const id = `roof_${Date.now()}`;
      const sortOrder = roofTypes?.length ? Math.max(...roofTypes.map(r => r.sortOrder)) + 1 : 1;
      const res = await apiRequest("POST", "/api/admin/roof-types", { id, sortOrder, ...data });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Taktyp skapad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roof-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/roof-types"] });
      setShowNewRoofTypeDialog(false);
    },
  });

  const createMaterialTypeMutation = useMutation({
    mutationFn: async (data: Omit<MaterialType, "id" | "sortOrder">) => {
      const id = `material_${Date.now()}`;
      const sortOrder = materialTypes?.length ? Math.max(...materialTypes.map(m => m.sortOrder)) + 1 : 1;
      const res = await apiRequest("POST", "/api/admin/material-types", { id, sortOrder, ...data });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Materialtyp skapad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/material-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/material-types"] });
      setShowNewMaterialTypeDialog(false);
    },
  });

  const createScaffoldingSizeMutation = useMutation({
    mutationFn: async (data: Omit<ScaffoldingSize, "id" | "sortOrder">) => {
      const id = `scaffolding_${Date.now()}`;
      const sortOrder = scaffoldingSizes?.length ? Math.max(...scaffoldingSizes.map(s => s.sortOrder)) + 1 : 1;
      const res = await apiRequest("POST", "/api/admin/scaffolding-sizes", { id, sortOrder, ...data });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Byggställning storlek skapad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scaffolding-sizes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/scaffolding-sizes"] });
      setShowNewScaffoldingSizeDialog(false);
    },
  });

  // Add delete mutations
  const deleteRoofTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/roof-types/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Taktyp borttagen" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/roof-types"] });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort taktyp",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteMaterialTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/material-types/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Materialtyp borttagen" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/material-types"] });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort materialtyp",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  const deleteScaffoldingSizeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/scaffolding-sizes/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Byggställning storlek borttagen" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scaffolding-sizes"] });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort byggställning storlek",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Add chimney type mutations
  const createChimneyTypeMutation = useMutation({
    mutationFn: async (data: Omit<ChimneyCovering, "id" | "sortOrder">) => {
      const id = `chimney_${Date.now()}`;
      const sortOrder = chimneyTypes?.length ? Math.max(...chimneyTypes.map(c => c.sortOrder)) + 1 : 1;
      const res = await apiRequest("POST", "/api/admin/chimney-types", { id, sortOrder, ...data });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Skorstenstyp skapad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chimney-types"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chimney-types"] });
      setShowNewChimneyTypeDialog(false);
    },
  });

  const updateChimneyTypeMutation = useMutation({
    mutationFn: async (data: ChimneyCovering) => {
      const res = await apiRequest("PUT", `/api/admin/chimney-types/${data.id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Skorstenstyp uppdaterad" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chimney-types"] });
    },
  });

  const deleteChimneyTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/admin/chimney-types/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Skorstenstyp borttagen" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chimney-types"] });
      setItemToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Kunde inte ta bort skorstenstyp",
        description: error.message,
        variant: "destructive"
      });
    },
  });

  // Modified moveSortOrder function to directly handle batch updates
  const moveSortOrder = async (
    type: 'roof' | 'material' | 'scaffolding' | 'chimney',
    item: RoofType | MaterialType | ScaffoldingSize | ChimneyCovering,
    direction: 'up' | 'down'
  ) => {
    try {
      const items = type === 'roof' ? roofTypes :
                  type === 'material' ? materialTypes :
                  type === 'scaffolding' ? scaffoldingSizes :
                  chimneyTypes;

      if (!items) return;

      const currentIndex = items.findIndex(i => i.id === item.id);
      if (currentIndex === -1) return;

      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (targetIndex < 0 || targetIndex >= items.length) return;

      // Create new array with reordered items
      const sorted = [...items];
      [sorted[currentIndex], sorted[targetIndex]] = [sorted[targetIndex], sorted[currentIndex]];

      // Log the reordering operation
      console.log(`Reordering ${type} items:`, sorted.map(i => `${i.id}:${i.sortOrder}`));

      const endpoint = type === 'roof' ? '/api/admin/roof-types' :
                      type === 'material' ? '/api/admin/material-types' :
                      type === 'scaffolding' ? '/api/admin/scaffolding-sizes' :
                      '/api/admin/chimney-types';

      // Update all items in a single batch
      await Promise.all(sorted.map((item, index) => {
        console.log(`Updating ${type} item ${item.id} to position ${index + 1}`);
        return apiRequest("PUT", `${endpoint}/${item.id}`, {
          ...item,
          sortOrder: index + 1
        }).then(() => console.log(`Successfully updated ${type} item ${item.id}`))
          .catch(err => console.error(`Failed to update ${type} item ${item.id}:`, err));
      }));

      // Only invalidate query after all updates complete successfully
      const queryKey = type === 'roof' ? '/api/admin/roof-types' :
                      type === 'material' ? '/api/admin/material-types' :
                      type === 'scaffolding' ? '/api/admin/scaffolding-sizes' :
                      '/api/admin/chimney-types';
      queryClient.invalidateQueries({ queryKey: [queryKey] });

      toast({ title: `Ordning uppdaterad` });
    } catch (error) {
      console.error('Error in moveSortOrder:', error);
      toast({
        title: "Kunde inte uppdatera ordningen",
        variant: "destructive"
      });
    }
  };

  // Field management functions
  const addNewField = () => {
    if (!newFieldName || !prices) return;

    const fieldKey = newFieldName.toLowerCase().replace(/\s+/g, '_');
    const updatedPrices = {
      ...prices,
      [fieldKey]: { material: 0, arbete: 0, unitType: "Antal" }, // Added unitType
    };

    updatePricesMutation.mutate(updatedPrices);
    setNewFieldName("");
  };

  const removeField = (fieldName: string) => {
    if (!prices) return;

    const { [fieldName]: removedValue, ...remainingPrices } = prices;
    setRemovedField({ name: fieldName, value: removedValue });
    updatePricesMutation.mutate(remainingPrices);
    setFieldToRemove(null);

    toast({
      title: "Fält borttaget",
      description: (
        <div className="flex items-center gap-2">
          <span>Fältet har tagits bort.</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleUndo()}
            className="h-8 px-2"
          >
            <Undo2 className="mr-2 h-4 w-4" />
            Ångra
          </Button>
        </div>
      ),
    });
  };

  const handleUndo = () => {
    if (!removedField || !prices) return;

    const updatedPrices = {
      ...prices,
      [removedField.name]: removedField.value,
    };

    updatePricesMutation.mutate(updatedPrices);
    setRemovedField(null);
  };

  const renderPriceFields = () => {
    if (!prices) return null;
    console.log(prices);

    const sortedFields = Object.entries(prices)
      .sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase()));

    return sortedFields.map(([fieldName, costs]) => (
      <div key={fieldName} className="flex items-start admin-price-card space-x-4 p-4 border rounded-lg">
        <div className="flex-grow space-y-4">
          <h4 className="font-bold capitalize">{fieldName.replace(/_/g, ' ')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={pricesForm.control}
              name={`${fieldName}.material`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Materialkostnad</FormLabel>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={pricesForm.control}
              name={`${fieldName}.arbete`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Arbetskostnad</FormLabel>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  />
                </FormItem>
              )}
            />
            <FormField
              control={pricesForm.control}
              name={`${fieldName}.unitType`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enhet</FormLabel>
                  <select
                    className="w-full px-3 py-2 bg-white border rounded-md focus:outline-none focus:ring-2"
                    {...field}
                  >
                    <option value="Antal">Antal</option>
                    <option value="Antal Meter">Antal Meter</option>
                  </select>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setFieldToRemove(fieldName)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    ));
  };

  // Add form handling for dialogs
  const roofTypeForm = useForm({
    defaultValues: {
      name: "",
      materialCost: 0,
    },
  });

  const materialTypeForm = useForm({
    defaultValues: {
      name: "",
      costPerKvm: 0,
    },
  });

  const scaffoldingSizeForm = useForm({
    defaultValues: {
      name: "",
      cost: 0,
    },
  });

  const chimneyTypeForm = useForm({
    defaultValues: {
      name: "",
      materialCost: 0,
      laborCost: 0,
    },
  });

  return (
    <div className="min-h-screen">
      <header className="title-area">
        <Navbar/>
            {/* <Dialog>
              <DialogTrigger asChild>
                <Button className="button">
                  <Plus className="mr-2 h-4 w-4 button-text" />
                  <span className="button-text">Skapa användare</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Skapa ny användare</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => createUserMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Användarnamn</FormLabel>
                          <Input {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lösenord</FormLabel>
                          <Input type="password" {...field} />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createUserMutation.isPending}
                    >
                      {createUserMutation.isPending ? "Skapar..." : "Skapa användare"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog> */}

      </header>

      <main className="container base px-4 py-8 space-y-8">
        {/* Delete confirmation dialog */}
        <Dialog open={itemToDelete !== null} onOpenChange={(open) => !open && setItemToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ta bort {
                itemToDelete?.type === 'roof' ? 'taktyp' :
                itemToDelete?.type === 'material' ? 'materialtyp' :
                itemToDelete?.type === 'scaffolding' ? 'byggställning storlek' :
                itemToDelete?.type === 'chimney' ? 'skorstenstyp' :
                'användare'
              }</DialogTitle>
              <DialogDescription>
                Är du säker på att du vill ta bort detta? Detta kan inte ångras.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setItemToDelete(null)}>
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (!itemToDelete) return;
                  if (itemToDelete.type === 'roof') {
                    deleteRoofTypeMutation.mutate(itemToDelete.id);
                  } else if (itemToDelete.type === 'material') {
                    deleteMaterialTypeMutation.mutate(itemToDelete.id);
                  } else if (itemToDelete.type === 'scaffolding') {
                    deleteScaffoldingSizeMutation.mutate(itemToDelete.id);
                  } else if (itemToDelete.type === 'chimney') {
                    deleteChimneyTypeMutation.mutate(itemToDelete.id);
                  } else if (itemToDelete.type === 'user') {
                    deleteUserMutation.mutate(itemToDelete.id);
                  }
                }}
              >
                Ta bort
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={userToResetPassword !== null} onOpenChange={(open) => !open && setUserToResetPassword(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Återställ lösenord</DialogTitle>
              <DialogDescription>
                Är du säker på att du vill generera ett nytt lösenord för användaren{" "}
                <strong>{userToResetPassword?.username}</strong>?
                Det gamla lösenordet kommer att sluta fungera omedelbart.
                Ett nytt lösenord kommer att genereras och visas för dig.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUserToResetPassword(null)}>
                Avbryt
              </Button>
              <Button
                variant="destructive" // Or primary action color
                onClick={() => {
                  if (userToResetPassword) {
                    const newPassword = generateRandomPassword();
                    resetPasswordMutation.mutate({ userId: userToResetPassword.id, newPassword });
                    // The dialog will be closed by resetPasswordMutation.onSuccess setting setUserToResetPassword(null)
                  }
                }}
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? "Genererar..." : "Ja, generera nytt lösenord"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Previous field removal dialog remains unchanged */}
        <Dialog open={fieldToRemove !== null} onOpenChange={(open) => !open && setFieldToRemove(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ta bort fält</DialogTitle>
              <DialogDescription>
                Är du säker på att du vill ta bort detta fält? Detta kan ångras.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFieldToRemove(null)}>
                Avbryt
              </Button>
              <Button
                variant="destructive"
                onClick={() => fieldToRemove && removeField(fieldToRemove)}
              >
                Ta bort
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Roof Types Management */}
        <AdminSectionCard
          title="Taktyper"
          items={roofTypes}
          columns={[
            { header: "Namn", accessorKey: "name", isEditable: true, editableFieldKey: "name", inputType: "text" },
            { header: "Materialkostnad", accessorKey: "materialCost", isEditable: true, editableFieldKey: "materialCost", inputType: "number" },
          ]}
          addButtonText="Lägg till taktyp"
          onAddClick={() => setShowNewRoofTypeDialog(true)}
          onUpdateItem={(item, fieldKey, newValue) => {
            updateRoofTypeMutation.mutate({
              ...item,
              [fieldKey]: newValue,
            } as RoofType); // Cast to ensure type compatibility
          }}
          onDeleteItem={(item) => setItemToDelete({ type: 'roof', id: item.id })}
          onMoveSortOrder={moveSortOrder as any} // Cast if type mismatch, or adjust moveSortOrder signature
          itemTypeForSorting="roof"
          isLoading={updateRoofTypeMutation.isPending || deleteRoofTypeMutation.isPending}
        />

        {/* Material Types Management */}
        <AdminSectionCard
          title="Materialtyper"
          items={materialTypes}
          columns={[
            { header: "Namn", accessorKey: "name", isEditable: true, editableFieldKey: "name", inputType: "text" },
            { header: "Kostnad per KVM", accessorKey: "costPerKvm", isEditable: true, editableFieldKey: "costPerKvm", inputType: "number" },
          ]}
          addButtonText="Lägg till materialtyp"
          onAddClick={() => setShowNewMaterialTypeDialog(true)}
          onUpdateItem={(item, fieldKey, newValue) => {
            updateMaterialTypeMutation.mutate({
              ...item,
              [fieldKey]: newValue,
            } as MaterialType);
          }}
          onDeleteItem={(item) => setItemToDelete({ type: 'material', id: item.id })}
          onMoveSortOrder={moveSortOrder as any}
          itemTypeForSorting="material"
          isLoading={updateMaterialTypeMutation.isPending || deleteMaterialTypeMutation.isPending}
        />
        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b-2">
            <CardTitle>Material (Kostnad per KVM)</CardTitle>

          </CardHeader>
          <div className="raspont-label">
            <span>Råspont</span>
          </div>
          <CardContent className="admin-table">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="raspont_name" className="admin-table-header">Namn</TableHead>
                  <TableHead key="raspont_material" className="admin-table-header">Materialkostnad</TableHead>
                  <TableHead key="raspont_labor" className="admin-table-header">Arbetskostnad</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialCosts?.map((item) => (
                  item.name.startsWith('råspont') ?
                  <TableRow key={item.name}>
                    <TableCell key={`${item.name}-raspont_name`}>
                      {capitilize(item.name)}
                    </TableCell>
                    <TableCell key={`${item.name}-raspont_material`}>
                      <Input
                        defaultValue={item.materialCost as string | number}
                        type='number'
                        onBlur={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          updateMaterialCostsMutation.mutate({name: item.name, materialCost: value, laborCost: item.laborCost});
                        }}
                        disabled={updateMaterialCostsMutation.isPending}
                      />
                    </TableCell>
                    <TableCell key={`${item.name}-raspont_labor`}>
                      <Input
                        defaultValue={item.laborCost as string | number}
                        type='number'
                        onBlur={(e) => {
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          updateMaterialCostsMutation.mutate({name: item.name, materialCost: item.materialCost, laborCost: value});
                        }}
                        disabled={updateMaterialCostsMutation.isPending}
                      />
                    </TableCell>
                  </TableRow> : null
                ))}
              </TableBody>
            </Table>
          </CardContent>


          {materialCosts && <div className="flex-col items-center gap-4 px-4 py-2">
            <div className="calculator-label">
              <span>Underlagsduk</span>
            </div>
            <div className="flex flex-1">
              <input
                type="number"
                key='underlagsduk'
                defaultValue={materialCosts?.find(item => item.name === 'underlagsduk_raw')?.materialCost}
                onBlur={(e) => {
                  updateMaterialCostsMutation.mutate({
                    name: 'underlagsduk_raw',
                    materialCost: e.target.value === '' ? 0 : Number(e.target.value),
                    laborCost: materialCosts?.find(item => item.name === 'underlagsduk_raw')?.laborCost || 0
                  })
                }}
                className="input-field editable-input"
                disabled={updateMaterialCostsMutation.isPending}
              />
            </div>
          </div>}

          {materialCosts && <div className="flex-col items-center gap-4 px-4 py-2">
            <div className="calculator-label">
              <span>Trampsäker duk</span>
            </div>
            <div className="flex flex-1">
              <input
                type="number"
                key='trampsäker_duk'
                defaultValue={materialCosts?.find(item => item.name === 'trampsäker_duk')?.materialCost}
                onBlur={(e) => {
                  updateMaterialCostsMutation.mutate({
                    name: 'trampsäker_duk',
                    materialCost: e.target.value === '' ? 0 : Number(e.target.value),
                    laborCost: materialCosts?.find(item => item.name === 'trampsäker_duk')?.laborCost || 0
                  })
                }}
                className="input-field editable-input"
                disabled={updateMaterialCostsMutation.isPending}
              />
            </div>
          </div>}

          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Materialtyper</CardTitle>
              <Button onClick={() => setShowNewMaterialTypeDialog(true)} size="sm" disabled={updateMaterialTypeMutation.isPending || deleteMaterialTypeMutation.isPending} className="admin-generic-add">
                <PlusCircle className="h-4 w-4" />
                Lägg till materialtyp
              </Button>

          </CardHeader>
          <CardContent className="admin-table">
            <AdminSectionTable 
              title="Materialtyper"
              items={materialTypes}
              columns={[
                { header: "Namn", accessorKey: "name", isEditable: true, editableFieldKey: "name", inputType: "text" },
                { header: "Kostnad per KVM", accessorKey: "costPerKvm", isEditable: true, editableFieldKey: "costPerKvm", inputType: "number" },
              ]}
              onUpdateItem={(item, fieldKey, newValue) => {
                updateMaterialTypeMutation.mutate({
                  ...item,
                  [fieldKey]: newValue,
                } as MaterialType);
              }}
              onDeleteItem={(item) => setItemToDelete({ type: 'material', id: item.id })}
              onMoveSortOrder={moveSortOrder as any}
              itemTypeForSorting="material"
              isLoading={updateMaterialTypeMutation.isPending || deleteMaterialTypeMutation.isPending}>
            </AdminSectionTable>

            {materialTypes && materialTypes.length === 0 && (
              <p className="py-4 text-center text-muted-foreground">Inga objekt att visa.</p>
            )}
             {(updateMaterialTypeMutation.isPending || deleteMaterialTypeMutation.isPending) && !materialTypes && (
              <p className="py-4 text-center text-muted-foreground">Laddar data...</p>
            )}
          </CardContent>

          {materialCosts && <div className="flex-col items-center gap-4 px-4 py-2">
            <div className="calculator-label">
              <span>Arbetskostnad per Material KVM</span>
            </div>
            <div className="flex flex-1">
              <input
                type="number"
                key='arbetskostnad_kvm'
                defaultValue={materialCosts?.find(item => item.name === 'arbetskostnad_kvm')?.laborCost}
                onBlur={(e) => {
                  updateMaterialCostsMutation.mutate({
                    name: 'arbetskostnad_kvm',
                    materialCost: materialCosts?.find(item => item.name === 'arbetskostnad_kvm')?.materialCost || 0,
                    laborCost: e.target.value === '' ? 0 : Number(e.target.value),
                  })
                }}
                className="input-field editable-input"
                disabled={updateMaterialCostsMutation.isPending}
              />
            </div>
          </div>}
        </Card>


        {/* Scaffolding Sizes Management */}
        <AdminSectionCard
          title="Byggställning storlekar"
          items={scaffoldingSizes}
          columns={[
            { header: "Namn", accessorKey: "name", isEditable: true, editableFieldKey: "name", inputType: "text" },
            { header: "Kostnad", accessorKey: "cost", isEditable: true, editableFieldKey: "cost", inputType: "number" },
          ]}
          addButtonText="Lägg till byggställning storlek"
          onAddClick={() => setShowNewScaffoldingSizeDialog(true)}
          onUpdateItem={(item, fieldKey, newValue) => {
            updateScaffoldingSizeMutation.mutate({
              ...item,
              [fieldKey]: newValue,
            } as ScaffoldingSize);
          }}
          onDeleteItem={(item) => setItemToDelete({ type: 'scaffolding', id: item.id })}
          onMoveSortOrder={moveSortOrder as any}
          itemTypeForSorting="scaffolding"
          isLoading={updateScaffoldingSizeMutation.isPending || deleteScaffoldingSizeMutation.isPending}
        />

        {/* Chimney Types Management */}
        <AdminSectionCard
          title="Skorstenstyper"
          items={chimneyTypes}
          columns={[
            { header: "Namn", accessorKey: "name", isEditable: true, editableFieldKey: "name", inputType: "text" },
            { header: "Materialkostnad", accessorKey: "materialCost", isEditable: true, editableFieldKey: "materialCost", inputType: "number" },
            { header: "Arbetskostnad", accessorKey: "laborCost", isEditable: true, editableFieldKey: "laborCost", inputType: "number" },
          ]}
          addButtonText="Lägg till skorstenstyp"
          onAddClick={() => setShowNewChimneyTypeDialog(true)}
          onUpdateItem={(item, fieldKey, newValue) => {
            updateChimneyTypeMutation.mutate({
              ...item,
              [fieldKey]: newValue,
            } as ChimneyCovering);
          }}
          onDeleteItem={(item) => setItemToDelete({ type: 'chimney', id: item.id })}
          onMoveSortOrder={moveSortOrder as any}
          itemTypeForSorting="chimney"
          isLoading={updateChimneyTypeMutation.isPending || deleteChimneyTypeMutation.isPending}
        />

        <Card className="admin-card">
          <CardHeader className="flex flex-row items-start space-y-0 pb-5">
            <CardTitle>Prishantering</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...pricesForm}>
              <form
                onSubmit={pricesForm.handleSubmit((data) => updatePricesMutation.mutate(data))}
                className="space-y-6"
              >
                <div className="mb-6 flex gap-4">
                  <Input
                    placeholder="Nytt fältnamn"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                  />
                  <Button
                    type="button"
                    onClick={addNewField}
                    disabled={!newFieldName}
                    className="admin-generic-add"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Lägg till fält
                  </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {renderPriceFields()}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={updatePricesMutation.isPending}
                >
                  {updatePricesMutation.isPending ? "Uppdaterar..." : "Uppdatera alla priser"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="admin-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle>Beräkningsanpassningar</CardTitle>
          </CardHeader>
          <CardContent>
            {calculationDetails?.map(detail => {
              return <div className="flex-col items-center gap-4 mt-4" key={detail.name}>
                <div className="calculator-label">
                  <span>{capitilize(detail.name)}</span>
                </div>
                <div className="flex flex-1 relative">
                  <input
                    type="text"
                    defaultValue={detail.value}
                    onBlur={(e) => {
                      updateCalculationDetailsMutation.mutate({
                        name: detail.name,
                        value: e.target.value === '' ? 0 : Number(e.target.value),
                      })
                    }}
                    className="input-field editable-input"
                    style={detail.valueSuffix ? { paddingRight: `${detail.valueSuffix.length * 8 + 16}px` } : {}}
                  />
                  {detail.valueSuffix && (
                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-600 font-medium pointer-events-none">
                      {detail.valueSuffix}
                    </span>
                  )}
                </div>
              </div>
            })}
          </CardContent>
        </Card>



        {/* Add dialogs for creating new options */}
        <Dialog open={showNewRoofTypeDialog} onOpenChange={setShowNewRoofTypeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ny taktyp</DialogTitle>
            </DialogHeader>
            <Form {...roofTypeForm}>
              <form onSubmit={roofTypeForm.handleSubmit((data) => {
                createRoofTypeMutation.mutate({
                  name: data.name,
                  materialCost: Number(data.materialCost),
                });
              })}>
                <div className="space-y-4">
                  <FormField
                    control={roofTypeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Namn</FormLabel>
                        <Input {...field} required />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={roofTypeForm.control}
                    name="materialCost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Materialkostnad</FormLabel>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          required
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createRoofTypeMutation.isPending}>
                    {createRoofTypeMutation.isPending ? "Sparar..." : "Spara"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showNewMaterialTypeDialog} onOpenChange={setShowNewMaterialTypeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ny materialtyp</DialogTitle>
            </DialogHeader>
            <Form {...materialTypeForm}>
              <form onSubmit={materialTypeForm.handleSubmit((data) => {
                createMaterialTypeMutation.mutate({
                  name: data.name,
                  costPerKvm: Number(data.costPerKvm),
                });
              })}>
                <div className="space-y-4">
                  <FormField
                    control={materialTypeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Namn</FormLabel>
                        <Input {...field} required />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={materialTypeForm.control}
                    name="costPerKvm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kostnad per KVM</FormLabel>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          required
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createMaterialTypeMutation.isPending}>
                    {createMaterialTypeMutation.isPending ? "Sparar..." : "Spara"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={showNewScaffoldingSizeDialog} onOpenChange={setShowNewScaffoldingSizeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ny byggställning storlek</DialogTitle>
            </DialogHeader>
            <Form {...scaffoldingSizeForm}>
              <form onSubmit={scaffoldingSizeForm.handleSubmit((data) => {
                createScaffoldingSizeMutation.mutate({
                  name: data.name,
                  cost: Number(data.cost),
                });
              })}>
                <div className="space-y-4">
                  <FormField
                    control={scaffoldingSizeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Namn</FormLabel>
                        <Input {...field} required />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={scaffoldingSizeForm.control}
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kostnad</FormLabel>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          required
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={createScaffoldingSizeMutation.isPending}>
                    {createScaffoldingSizeMutation.isPending ? "Sparar..." : "Spara"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Add Dialog for Chimney Types */}
        <Dialog open={showNewChimneyTypeDialog} onOpenChange={setShowNewChimneyTypeDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Lägg till ny skorstenstyp</DialogTitle>
            </DialogHeader>
            <Form {...chimneyTypeForm}>
              <form
                onSubmit={chimneyTypeForm.handleSubmit((data) => createChimneyTypeMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={chimneyTypeForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Namn</FormLabel>
                      <Input {...field} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={chimneyTypeForm.control}
                  name="materialCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Materialkostnad</FormLabel>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={chimneyTypeForm.control}
                  name="laborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Arbetskostnad</FormLabel>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={createChimneyTypeMutation.isPending}
                >
                  {createChimneyTypeMutation.isPending ? "Skapar..." : "Skapa skorstenstyp"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );

  function capitilize(input: string) {
    return input.charAt(0).toUpperCase() + input.slice(1).replaceAll('_', ' ');
  }
}