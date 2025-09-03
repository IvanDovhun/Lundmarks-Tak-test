import { useEffectiveAuth } from "@/hooks/use-effective-auth";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  calculationSchema,
  type CalculationInput,
  type RoofType,
  type MaterialType,
  type ScaffoldingSize,
  type ChimneyCovering,
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProcessDialog } from "@/components/ui/process-dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Calculation, Prices, CalculationProcess } from "@shared/schema";
import { cn, formatPrice } from "@/lib/utils";
import {
  CustomerIcon,
  AdminIcon,
  DemoIcon,
  DealsIcon,
  LogoutIcon,
  RocketIcon,
} from "../icons/svg";
import Navbar from "@/components/ui/navbar";
import CalculatorSection from "@/components/ui/calculator-section";
import { UserRole, getUserPermissions } from "@/lib/role-utils";

/**
 * ROOFING CALCULATOR PAGE COMPONENT
 * 
 * This is the main calculator for Swedish roofing cost estimation.
 * Used by sales personnel for door-to-door price quotes.
 * 
 * Key Swedish business terms:
 * - Kalkyl = Calculator/Cost Estimation
 * - Takberäkning = Roof Calculation
 * - ROT-avdrag = Swedish tax deduction for renovation work (50% of labor costs)
 * - Påslag = Company markup percentage
 * - Säljare = Salesperson
 * 
 * Business flow:
 * 1. Sales person visits customer
 * 2. Measures roof and enters details
 * 3. Calculator generates immediate quote
 * 4. Customer decides: Yes/No/Waiting for bank approval
 * 5. If Yes → becomes a deal in the pipeline
 */
export default function CalculatorPage() {
  const { toast } = useToast();
  const { user, canViewPrices, canManagePrices } = useEffectiveAuth();
  const [lastCalculation, setLastCalculation] = useState<Calculation | null>(
    null,
  );
  
  // Customer information (Kunduppgifter)
  const [customerName, setCustomerName] = useState(""); // Kundnamn
  const [customerPhone, setCustomerPhone] = useState(""); // Telefonnummer
  const [customerEmail, setCustomerEmail] = useState(""); // E-post
  const [customerAdress, setCustomerAdress] = useState(""); // Adress
  const [customerOwnerAmount, setCustomerOwnerAmount] = useState(1); // Antal ägare (1 or 2, affects ROT tax)
  
  // Roof specifications (Takspecifikationer)
  const [area, setArea] = useState<number | null>(null); // Takyta (roof area in m²)
  const [raspont, setRaspont] = useState<number | null>(null); // Wood boarding area in m²
  const [raspontRivning, setRaspontRivning] = useState<bool | null>(null); // Remove old boarding (true/false)
  const [dukType, setDukType] = useState(""); // Underlay/membrane type
  const [extra, setExtra] = useState(""); // Additional work description
  const [milage, setMilage] = useState(0); // Travel distance in km for cost calculation
  
  // Pricing and margins (Prissättning)
  const [payMarginPercent, setPayMarginPercent] = useState(5); // Company markup percentage
  const [payMarginPrice, setPayMarginPrice] = useState(0); // Calculated margin amount
  const [priceToPay, setPriceToPay] = useState(0); // Final price for customer
  const [monthCost, setMonthCost] = useState(0.039); // Monthly interest rate (3.9%)

  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [currentProcessStep, setCurrentProcessStep] = useState(1);
  const [highestStepReached, setHighestStepReached] = useState(1);
  const [dealMade, setDealMade] = useState(null); // null, true, or false
  const [reasonNoDeal, setReasonNoDeal] = useState('');
  const [revisit, setRevisit] = useState(null); // null, true, or false
  const [agreementFile, setAgreementFile] = useState(null);
  const [projectImages, setProjectImages] = useState([]);
  const [processNotes, setProcessNotes] = useState('');
  const [dealShare, setDealShare] = useState(null);

  // Dynamic field values state
  const [fieldValues, setFieldValues] = useState<Record<string, number>>({});

  // Queries with proper enablement conditions
  const { data: categories } = useQuery<{ [category: string]: { unitType: string } }>({
    queryKey: ["/api/categories"],
  });

  const { data: roofTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/roof-types"],
  });

  const { data: materialTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/material-types"],
  });

  const { data: scaffoldingSizes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/scaffolding-sizes"],
  });

  const { data: chimneyTypes } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/chimney-types"],
  });

  const { data: otherUsers } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/other-users"],
  });

  const { data: rotAvdrag } = useQuery<number>({
    queryKey: ["/api/root-deduction"],
  });

  // Permission checking is now handled by useEffectiveAuth hook
  
  const { data: currentPrices } = useQuery<Prices>({
    queryKey: ["/api/admin/prices"],
    enabled: canViewPrices, // Only fetch if user can view prices
  });

  // Fetch detailed pricing data for dropdowns (admin roles only)
  const { data: roofTypesDetailed } = useQuery({
    queryKey: ["/api/admin/roof-types-detailed"],
    enabled: canViewPrices
  });
  
  const { data: materialTypesDetailed } = useQuery({
    queryKey: ["/api/admin/material-types-detailed"],
    enabled: canViewPrices
  });
  
  const { data: scaffoldingSizesDetailed } = useQuery({
    queryKey: ["/api/admin/scaffolding-sizes-detailed"],
    enabled: canViewPrices
  });
  
  const { data: chimneyTypesDetailed } = useQuery({
    queryKey: ["/api/admin/chimney-types-detailed"],
    enabled: canViewPrices
  });

  // Form initialization with required fields
  const form = useForm<any>({
    resolver: zodResolver(calculationSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      customerAdress: "",
      customerOwnerAmount: 1, // Default to "En" (1 owner)
      advancedScaffolding: false, // Ta bort detta för att tvinga användaren att välja
    },
    mode: "onSubmit", // This ensures validation happens on submit
  });

  // Load form data from localStorage on component mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('calculatorFormData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);

        // Restore basic form fields
        if (parsedData.customerName) {
          setCustomerName(parsedData.customerName);
          form.setValue("customerName", parsedData.customerName);
        }
        if (parsedData.customerPhone) {
          setCustomerPhone(parsedData.customerPhone);
          form.setValue("customerPhone", parsedData.customerPhone);
        }
        if (parsedData.customerEmail) {
          setCustomerEmail(parsedData.customerEmail);
          form.setValue("customerEmail", parsedData.customerEmail);
        }
        if (parsedData.customerAdress) {
          setCustomerAdress(parsedData.customerAdress);
          form.setValue("customerAdress", parsedData.customerAdress);
        }
        if (parsedData.customerOwnerAmount) {
          setCustomerOwnerAmount(parsedData.customerOwnerAmount);
          form.setValue("customerOwnerAmount", parsedData.customerOwnerAmount);
        }
        if (parsedData.area !== undefined) {
          setArea(parsedData.area);
          form.setValue("area", parsedData.area);
        }
        if (parsedData.raspont !== undefined) {
          setRaspont(parsedData.raspont);
          form.setValue("raspont", parsedData.raspont);
        }
        if (parsedData.raspontRivning !== undefined) {
          setRaspontRivning(parsedData.raspontRivning);
          form.setValue("raspontRivning", parsedData.raspontRivning);
        }
        if (parsedData.dukType) {
          setDukType(parsedData.dukType);
          form.setValue("dukType", parsedData.dukType);
        }
        if (parsedData.extra) {
          setExtra(parsedData.extra);
          form.setValue("extra", parsedData.extra);
        }
        if (parsedData.milage !== undefined) {
          setMilage(parsedData.milage);
          form.setValue("milage", parsedData.milage);
        }
        if (parsedData.payMarginPercent !== undefined) {
          setPayMarginPercent(parsedData.payMarginPercent);
        }

        // Note: Dynamic field values will be restored after categories load

        // Restore dropdown selections (will be handled after data is loaded)
        if (parsedData.roofType) {
          form.setValue("roofType", parsedData.roofType);
        }
        if (parsedData.materialType) {
          form.setValue("materialType", parsedData.materialType);
        }
        if (parsedData.scaffoldingSize) {
          form.setValue("scaffoldingSize", parsedData.scaffoldingSize);
        }
        if (parsedData.chimneyType) {
          form.setValue("chimneyType", parsedData.chimneyType);
        }
        if (parsedData.advancedScaffolding !== undefined) {
          form.setValue("advancedScaffolding", parsedData.advancedScaffolding);
        }
        if (parsedData.twoFloorScaffolding !== undefined) {
          form.setValue("twoFloorScaffolding", parsedData.twoFloorScaffolding);
        }
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        localStorage.removeItem('calculatorFormData');
      }
    }
  }, [form]);

  // Only initialize field values when categories are loaded AND user is admin
  useEffect(() => {
    if (categories) {
      const initialValues = Object.keys(categories).reduce(
        (acc, key) => {
          acc[key] = null;
          form.setValue(key as any, null);
          return acc;
        },
        {} as { [key: string]: number | null },
      );
      setFieldValues(initialValues);

      // Re-apply saved localStorage data for dynamic fields after categories load
      const savedFormData = localStorage.getItem('calculatorFormData');
      if (savedFormData) {
        try {
          const parsedData = JSON.parse(savedFormData);
          if (parsedData.fieldValues) {
            // Only restore values for fields that exist in categories
            const validFieldValues = Object.keys(categories).reduce((acc, key) => {
              if (parsedData.fieldValues[key] !== undefined) {
                acc[key] = parsedData.fieldValues[key];
                form.setValue(key as any, parsedData.fieldValues[key]);
              } else {
                acc[key] = null;
              }
              return acc;
            }, {} as { [key: string]: number | null });

            setFieldValues(validFieldValues);
          }
        } catch (error) {
          console.error('Error re-applying saved field values:', error);
        }
      }
    }
  }, [categories, form]);

  // Get reuse calculation data if available
  const reuseCalculation = queryClient.getQueryData<Calculation>([
    "reuse-calculation",
  ]);

  // Update form and field values when reuse data is available
  useEffect(() => {
    if (reuseCalculation) {
      // Set basic form values
      form.reset(reuseCalculation.inputData);

      // Set customer name and areas
      setCustomerName(reuseCalculation.inputData.customerName);
      setCustomerPhone(reuseCalculation.inputData.customerPhone);
      setCustomerEmail(reuseCalculation.inputData.customerEmail);
      setCustomerAdress(reuseCalculation.inputData.customerAdress);
      setCustomerOwnerAmount(reuseCalculation.inputData.customerOwnerAmount);
      setArea(reuseCalculation.inputData.area);
      setRaspont(reuseCalculation.inputData.raspont);

      // Set dynamic field values from the inputData
      if (categories) {
        const newFieldValues = { ...fieldValues };
        // Get all numeric fields from the inputData
        Object.entries(reuseCalculation.inputData).forEach(([key, value]) => {
          if (typeof value === "number") {
            newFieldValues[key] = value;
            form.setValue(key as any, value);
          }
        });
        setFieldValues(newFieldValues);
      }

      // Set dropdowns if data exists
      if (roofTypes?.length && reuseCalculation.inputData.roofType) {
        const selectedRoofType = roofTypes.find(
          (r) => r.id === reuseCalculation.inputData.roofType.id,
        );
        if (selectedRoofType) {
          form.setValue("roofType", selectedRoofType);
        }
      }

      if (materialTypes?.length && reuseCalculation.inputData.materialType) {
        const selectedMaterialType = materialTypes.find(
          (m) => m.id === reuseCalculation.inputData.materialType.id,
        );
        if (selectedMaterialType) {
          form.setValue("materialType", selectedMaterialType);
        }
      }

      if (
        scaffoldingSizes?.length &&
        reuseCalculation.inputData.scaffoldingSize
      ) {
        const selectedScaffoldingSize = scaffoldingSizes.find(
          (s) => s.id === reuseCalculation.inputData.scaffoldingSize.id,
        );
        if (selectedScaffoldingSize) {
          form.setValue("scaffoldingSize", selectedScaffoldingSize);
        }
      }

      if (chimneyTypes?.length && reuseCalculation.inputData.chimneyType) {
        const selectedChimneyType = chimneyTypes.find(
          (c) => c.id === reuseCalculation.inputData.chimneyType.id,
        );
        if (selectedChimneyType) {
          form.setValue("chimneyType", selectedChimneyType);
        }
      }
      setPayMarginPercent(reuseCalculation.marginPercent);

      // Clean up reuse data
      queryClient.removeQueries({ queryKey: ["reuse-calculation"] });
    }
  }, [
    reuseCalculation,
    form,
    categories,
    roofTypes,
    materialTypes,
    scaffoldingSizes,
    chimneyTypes,
    fieldValues,
  ]);

  const calculateMutation = useMutation({
    mutationFn: async (data: CalculationInput) => {
      console.log("Submitting calculation data:", data);
      const res = await apiRequest("POST", "/api/calculations", data);
      return res.json();
    },
    onSuccess: (calculation: Calculation) => {
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      calculate(calculation);
      setLastCalculation(calculation);
      // Clear localStorage after successful calculation
      localStorage.removeItem('calculatorFormData');
    },
    onError: (error: Error) => {
      toast({
        title: "Beräkning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculate = (calculation: Calculation) => {
    setPayMarginPrice(
      Math.ceil(calculation.totalCost * payMarginPercent * 0.01),
    );
    
    // Apply ROT cap based on owner amount
    const calculatedRot = Math.round(calculation.laborCost * (rotAvdrag / 100));
    const maxRot = 50000 * (calculation.inputData.customerOwnerAmount || 1);
    const finalRot = Math.min(calculatedRot, maxRot);
    
    setPriceToPay(
      Math.ceil(
        calculation.totalCost -
          finalRot +
          calculation.totalCost * payMarginPercent * 0.01,
      ),
    );
  }

  const processMutation = useMutation({
    mutationFn: async ({
      calculationId, data,
    }: {
      calculationId: number;
      data: CalculationProcess;
    }) => {
      console.log(data);
      const formData = new FormData();

      // Append standard data
      formData.append('calculationId', String(calculationId));
      formData.append('payMarginPrice', String(payMarginPrice));
      formData.append('payMarginPercent', String(payMarginPercent));
      formData.append('dealShare', String(dealShare));

      // Append fields from the 'data' (CalculationProcess) object
      formData.append('isDeal', String(data.isDeal));

      if (data.reasonNoDeal !== undefined) {
        formData.append('reasonNoDeal', data.reasonNoDeal);
      }
      if (data.revisit !== undefined) {
        formData.append('revisit', String(data.revisit));
      }
      if (data.processNotes !== undefined) {
        formData.append('processNotes', data.processNotes);
      }

      // Append agreementFile (single file)
      if (data.agreementFile instanceof File) {
        formData.append('agreementFile', data.agreementFile, data.agreementFile.name);
      }

      // Append projectFiles (array of files)
      if (data.projectImages && data.projectImages.length > 0) {
        data.projectImages.forEach((file) => {
          if (file instanceof File) {
            console.log("Saving a file: " + file.name);
            console.log(file);
            formData.append('projectFiles', file, file.name);
          }
        });
      }

      console.log("FormData to send: ");
      console.log(formData);

      const res = await apiRequest("POST", "/api/deals", formData);

      if (!res.ok && !(res instanceof Response && res.ok)) { // Check for fetch Response vs your apiRequest's return
        // Attempt to parse error if possible, or use a generic message
        let errorPayload;
        try {
            errorPayload = res instanceof Response ? await res.json() : res; // Adjust based on apiRequest
        } catch (e) {
            errorPayload = { message: "Failed to submit process data. Server returned an error." };
        }
        throw new Error(errorPayload.message || "Unknown error occurred");
      }

      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: (dealMade ? 'Affär' : 'Demo') + " sparad" });
      setIsProcessDialogOpen(false);
      setCurrentProcessStep(1);
      setHighestStepReached(1);
      setDealMade(null);
      queryClient.invalidateQueries({ queryKey: ["/api/calculations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      queryClient.invalidateQueries({ queryKey: ["/api/demos"] });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    }
  });

  const handleNextStep = () => {
    const nextStep = currentProcessStep + 1;
    setCurrentProcessStep(nextStep);
    setHighestStepReached(prev => Math.max(prev, nextStep));
  }

  const handleDealChoice = (choice) => { // choice is true or false
    setDealMade(choice);
    setHighestStepReached(1);
    handleNextStep();
  };

  const handleRevisitChoice = (choice) => {
    setRevisit(choice);
    handleNextStep();
  };

  const handleSaveProcess = () => {
    const formData = {
      isDeal: dealMade,
      agreementFile: dealMade === true ? agreementFile : undefined,
      projectImages: dealMade === true ? projectImages : undefined,
      reasonNoDeal: dealMade === false ? reasonNoDeal : undefined,
      revisit: dealMade === false ? revisit : undefined,
      processNotes: dealMade === true ? processNotes : undefined
    };
    console.log("Saving process data:");
    console.log(formData);
    console.log("lastCalculation: " + lastCalculation!.id);
    processMutation.mutate({calculationId: lastCalculation!.id,
                             data: formData,});
  };

  const handleNavigateToStep = (targetStep) => {
    // Only allow navigation to steps already reached or the current step
    if (targetStep <= highestStepReached) {
      setCurrentProcessStep(targetStep);
      // No need to update highestStepReached here, as we're only going back or to current
    }
  };

  useEffect(() => {
    const contentWrapper = document.getElementById('main-content-for-blur'); // Give your main content area an ID

    if (isProcessDialogOpen) {
      // document.body.classList.add('dialog-open-blur'); // Option 1: Blur the whole body
      if (contentWrapper) {
          contentWrapper.classList.add('dialog-open-blur'); // Option 2: Blur specific wrapper
      }
      // Optional: Prevent body scrolling
      document.body.style.overflow = 'hidden';
    } else {
      // document.body.classList.remove('dialog-open-blur');
      if (contentWrapper) {
          contentWrapper.classList.remove('dialog-open-blur');
      }
      document.body.style.overflow = '';
    }

    // Cleanup function to remove class if component unmounts while dialog is open
    return () => {
      // document.body.classList.remove('dialog-open-blur');
      if (contentWrapper) {
          contentWrapper.classList.remove('dialog-open-blur');
      }
      document.body.style.overflow = '';
    };
  }, [isProcessDialogOpen]);

  const getScaffoldingVisibility = (sizeName, currentArea) => {
    const name = sizeName.toLowerCase();

    if (name.includes('up_to_150')) {
      // Show "Under 150 kvm" if the area is actually less than 150
      return currentArea < 150;
    }
    if (name.includes('over_150')) {
      return currentArea < 200;
    }
    if (name.includes('over_200')) {
      return currentArea < 250;
    }
    return true;
  };

  const handleSubmit = (data: CalculationInput) => {
    const calculationData = {
      ...data,
      ...fieldValues, // Include all dynamic field values
      customerName,
      customerPhone,
      customerEmail,
      customerAdress,
      customerOwnerAmount,
      area: area, // Ta bort? 
      raspont: raspont, // Ta bort? 
    };
    console.log("Submitting calculation:", calculationData);
    calculateMutation.mutate(calculationData);
  };

  // Function to save current form state to localStorage
  const saveFormDataToLocalStorage = () => {
    const formData = {
      customerName,
      customerPhone,
      customerEmail,
      customerAdress,
      customerOwnerAmount,
      area,
      raspont,
      raspontRivning,
      dukType,
      extra,
      milage,
      payMarginPercent,
      fieldValues,
      roofType: form.getValues("roofType"),
      materialType: form.getValues("materialType"),
      scaffoldingSize: form.getValues("scaffoldingSize"),
      chimneyType: form.getValues("chimneyType"),
      advancedScaffolding: form.getValues("advancedScaffolding"),
      twoFloorScaffolding: form.getValues("twoFloorScaffolding"),
    };

    localStorage.setItem('calculatorFormData', JSON.stringify(formData));
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: numValue,
    }));
    form.setValue(fieldName as any, numValue);

    // Save to localStorage after state update
    setTimeout(saveFormDataToLocalStorage, 0);
  };

  // Helper function to get current price for admin users
  const getAdminPriceDisplay = (fieldName: string) => {
    // Only show prices for head_admin and sales_admin, hide from sales_person
    if (!canViewPrices || !currentPrices || !currentPrices[fieldName]) {
      return "";
    }
    
    const priceData = currentPrices[fieldName];
    if (priceData.material > 0 && priceData.arbete > 0) {
      return `Material: ${priceData.material.toLocaleString('sv-SE')}kr, Arbete: ${priceData.arbete.toLocaleString('sv-SE')}kr`;
    } else if (priceData.material > 0) {
      return `Material: ${priceData.material.toLocaleString('sv-SE')}kr`;
    } else if (priceData.arbete > 0) {
      return `Arbete: ${priceData.arbete.toLocaleString('sv-SE')}kr`;
    }
    return "";
  };

  // Helper function to get dropdown price display for admin users
  const getDropdownPriceDisplay = (dropdownType: 'roof' | 'material' | 'scaffolding' | 'chimney', selectedId: string | undefined) => {
    // Only show prices for head_admin and sales_admin, hide from sales_person and project_admin
    if (!canViewPrices || !selectedId) {
      return "";
    }

    let item: any = null;
    switch (dropdownType) {
      case 'roof':
        item = roofTypesDetailed?.find((r: any) => r.id === selectedId);
        if (item) {
          return `Material: ${item.materialCost.toLocaleString('sv-SE')}kr`;
        }
        break;
      case 'material':
        item = materialTypesDetailed?.find((m: any) => m.id === selectedId);
        if (item) {
          return `${item.costPerKvm.toLocaleString('sv-SE')}kr/kvm`;
        }
        break;
      case 'scaffolding':
        item = scaffoldingSizesDetailed?.find((s: any) => s.id === selectedId);
        if (item) {
          return `Kostnad: ${item.cost.toLocaleString('sv-SE')}kr`;
        }
        break;
      case 'chimney':
        item = chimneyTypesDetailed?.find((c: any) => c.id === selectedId);
        if (item) {
          const parts = [];
          if (item.materialCost > 0) parts.push(`Material: ${item.materialCost.toLocaleString('sv-SE')}kr`);
          if (item.laborCost > 0) parts.push(`Arbete: ${item.laborCost.toLocaleString('sv-SE')}kr`);
          return parts.join(', ');
        }
        break;
    }
    return "";
  };

  // Helper function to get radio button price display for admin users
  const getRadioButtonPriceDisplay = (radioType: 'raspont' | 'twoFloor' | 'advanced' | 'owners' | 'takpapp', isSelected: boolean | null | number | string) => {
    // Only show prices for head_admin and sales_admin, hide from sales_person and project_admin
    if (!canViewPrices) {
      return "";
    }

    switch (radioType) {
      case 'raspont':
        if (isSelected === null) return "";
        if (isSelected === true) {
          // Med Rivning
          return `Material: 200kr, Arbete: 250kr`;
        } else {
          // Utan Rivning  
          return `Material: 200kr, Arbete: 150kr`;
        }
        break;
      case 'twoFloor':
        if (isSelected === true) {
          return `Kostnad: 15 000kr`;
        }
        break;
      case 'advanced':
        if (isSelected === true) {
          return `Kostnad: 20 000kr`;
        }
        break;
      case 'owners':
        if (typeof isSelected === 'number') {
          const maxRot = isSelected * 50000;
          return `ROT max: ${maxRot.toLocaleString('sv-SE')}kr`;
        }
        break;
      case 'takpapp':
        if (typeof isSelected === 'string') {
          if (isSelected === "Trampsäker Duk") {
            return `Material: 150kr`;
          } else if (isSelected === "Underlagsduk RAW") {
            return `Material: 95kr`;
          }
        }
        break;
    }
    return "";
  };

  // Helper component for price display overlay
  const PriceOverlay = ({ fieldName, className = "" }: { fieldName: string; className?: string }) => {
    const priceDisplay = getAdminPriceDisplay(fieldName);
    if (!priceDisplay) return null;
    
    return (
      <div 
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-500 pointer-events-none font-medium whitespace-nowrap ${className}`}
        style={{ 
          zIndex: 1,
          textShadow: '0 0 3px rgba(255,255,255,0.8)'
        }}
      >
        {priceDisplay}
      </div>
    );
  };

  // Helper component for dropdown price display overlay
  const DropdownPriceOverlay = ({ 
    dropdownType, 
    selectedId, 
    className = "" 
  }: { 
    dropdownType: 'roof' | 'material' | 'scaffolding' | 'chimney'; 
    selectedId: string | undefined; 
    className?: string;
  }) => {
    const priceDisplay = getDropdownPriceDisplay(dropdownType, selectedId);
    if (!priceDisplay) return null;
    
    return (
      <div 
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-500 pointer-events-none font-medium whitespace-nowrap ${className}`}
        style={{ 
          zIndex: 1,
          textShadow: '0 0 3px rgba(255,255,255,0.8)'
        }}
      >
        {priceDisplay}
      </div>
    );
  };

  // Helper component for radio button price display overlay
  const RadioButtonPriceOverlay = ({ 
    radioType, 
    isSelected, 
    className = "" 
  }: { 
    radioType: 'raspont' | 'twoFloor' | 'advanced' | 'owners' | 'takpapp'; 
    isSelected: boolean | null | number | string; 
    className?: string;
  }) => {
    const priceDisplay = getRadioButtonPriceDisplay(radioType, isSelected);
    if (!priceDisplay) return null;
    
    return (
      <div 
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-500 pointer-events-none font-medium whitespace-nowrap ${className}`}
        style={{ 
          zIndex: 1,
          textShadow: '0 0 3px rgba(255,255,255,0.8)'
        }}
      >
        {priceDisplay}
      </div>
    );
  };

  if (
    !categories ||
    !roofTypes ||
    !materialTypes ||
    !scaffoldingSizes ||
    !chimneyTypes ||
    !rotAvdrag
  )
    return <div className="min-h-screen">
        <header className="title-area">
          <Navbar/>
        </header>
    </div>;


  return (
    <>
      <div id="main-content-for-blur" className="min-h-screen main-page-content-wrapper">
        <header className="title-area">
          <Navbar/>
        </header>

        {/* Calculator Page Header with Admin Button */}
        {canManagePrices && (
          <div className="flex justify-between items-center px-6 py-4 bg-gray-50 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Kalkyl</h1>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <AdminIcon className="w-4 h-4" />
                Kalkylinställningar
              </Button>
            </Link>
          </div>
        )}

        <main className="base">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="grid-container"
            >
              {/* Left Column - Input Fields */}
              <div className="grid-inputs">
                <CalculatorSection
                  title="Projekt"
                  >
                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Kundnamn</span>
                    </div>
                    <div className="flex flex-1">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          form.setValue("customerName", e.target.value);
                          setTimeout(saveFormDataToLocalStorage, 0);
                        }}
                        className={cn(
                          "input-field editable-input",
                          form.formState.errors.customerName && "!border-red-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Telefonnummer</span>
                    </div>
                    <div className="flex flex-1">
                      <input
                        type="text"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          form.setValue("customerPhone", e.target.value);
                          setTimeout(saveFormDataToLocalStorage, 0);
                        }}
                        className={cn(
                          "input-field editable-input",
                          form.formState.errors.customerPhone &&
                            "!border-red-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>E-postadress</span>
                    </div>
                    <div className="flex flex-1">
                      <input
                        type="text"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          form.setValue("customerEmail", e.target.value);
                          setTimeout(saveFormDataToLocalStorage, 0);
                        }}
                        className={cn(
                          "input-field editable-input",
                          form.formState.errors.customerEmail &&
                            "!border-red-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Adress</span>
                    </div>
                    <div className="flex flex-1">
                      <input
                        type="text"
                        value={customerAdress}
                        onChange={(e) => {
                          setCustomerAdress(e.target.value);
                          form.setValue("customerAdress", e.target.value);
                          setTimeout(saveFormDataToLocalStorage, 0);
                        }}
                        className={cn(
                          "input-field editable-input",
                          form.formState.errors.customerAdress &&
                            "!border-red-500",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Antal Ägare</span>
                    </div>
                    <div className="flex flex-1 relative">
                      <div className="flex ps-2 pe-8 gap-2">
                        <input
                          id="owner-one"
                          type="radio"
                          name="customerOwnerAmount"
                          value="1"
                          checked={customerOwnerAmount === 1}
                          onChange={() => {
                            setCustomerOwnerAmount(1);
                            form.setValue("customerOwnerAmount", 1);
                            setTimeout(saveFormDataToLocalStorage, 0);
                          }}
                          className={cn(
                            form.formState.errors.customerOwnerAmount &&
                              "!border-red-500",
                          )}
                        />
                        <label htmlFor="owner-one">
                          En
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <input
                          id="owner-two"
                          type="radio"
                          name="customerOwnerAmount"
                          value="2"
                          checked={customerOwnerAmount === 2}
                          onChange={() => {
                            setCustomerOwnerAmount(2);
                            form.setValue("customerOwnerAmount", 2);
                            setTimeout(saveFormDataToLocalStorage, 0);
                          }}
                          className={cn(
                            form.formState.errors.customerOwnerAmount &&
                              "!border-red-500",
                          )}
                        />
                        <label htmlFor="owner-two">
                          Två
                        </label>
                      </div>
                      {customerOwnerAmount && (
                        <RadioButtonPriceOverlay 
                          radioType="owners" 
                          isSelected={customerOwnerAmount} 
                          className="right-[-80px] top-1"
                        />
                      )}
                    </div>
                  </div>

                  <div className="input-group relative">
                    <FormField
                      control={form.control}
                      name="roofType"
                      render={({ field }) => (
                        <FormItem>
                          <div className="calculator-label">
                            <span>Taktyp</span>
                          </div>
                          <div className="relative">
                            <Select
                              onValueChange={(value) => {
                                const selectedType = roofTypes.find(
                                  (r) => r.id === value,
                                );
                                if (selectedType) {
                                  field.onChange(selectedType);
                                  setTimeout(saveFormDataToLocalStorage, 0);
                                }
                              }}
                              value={field.value?.id}
                            >
                              <SelectTrigger
                                className={cn(
                                  "select-trigger input-field !w-full calculator-dropdown-label",
                                  form.formState.errors.roofType &&
                                    "!border-red-500",
                                )}
                                style={{
                                  paddingRight: getDropdownPriceDisplay('roof', field.value?.id) ? '200px' : '40px'
                                }}
                              >
                                <SelectValue placeholder="Välj..." />
                              </SelectTrigger>
                              <SelectContent className="select-content">
                                {roofTypes.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id}
                                    className="select-item"
                                  >
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <DropdownPriceOverlay dropdownType="roof" selectedId={field.value?.id} />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </CalculatorSection>

                <CalculatorSection
                  title="Material KVM"
                  >
                  <div className="flex-col gap-4 relative">
                    <div className="calculator-label">
                      <span>Råspont</span>
                    </div>
                    <div className="flex gap-8 items-center">
                      <div className="flex flex-3 relative">
                        <div className="flex ps-2 pe-8 gap-2">
                          <input
                            type="radio"
                            value="Med Rivning"
                            checked={raspontRivning === true}
                            onChange={() => {
                              setRaspontRivning(true);
                              form.setValue("raspontRivning", true);
                            }}
                            className={cn(
                              form.formState.errors.raspontRivning &&
                                "!border-red-500",
                            )}
                          />
                          <label>
                            Med Rivning
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="radio"
                            value="Utan Rivning"
                            checked={raspontRivning === false}
                            onChange={() => {
                              setRaspontRivning(false);
                              form.setValue("raspontRivning", false);
                            }}
                            className={cn(
                              "input-field editable-input",
                              form.formState.errors.raspontRivning &&
                                "!border-red-500",
                            )}
                          />
                          <label>
                            Utan Rivning
                          </label>
                        </div>

                      </div>
                      <div className="flex flex-1 relative">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={
                            raspont === null || raspont === undefined ? "" : raspont
                          }
                          onChange={(e) => {
                            const newRaspont = Math.max(
                              0,
                              Math.floor(Number(e.target.value)),
                            );
                            setRaspont(newRaspont);
                            form.setValue("raspont", newRaspont);
                          }}
                          className={cn(
                            "input-field editable-input",
                            form.formState.errors.raspont && "!border-red-500",
                          )}
                          placeholder="Antal KVM..."
                          style={{
                            paddingRight: getRadioButtonPriceDisplay('raspont', raspontRivning) ? '280px' : '16px'
                          }}
                        />
                        <RadioButtonPriceOverlay 
                          radioType="raspont" 
                          isSelected={raspontRivning} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Tak Material</span>
                    </div>
                    <div className="flex gap-8">
                      <FormField
                        control={form.control}
                        name="materialType"
                        render={({ field }) => (
                          <FormItem className="flex flex-1">
                            <div className="relative">
                              <Select
                                onValueChange={(value) => {
                                  const selectedType = materialTypes.find(
                                    (m) => m.id === value,
                                  );
                                  if (selectedType) field.onChange(selectedType);
                                }}
                                value={field.value?.id}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "select-trigger calculator-dropdown-label",
                                    form.formState.errors.materialType &&
                                      "border-red-500",
                                  )}
                                  style={{
                                    paddingRight: getDropdownPriceDisplay('material', field.value?.id) ? '200px' : '40px'
                                  }}
                                >
                                  <SelectValue placeholder="Välj..." />
                                </SelectTrigger>
                                <SelectContent className="select-content dropdown-button-text">
                                  {materialTypes.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id}
                                      className="select-item"
                                    >
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <DropdownPriceOverlay dropdownType="material" selectedId={field.value?.id} />
                            </div>
                          </FormItem>
                        )}
                      />
                      <div className="flex flex-1">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={area === null || area === undefined ? "" : area}
                          onChange={(e) => {
                            const newArea = Math.max(
                              0,
                              Math.floor(Number(e.target.value)),
                            );
                            setArea(newArea);
                            form.setValue("area", newArea);
                            setTimeout(saveFormDataToLocalStorage, 0);
                          }}
                          className={cn(
                            "input-field editable-input",
                            form.formState.errors.area && "!border-red-500",
                          )}
                          placeholder="Antal KVM..."
                        />
                      </div>
                    </div>
                  </div>



                  <div className="flex-col gap-4">
                    <div className="calculator-label">
                      <span>Takpapp</span>
                    </div>
                    <div className="flex gap-8 items-center">
                      <div className="flex flex-1 relative">
                        <div className="flex ps-2 pe-8 gap-2">
                          <input
                            type="radio"
                            value="Trampsäker Duk"
                            checked={dukType === "Trampsäker Duk"}
                            onChange={() => {
                              setDukType("Trampsäker Duk");
                              form.setValue("dukType", "Trampsäker Duk");
                            }}
                            className={cn(
                              form.formState.errors.dukType &&
                                "!border-red-500",
                            )}
                          />
                          <label>
                            Trampsäker Duk
                          </label>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="radio"
                            value="Underlagsduk RAW"
                            checked={dukType === "Underlagsduk RAW"}
                            onChange={() => {
                              setDukType("Underlagsduk RAW");
                              form.setValue("dukType", "Underlagsduk RAW");
                            }}
                            className={cn(
                              "input-field editable-input",
                              form.formState.errors.dukType &&
                                "!border-red-500",
                            )}
                          />
                          <label>
                            Underlagsduk RAW
                          </label>
                        </div>
                        {dukType && (
                          <RadioButtonPriceOverlay 
                            radioType="takpapp" 
                            isSelected={dukType} 
                          />
                        )}
                      </div>
                      <div className="flex flex-2 locked-input-field">
                        {area === null || area === undefined ? 0 : area}
                      </div>
                    </div>
                  </div>
                </CalculatorSection>

                <CalculatorSection
                  title="Meter & Antal"
                  endContent=
                  <div className="flex flex-col justify-start">
                    <Button
                      type="submit"
                      className="login-button px-16 py-4"
                      disabled={calculateMutation.isPending}
                    >
                      <span className="submit-text">
                        {calculateMutation.isPending
                          ? "Beräknar..."
                          : "Beräkna"}
                      </span>
                    </Button>
                  </div>
                  >
                  {Object.entries(categories || {}).map(([fieldName, value]) => {
                    const adminPriceDisplay = getAdminPriceDisplay(fieldName);
                    return (
                      <div key={fieldName} className="flex-col items-center gap-4">
                        <div className="calculator-label capitalize">
                          <span>
                            {fieldName.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="flex flex-1 items-center relative">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={fieldValues[fieldName] || ""}
                            onChange={(e) =>
                              handleFieldChange(fieldName, e.target.value)
                            }
                            className={cn(
                              "input-field editable-input w-full",
                              form.formState.errors[
                                fieldName as keyof CalculationInput
                              ] && "!border-red-500",
                            )}
                            placeholder={
                              value.unitType === "Antal Meter"
                                ? "Antal Meter..."
                                : "Antal..."
                            }
                            style={{
                              paddingRight: adminPriceDisplay ? '200px' : '12px'
                            }}
                          />
                          <PriceOverlay fieldName={fieldName} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Övrigt</span>
                    </div>
                    <div className="flex flex-1">
                      <input
                        type="text"
                        value={
                          extra
                        }
                        onChange={(e) => {
                          setExtra(e.target.value);
                          form.setValue("extra", e.target.value);
                        }}
                        className={cn(
                          "input-field editable-input",
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Skorstensinklädnad</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="chimneyType"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Select
                              onValueChange={(value) => {
                                const selectedType = chimneyTypes?.find(
                                  (c) => c.id === value,
                                );
                                if (selectedType) field.onChange(selectedType);
                              }}
                              value={field.value?.id}
                            >
                              <SelectTrigger
                                className={cn(
                                  "select-trigger calculator-dropdown-label",
                                  form.formState.errors.chimneyType &&
                                    "border-red-500",
                                )}
                                style={{
                                  paddingRight: getDropdownPriceDisplay('chimney', field.value?.id) ? '200px' : '40px'
                                }}
                              >
                                <SelectValue placeholder="Välj..." />
                              </SelectTrigger>
                              <SelectContent className="select-content dropdown-button-text">
                                {chimneyTypes?.map((type) => (
                                  <SelectItem
                                    key={type.id}
                                    value={type.id}
                                    className="select-item"
                                  >
                                    {type.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <DropdownPriceOverlay dropdownType="chimney" selectedId={field.value?.id} />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Byggställning på tak</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="scaffoldingSize"
                      render={({ field }) => (
                        <FormItem>
                          <div className="relative">
                            <Select
                              onValueChange={(value) => {
                                const selectedSize = scaffoldingSizes.find(
                                  (s) => s.id === value,
                                );
                                if (selectedSize) field.onChange(selectedSize);
                              }}
                              value={field.value?.id}
                            >
                              <SelectTrigger
                                className={cn(
                                  "select-trigger calculator-dropdown-label",
                                  form.formState.errors.scaffoldingSize &&
                                    "border-red-500",
                                )}
                                style={{
                                  paddingRight: getDropdownPriceDisplay('scaffolding', field.value?.id) ? '200px' : '40px'
                                }}
                              >
                                <SelectValue placeholder="Välj..." />
                              </SelectTrigger>
                              <SelectContent className="select-content dropdown-button-text">
                                {scaffoldingSizes.map((size) => {
                                  const isVisible = getScaffoldingVisibility(size.id, area);
                                  if (isVisible) {
                                    return (
                                      <SelectItem
                                        key={size.id}
                                        value={size.id}
                                        className="select-item"
                                      >
                                        {size.name}
                                      </SelectItem>
                                    );
                                  }
                                  return null; 
                                })}
                              </SelectContent>
                            </Select>
                            <DropdownPriceOverlay dropdownType="scaffolding" selectedId={field.value?.id} />
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Byggställning Två Våningar</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="twoFloorScaffolding"
                      rules={{ required: "Välj ett alternativ" }}
                      render={({ field }) => (
                        <FormItem className="inline-flex gap-4 items-baseline">

                          {/* Div med "Ja" alternativ */}
                          <div
                            className={cn(
                              `calculator-yes-button relative
                              ${field.value === true ? "radio-button-true" : ""}`,
                              form.formState.errors.twoFloorScaffolding &&
                                "!border-red-500",
                            )}
                            onClick={() => field.onChange(true)}
                            style={{
                              paddingRight: field.value === true && getRadioButtonPriceDisplay('twoFloor', field.value) ? '150px' : '16px'
                            }}
                          >
                            <span
                              className={`button-text 
                              ${field.value === true ? "text-white" : ""}`}
                            >
                              Ja
                            </span>
                            {field.value === true && (
                              <RadioButtonPriceOverlay 
                                radioType="twoFloor" 
                                isSelected={field.value} 
                                className="text-white"
                              />
                            )}
                          </div>

                          {/* Div med "Nej" alternativ */}
                          <div
                            className={cn(
                              `calculator-no-button
                              ${field.value === false ? "radio-button-false" : ""}`,
                              form.formState.errors.twoFloorScaffolding &&
                                "!border-red-500",
                            )}
                            onClick={() => field.onChange(false)}
                          >
                            <span
                              className={`button-text 
                              ${field.value === false ? "text-white" : ""}`}
                            >
                              Nej
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex-col items-center gap-4">
                    <div className="calculator-label">
                      <span>Milersättning (minst 2 mil)</span>
                    </div>
                    <div className="flex flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          milage || undefined
                        }
                        onChange={(e) => {
                          const numValue = Math.max(0, parseInt(e.target.value) || 0);
                          setMilage(numValue);
                          form.setValue("milage", numValue);
                        }}
                        className={cn(
                          "input-field editable-input",
                          form.formState.errors.milage &&
                            "!border-red-500",
                        )}
                        style={{
                          paddingRight: canViewPrices ? '120px' : '16px'
                        }}
                      />
                      {canViewPrices && (
                        <div 
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-green-500 pointer-events-none font-medium whitespace-nowrap"
                          style={{ 
                            zIndex: 1,
                            textShadow: '0 0 3px rgba(255,255,255,0.8)'
                          }}
                        >
                          2 510kr/mil
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-col items-center gap-4 !hidden"> {/* Ta bort '!hidden' för att visa Avancerad Byggställning */}
                    <div className="calculator-label">
                      <span>Avancerad Byggställning</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="advancedScaffolding"
                      rules={{ required: "Välj ett alternativ" }}
                      render={({ field }) => (
                        <FormItem className="inline-flex gap-4 items-baseline">

                          {/* Div med "Ja" alternativ */}
                          <div
                            className={cn(
                              `calculator-yes-button relative
                              ${field.value === true ? "radio-button-true" : ""}`,
                              form.formState.errors.advancedScaffolding &&
                                "!border-red-500",
                            )}
                            onClick={() => field.onChange(true)}
                            style={{
                              paddingRight: field.value === true && getRadioButtonPriceDisplay('advanced', field.value) ? '150px' : '16px'
                            }}
                          >
                            <span
                              className={`button-text 
                              ${field.value === true ? "text-white" : ""}`}
                            >
                              Ja
                            </span>
                            {field.value === true && (
                              <RadioButtonPriceOverlay 
                                radioType="advanced" 
                                isSelected={field.value} 
                                className="text-white"
                              />
                            )}
                          </div>

                          {/* Div med "Nej" alternativ */}
                          <div
                            className={cn(
                              `calculator-no-button
                              ${field.value === false ? "radio-button-false" : ""}`,
                              form.formState.errors.advancedScaffolding &&
                                "!border-red-500",
                            )}
                            onClick={() => field.onChange(false)}
                          >
                            <span
                              className={`button-text 
                              ${field.value === false ? "text-white" : ""}`}
                            >
                              Nej
                            </span>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>

                </CalculatorSection>
              </div>

              {/* Right Column - Results */}
              <div className="grid-results">
                {lastCalculation && (
                  <>
                    <CalculatorSection
                      title="Uträkning"
                      endContent=
                        <div className="flex flex-col justify-start">
                          <Button type="button" className="login-button px-16 py-4" onClick={() => {
                            setIsProcessDialogOpen(true);
                          }}>
                            <span className="submit-text">Spara</span>
                          </Button>
                        </div>
                      >
                      <div className="flex-col items-center gap-4">
                        <div className="calculator-label">
                          <span>Dela Affär</span>
                        </div>
                        <FormField
                          control={form.control}
                          name="dealShare"
                          render={({ field }) => (
                            <FormItem>
                              <Select
                                onValueChange={(value) => {
                                  const selectedType = otherUsers?.find(
                                    (c) => c.id === value,
                                  );
                                  if (selectedType) field.onChange(selectedType);
                                  setDealShare(selectedType);
                                }}
                                value={field.value?.id}
                              >
                                <SelectTrigger
                                  className="select-trigger calculator-dropdown-label"
                                >
                                  <SelectValue placeholder="Välj..." />
                                </SelectTrigger>
                                <SelectContent className="select-content dropdown-button-text">
                                  <SelectItem
                                    key={'Ingen'}
                                    value={'Ingen'}
                                    className="select-item"
                                  >
                                    Ingen
                                  </SelectItem>
                                  {otherUsers?.map((type) => (
                                    <SelectItem
                                      key={type.id}
                                      value={type.id}
                                      className="select-item"
                                    >
                                      {type.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {/* <FormMessage /> */}
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex-col items-center gap-4">
                        <div className="calculator-label">
                          <span>Marginal: {payMarginPercent}%</span>
                        </div>
                        <FormField
                          control={form.control}
                          name="payMarginPercent"
                          render={({ field }) => (
                            <FormItem className="flex w-full flex-col space-y-2 pt-2">

                              <div className="flex items-center space-x-2 slider-container">
                                {/* Slider */}
                                <input
                                  type="range"
                                  min="0"
                                  max="10"
                                  step="1"
                                  value={payMarginPercent}
                                  onChange={(e) => {
                                    const newValue = Number(e.target.value);
                                    setPayMarginPercent(newValue); // Uppdaterar payMargin
                                    setPayMarginPrice(
                                      Math.ceil(
                                        lastCalculation.totalCost * newValue * 0.01,
                                      ),
                                    );
                                    // Recalculate ROT with cap when margin changes
                                    const calculatedRot = Math.round(lastCalculation.laborCost * (rotAvdrag / 100));
                                    const maxRot = 50000 * (lastCalculation.inputData.customerOwnerAmount || 1);
                                    const finalRot = Math.min(calculatedRot, maxRot);
                                    
                                    setPriceToPay(
                                      Math.ceil(
                                        lastCalculation.totalCost -
                                          finalRot +
                                          lastCalculation.totalCost *
                                            newValue *
                                            0.01,
                                      ),
                                    );
                                  }}
                                  className="slider"
                                />
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label">
                          <span>Marginal</span>
                        </div>
                        <span className="calculator-result-field">{formatPrice(payMarginPrice)}</span>

                      </div>
                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label">
                          <span>Totalt pris före Rot</span>
                        </div>
                        <span className="calculator-result-field">{formatPrice(lastCalculation.totalCost)}</span>
                      </div>

                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label">
                          <span>Totalt Rot</span>
                        </div>
                        <span className="calculator-result-field">{formatPrice(lastCalculation.rotAvdrag)}</span>
                      </div>

                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label">
                          <span>Arbetskostnad</span>
                        </div>
                        <span className="calculator-result-field">{formatPrice(lastCalculation.laborCost)}</span>
                      </div>

                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label">
                          <span>Materialkostnad</span>
                        </div>
                        <span className="calculator-result-field">{formatPrice(lastCalculation.materialCost)}</span>
                      </div>

                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label">
                          <span>Kr/mån (3,9%)</span>
                        </div>
                        <span className="calculator-result-field">{formatPrice(Math.ceil((priceToPay * monthCost) / 12))}</span>
                      </div>

                      <div className="flex-col items-center gap-4">
                        <div className="calculator-result-label !font-bold">
                          <span>Pris att betala</span>
                        </div>
                        <span className="calculator-result-field !font-bold">{formatPrice(priceToPay)}</span>
                      </div>
                    </CalculatorSection>

                    <div className="flex flex-row justify-center mt-6 gap-4">
                      {/* <Button
                        type="button"
                        onClick={() =>
                          saveDemoMutation.mutate({
                            calculationId: lastCalculation.id,
                          })
                        }
                        disabled={saveDemoMutation.isPending}
                        variant="secondary"
                        className="demo-button"
                      >
                        <span className="submit-text">
                          {saveDemoMutation.isPending
                            ? "Sparar..."
                            : "Spara Demo"}
                        </span>
                        <DemoIcon className="!h-6"/>
                      </Button>
                      <Button
                        type="button"
                        onClick={() =>
                          saveDealMutation.mutate({
                            calculationId: lastCalculation.id,
                          })
                        }
                        disabled={saveDealMutation.isPending}
                        variant="secondary"
                        className="submit-button"
                      >
                        <span className="submit-text">
                          {saveDealMutation.isPending
                            ? "Sparar..."
                            : "Spara affär"}
                        </span>
                        <DealsIcon className="!h-6"/>
                      </Button> */}
                    </div>
                  </>
                )}
              </div>
            </form>
          </Form>

        </main>
      </div>
      {isProcessDialogOpen && (
        <ProcessDialog
          currentStep={currentProcessStep}
          highestStepReached={highestStepReached}
          nextStep={handleNextStep}
          dealMade={dealMade}
          onDealChoice={handleDealChoice}
          reasonNoDeal={reasonNoDeal}
          onReasonChange={setReasonNoDeal}
          revisit={revisit}
          onRevisitChoice={handleRevisitChoice}
          agreementFile={agreementFile}
          onAgreementFileChange={setAgreementFile}
          projectImages={projectImages}
          onProjectImagesChange={setProjectImages}
          processNotes={processNotes}
          onProcessNotesChange={setProcessNotes}
          onClose={() => setIsProcessDialogOpen(false)}
          onSaveDeal={handleSaveProcess}
          isSaving={processMutation.isLoading}
          onNavigateToStep={handleNavigateToStep}
          calculation={lastCalculation}
          // Pass functions to navigate steps if needed, or handle it via choices
          // onNextStep={() => {
          //   const next = currentProcessStep + 1;
          //   setCurrentProcessStep(next);
          //   setHighestStepReached(prev => Math.max(prev, next));
          // }}
        />
      )}
    </>
  );
}