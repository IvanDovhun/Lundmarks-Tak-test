import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import React, { useState, useEffect, useRef } from "react";
import SignatureCanvas from 'react-signature-canvas';
import { HomeIcon, ProjectIcon } from '../icons/svg';
import { formDataSchema, type FormDataSchemaType, type Calculation } from "@shared/schema"; // Make sure schema is correctly imported and defined
import { Button } from "@/components/ui/button"; // Assuming Button is used for clear signature
// import { SignatureField } from "@/components/ui/signature"; // Not used directly in this code, SignatureCanvas is used
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define a type for the errors state
type FormErrors = Partial<Record<keyof FormDataSchemaType | 'signature', string>>; // Include 'signature' key

const today = new Date();
// --- Initial State (ensure it aligns with schema types) ---
const initialState: FormDataSchemaType = {
  calculationId: -1,
  kundnummer: '',
  tel1: '',
  tel2: '', // Optional based on schema
  kundFirstName: '',
  kundLastName: '',
  address: '',
  startDatum: today,
  slutDatum: new Date(today.getFullYear(), today.getMonth(), today.getDate()+8),
  projektorFirstName: '', // Optional?
  projektorLastName: '',  // Optional?
  projektorTel: '',       // Optional?
  projektledareFirstName: '', // Optional?
  projektledareLastName: '',  // Optional?
  projektledareTel: '',       // Optional?
  lutning: 0, // Assuming 0 is not valid if schema requires positive()
  takbredd: 0,
  takfall: 0,
  takfotTillMark: 0,
  totalYta: 0,
  typAvTak: '',
  raspont: 0,
  valAvTakmaterial: '',
  farg: '',
  snorasskydd: 0,
  placeringSnorasskydd: '', // Optional?
  snorasskyddFarg: '',      // Optional?
  hangranna: 0,
  hangrannaFarg: '',      // Optional?
  ranndalar: 0,
  ranndalarFarg: '',      // Optional?
  fotplat: 0,
  fotplatFarg: '',        // Optional?
  vindskiveplat: 0,
  vindskiveplatFarg: '',  // Optional?
  stupror: 0,
  stuprorFarg: '',        // Optional?
  takstege: 0,
  takstegeFarg: '',       // Optional?
  avsatsSkorsten: '',     // Optional?
  skorsten: '',
  skorstenFarg: '',       // Optional?
  avluftning: 0,
  ventilation: 0,
  tillagg: {
    malaVindskivor: false,
    vaderskyddSkorsten: false,
  },
  ovrigt: '', // Optional?
  kundFirstName2: '',
  kundLastName2: '',
  preliminarROT: 0,
};


export default function FillFormPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [showSignPlaceholder, setShowSignPlaceholder] = useState(true);

  const [formData, setFormData] = useState<FormDataSchemaType>(initialState);
  const [errors, setErrors] = useState<FormErrors>({}); // State for errors

  const { data: queryData } = useQuery<Calculation | undefined>({
    queryKey: ['fill-form'],
    enabled: true,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    console.log('queryData: ', queryData);

    if (queryData) {
      console.log("Pre-filling form with data");
      // Map query data to form state, ensuring alignment with initialState structure
      const mappedData: Partial<FormDataSchemaType> = {
        calculationId: queryData.id,
        tel1: queryData.inputData.customerPhone ?? initialState.tel1,
        kundFirstName: queryData.inputData.customerName ? queryData.inputData.customerName.split(' ')[0] : initialState.kundFirstName,
        kundLastName: queryData.inputData.customerName ? (queryData.inputData.customerName.split(' ').length > 1 ? queryData.inputData.customerName.split(' ').slice(1).join(' ') : initialState.kundLastName) : initialState.kundLastName, // Handle multiple last names
        address: queryData.inputData.customerAdress ?? initialState.address,
        totalYta: queryData.inputData['area'] ?? initialState.totalYta,
        typAvTak: queryData.inputData['roofType']?.name ?? initialState.typAvTak, // Use optional chaining
        raspont: queryData.inputData['raspont'] ?? initialState.raspont,
        valAvTakmaterial: queryData.inputData['materialType']?.name ?? initialState.valAvTakmaterial, // Optional chaining
        snorasskydd: queryData.inputData['snörasskydd'] ?? initialState.snorasskydd,
        hangranna: queryData.inputData['hängränna'] ?? initialState.hangranna,
        ranndalar: queryData.inputData['ränndalar'] ?? initialState.ranndalar,
        fotplat: queryData.inputData['fotplåt'] ?? initialState.fotplat,
        vindskiveplat: queryData.inputData['vindskivor'] ?? initialState.vindskiveplat,
        stupror: queryData.inputData['stuprör'] ?? initialState.stupror,
        takstege: queryData.inputData['takstege'] ?? initialState.takstege,
        avluftning: queryData.inputData['avluftning'] ?? initialState.avluftning,
        ventilation: queryData.inputData['ventilation'] ?? initialState.ventilation,
        skorsten: queryData.inputData.chimneyType?.name ?? initialState.skorsten, // Optional chaining
        // Assuming kundFirstName2/LastName2 are same as primary customer for prefill
        kundFirstName2: queryData.inputData.customerName ? queryData.inputData.customerName.split(' ')[0] : initialState.kundFirstName2,
        kundLastName2: queryData.inputData.customerName ? (queryData.inputData.customerName.split(' ').length > 1 ? queryData.inputData.customerName.split(' ').slice(1).join(' ') : initialState.kundLastName2) : initialState.kundLastName2,
        // Add other fields from queryData if available
        preliminarROT: queryData.inputData.preliminaryRotDeduction ?? initialState.preliminarROT, // Example field name
      };
      setFormData(prev => ({ ...prev, ...mappedData })); // Merge safely
      console.log(queryData.inputData['materialType']?.name);
    }
  }, [queryData]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    const target = e.target as HTMLInputElement; // Cast for checkbox/radio specifics
    const isCheckbox = type === 'checkbox';
    const isRadio = type === 'radio';
    const checked = isCheckbox ? target.checked : undefined;
    const group = target.dataset?.group;

    setFormData(prevFormData => {
      let newValue: string | number | boolean;

      // Handle type conversions
      if (type === 'number') {
        newValue = value === '' ? 0 : parseFloat(value) || 0; // Convert to number, default to 0 for empty/invalid
      } else if (isCheckbox) {
        newValue = checked ?? false;
      } else {
        newValue = value;
      }

      // Update nested state for 'tillagg' group
      if (group === 'tillagg' && isCheckbox) {
        const tillaggName = name as keyof FormDataSchemaType['tillagg'];
        return {
          ...prevFormData,
          tillagg: {
            ...prevFormData.tillagg,
            [tillaggName]: newValue as boolean
          }
        };
      } else {
        // Update top-level state
        const fieldName = name as keyof FormDataSchemaType;
        return {
          ...prevFormData,
          [fieldName]: newValue
        };
      }
    });

    // Clear error for the field being changed
    if (errors[name as keyof FormErrors]) {
        setErrors(prevErrors => ({ ...prevErrors, [name]: undefined }));
    }
  };


  const submitMutation = useMutation({
    mutationFn: async (data: FormDataSchemaType & { signature: string }) => { // Expect signature
      console.log("Submitting projektering:", data);
      const res = await apiRequest("POST", "/api/project-form/submit", data);
      if (!res.ok) {
         // Try to parse error message from backend response
         let errorMessage = `Server error: ${res.status}`;
         try {
             const errorData = await res.json();
             errorMessage = errorData.message || errorData.error || errorMessage;
         } catch (e) {
             // Ignore if response is not JSON
         }
         throw new Error(errorMessage);
      }
      return res.json();
    },
    onSuccess: (/* calculation: Calculation */) => { // Type might differ based on actual return
      toast({ title: "Projektering inskickad!" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/calculations"] }); // Adjust query key if needed
      navigate("/crm"); // Or wherever appropriate
    },
    onError: (error: Error) => {
      console.error("Submission Error:", error);
      toast({
        title: "Inskickning misslyckades",
        description: error.message || "Ett okänt fel inträffade.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({}); // Clear previous errors

    // --- Zod Validation ---
    // Make sure formDataSchema handles type coercion correctly if needed,
    // although handleChange now converts number inputs properly.
    const validationResult = formDataSchema.safeParse(formData);
    const isSignatureEmpty = sigPadRef.current && sigPadRef.current.isEmpty();

    let hasErrors = false;
    const newErrors: FormErrors = {};

    // Process Zod errors
    if (!validationResult.success) {
      hasErrors = true;
      validationResult.error.errors.forEach((err) => {
        const fieldName = err.path[0] as keyof FormDataSchemaType;
        if (fieldName && !newErrors[fieldName]) {
          newErrors[fieldName] = err.message;
        }
      });
      console.log("Zod Errors:", newErrors);
    }

    // Process Signature error
    if (isSignatureEmpty) {
      hasErrors = true;
      newErrors['signature'] = "Signatur är obligatorisk.";
      console.log("Signature Error: Signature is missing.");
    }

    // Update the error state
    setErrors(newErrors);

    // --- If Errors Found, Stop Submission ---
    if (hasErrors) {
      toast({
        title: "Formuläret innehåller fel",
        description: "Vänligen korrigera de markerade fälten.",
        variant: "destructive",
      });
      // Optionally scroll to the first error field
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        // Try to find element by name or the specific signature container id
        const errorElement = document.querySelector(`[name="${firstErrorKey}"], #signature-field-container`);
        errorElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    // --- If No Errors ---
    console.log("Form validation passed. Submitting...");

    // Add signature data to the validated data before submitting
    const signatureDataUrl = sigPadRef.current?.toDataURL() || ""; // Get signature as base64, provide fallback
    const dataToSubmit = {
      ...validationResult.data, // Use the clean data from Zod parse result
      signature: signatureDataUrl
    };

    submitMutation.mutate(dataToSubmit);
  };

  const clearSignature = () => {
    if (sigPadRef.current) {
        sigPadRef.current.clear();
        setShowSignPlaceholder(true); // Show placeholder again
        // Clear signature error if present
        if (errors.signature) {
            setErrors(prev => ({ ...prev, signature: undefined }));
        }
    }
  };

  const handleSignatureBeginDrawing = () => {
    setShowSignPlaceholder(false); // Hide placeholder on drawing start
     // Clear signature error if present when user starts drawing
     if (errors.signature) {
        setErrors(prev => ({ ...prev, signature: undefined }));
    }
  };

  // Helper function to handle number input changes and ensure state gets a number
  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      const numericValue = value === '' ? 0 : parseFloat(value); // Allow clearing to 0, adjust if null/undefined preferred
      handleChange({
          target: {
              name,
              value: isNaN(numericValue) ? 0 : numericValue, // Ensure it's a number, default to 0 if NaN
              type: 'number' // Pass type for context
          }
      } as any); // Cast needed as we're constructing the event object
  };


  return (
    <div className="min-h-screen">
      <header className="title-area">
        <div className="base px-16 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="calculator-title !mb-0">Projekteringsmall</span>
            <ProjectIcon className="h-9 w-6"/>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/crm/" className="ps-0">
              <div className="button">
                <HomeIcon className="h-6 w-4"/>
                <span className="button-text">Tillbaka</span>
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main className="base text-center pt-5">

        {/* Add noValidate to disable default HTML5 validation */}
        <form className="form-container" onSubmit={handleSubmit} noValidate>

          {/* --- Kundnummer --- */}
          <div className="form-group">
            <label htmlFor="kundnummer" className="form-label">Kundnummer</label>
            <input
              type="text"
              id="kundnummer"
              name="kundnummer"
              className={`input-field editable-input !w-full ${errors.kundnummer ? '!border-red-500' : ''}`}
              value={formData.kundnummer}
              onChange={handleChange}
              aria-invalid={!!errors.kundnummer}
              aria-describedby={errors.kundnummer ? "kundnummer-error" : undefined}
            />
            <p className="form-helperText">Exempel: P1000</p>
            {errors.kundnummer && <p id="kundnummer-error" className="text-red-500 text-sm mt-1 text-left">{errors.kundnummer}</p>}
          </div>

          {/* --- Tel 1 --- */}
          <div className="form-group">
            <label htmlFor="tel1" className="form-label">Tel 1</label>
            <input
              type="tel"
              id="tel1"
              name="tel1"
              className={`input-field editable-input !w-full ${errors.tel1 ? '!border-red-500' : ''}`}
              value={formData.tel1}
              onChange={handleChange}
              placeholder="(000) 000-0000"
              aria-invalid={!!errors.tel1}
              aria-describedby={errors.tel1 ? "tel1-error" : undefined}
            />
            <p className="form-helperText">Vänligen skriv ett giltigt telefonnummer.</p>
            {errors.tel1 && <p id="tel1-error" className="text-red-500 text-sm mt-1 text-left">{errors.tel1}</p>}
          </div>

          {/* --- Tel 2 --- */}
          <div className="form-group">
            <label htmlFor="tel2" className="form-label">Tel 2 (Valfri)</label>
            <input
              type="tel"
              id="tel2"
              name="tel2"
              className={`input-field editable-input !w-full ${errors.tel2 ? '!border-red-500' : ''}`} // Style error even if optional if schema has rules
              value={formData.tel2}
              onChange={handleChange}
              placeholder="(000) 000-0000"
              aria-invalid={!!errors.tel2}
              aria-describedby={errors.tel2 ? "tel2-error" : undefined}
            />
            {/* <p className="form-helperText">Vänligen skriv ett giltigt telefonnummer.</p> */}
            {errors.tel2 && <p id="tel2-error" className="text-red-500 text-sm mt-1 text-left">{errors.tel2}</p>}
          </div>

          {/* --- Kund (First Name / Last Name Row) --- */}
          <label className="form-label">Kund</label>
          <div className="form-rowContainer form-row">
            <div className="form-group">
              <input
                type="text"
                id="kundFirstName"
                name="kundFirstName"
                className={`input-field editable-input !w-full ${errors.kundFirstName ? '!border-red-500' : ''}`}
                value={formData.kundFirstName}
                onChange={handleChange}
                aria-invalid={!!errors.kundFirstName}
                aria-describedby={errors.kundFirstName ? "kundFirstName-error" : undefined}
              />
              <p className="form-helperText">Förnamn</p>
              {errors.kundFirstName && <p id="kundFirstName-error" className="text-red-500 text-sm mt-1 text-left">{errors.kundFirstName}</p>}
            </div>
            <div className="form-group">
              <input
                type="text"
                id="kundLastName"
                name="kundLastName"
                className={`input-field editable-input !w-full ${errors.kundLastName ? '!border-red-500' : ''}`}
                value={formData.kundLastName}
                onChange={handleChange}
                aria-invalid={!!errors.kundLastName}
                 aria-describedby={errors.kundLastName ? "kundLastName-error" : undefined}
             />
              <p className="form-helperText">Efternamn</p>
              {errors.kundLastName && <p id="kundLastName-error" className="text-red-500 text-sm mt-1 text-left">{errors.kundLastName}</p>}
            </div>
          </div>

          {/* --- Address --- */}
          <div className="form-group">
            <label htmlFor="address" className="form-label">Adress</label>
            <input
              type="text"
              id="address"
              name="address"
              className={`input-field editable-input !w-full ${errors.address ? '!border-red-500' : ''}`}
              value={formData.address}
              onChange={handleChange}
              aria-invalid={!!errors.address}
              aria-describedby={errors.address ? "address-error" : undefined}
            />
            <p className="form-helperText">Gata, Postnummer, Stad</p>
            {errors.address && <p id="address-error" className="text-red-500 text-sm mt-1 text-left">{errors.address}</p>}
          </div>

          {/* --- Startdatum --- */}
          <div className="form-group">
            <label htmlFor="startDatum" className="form-label">Startdatum</label>
            <input
              type="date"
              id="startDatum"
              name="startDatum"
              className={`input-field editable-input !w-full ${errors.startDatum ? '!border-red-500' : ''}`} // Style error even if optional if schema has rules
              value={formData.startDatum.toISOString().slice(0, 10)}
              onChange={handleChange}
              aria-invalid={!!errors.startDatum}
              aria-describedby={errors.startDatum ? "startDatum-error" : undefined}
            />
            {/* <p className="form-helperText">Vänligen skriv ett giltigt telefonnummer.</p> */}
            {errors.startDatum && <p id="startDatum-error" className="text-red-500 text-sm mt-1 text-left">{errors.startDatum}</p>}
          </div>

          {/* --- Slutdatum --- */}
          <div className="form-group">
            <label htmlFor="slutDatum" className="form-label">Startdatum</label>
            <input
              type="date"
              id="slutDatum"
              name="slutDatum"
              className={`input-field editable-input !w-full ${errors.slutDatum ? '!border-red-500' : ''}`} // Style error even if optional if schema has rules
              value={formData.slutDatum.toISOString().slice(0, 10)}
              onChange={handleChange}
              aria-invalid={!!errors.slutDatum}
              aria-describedby={errors.slutDatum ? "slutDatum-error" : undefined}
            />
            {/* <p className="form-helperText">Vänligen skriv ett giltigt telefonnummer.</p> */}
            {errors.slutDatum && <p id="slutDatum-error" className="text-red-500 text-sm mt-1 text-left">{errors.slutDatum}</p>}
          </div>

          <div className="form-separator"></div>

          {/* --- Projektör (First Name / Last Name Row) - Assuming Optional --- */}
          <label className="form-label">Projektör (Valfri)</label>
          <div className="form-rowContainer form-row">
            <div className="form-group">
              <input
                type="text"
                id="projektorFirstName"
                name="projektorFirstName"
                className={`input-field editable-input !w-full ${errors.projektorFirstName ? '!border-red-500' : ''}`}
                value={formData.projektorFirstName}
                onChange={handleChange}
                 aria-invalid={!!errors.projektorFirstName}
                 aria-describedby={errors.projektorFirstName ? "projektorFirstName-error" : undefined}
             />
              <p className="form-helperText">Förnamn</p>
              {errors.projektorFirstName && <p id="projektorFirstName-error" className="text-red-500 text-sm mt-1 text-left">{errors.projektorFirstName}</p>}
            </div>
            <div className="form-group">
              <input
                type="text"
                id="projektorLastName"
                name="projektorLastName"
                className={`input-field editable-input !w-full ${errors.projektorLastName ? '!border-red-500' : ''}`}
                value={formData.projektorLastName}
                onChange={handleChange}
                 aria-invalid={!!errors.projektorLastName}
                 aria-describedby={errors.projektorLastName ? "projektorLastName-error" : undefined}
             />
              <p className="form-helperText">Efternamn</p>
              {errors.projektorLastName && <p id="projektorLastName-error" className="text-red-500 text-sm mt-1 text-left">{errors.projektorLastName}</p>}
            </div>
          </div>

          {/* --- Telefon Projektör (Optional) --- */}
          <div className="form-group">
            <label htmlFor="projektorTel" className="form-label">Telefonnummer (Valfri)</label>
            <input
              type="tel"
              id="projektorTel"
              name="projektorTel"
              className={`input-field editable-input !w-full ${errors.projektorTel ? '!border-red-500' : ''}`}
              value={formData.projektorTel}
              onChange={handleChange}
              placeholder="(000) 000-0000"
              aria-invalid={!!errors.projektorTel}
              aria-describedby={errors.projektorTel ? "projektorTel-error" : undefined}
            />
            {/* <p className="form-helperText">Vänligen skriv ett giltigt telefonnummer.</p> */}
             {errors.projektorTel && <p id="projektorTel-error" className="text-red-500 text-sm mt-1 text-left">{errors.projektorTel}</p>}
          </div>

          <div className="form-separator"></div>

          {/* --- Projektledare (First Name / Last Name Row) - Assuming Optional --- */}
          <label className="form-label">Projektledare (Valfri)</label>
          <div className="form-rowContainer form-row">
            <div className="form-group">
              <input
                type="text"
                id="projektledareFirstName"
                name="projektledareFirstName"
                className={`input-field editable-input !w-full ${errors.projektledareFirstName ? '!border-red-500' : ''}`}
                value={formData.projektledareFirstName}
                onChange={handleChange}
                 aria-invalid={!!errors.projektledareFirstName}
                 aria-describedby={errors.projektledareFirstName ? "projektledareFirstName-error" : undefined}
             />
              <p className="form-helperText">Förnamn</p>
              {errors.projektledareFirstName && <p id="projektledareFirstName-error" className="text-red-500 text-sm mt-1 text-left">{errors.projektledareFirstName}</p>}
            </div>
            <div className="form-group">
              <input
                type="text"
                id="projektledareLastName"
                name="projektledareLastName"
                className={`input-field editable-input !w-full ${errors.projektledareLastName ? '!border-red-500' : ''}`}
                value={formData.projektledareLastName}
                onChange={handleChange}
                aria-invalid={!!errors.projektledareLastName}
                aria-describedby={errors.projektledareLastName ? "projektledareLastName-error" : undefined}
              />
              <p className="form-helperText">Efternamn</p>
               {errors.projektledareLastName && <p id="projektledareLastName-error" className="text-red-500 text-sm mt-1 text-left">{errors.projektledareLastName}</p>}
            </div>
          </div>

          {/* --- Telefon Projektledare (Optional) --- */}
          <div className="form-group">
            <label htmlFor="projektledareTel" className="form-label">Telefonnummer (Valfri)</label>
            <input
              type="tel"
              id="projektledareTel"
              name="projektledareTel"
              className={`input-field editable-input !w-full ${errors.projektledareTel ? '!border-red-500' : ''}`}
              value={formData.projektledareTel}
              onChange={handleChange}
              placeholder="(000) 000-0000"
              aria-invalid={!!errors.projektledareTel}
              aria-describedby={errors.projektledareTel ? "projektledareTel-error" : undefined}
            />
            {/* <p className="form-helperText">Vänligen skriv ett giltigt telefonnummer.</p> */}
             {errors.projektledareTel && <p id="projektledareTel-error" className="text-red-500 text-sm mt-1 text-left">{errors.projektledareTel}</p>}
          </div>

          <div className="form-separator"></div>

          {/* --- Lutning --- */}
          <div className="form-group">
            <label htmlFor="lutning" className="form-label">Lutning</label>
            <input
              type="number"
              id="lutning"
              name="lutning"
              className={`input-field editable-input !w-full ${errors.lutning ? '!border-red-500' : ''}`}
              // Show empty if value is 0 (initial state or cleared), otherwise show number
              value={formData.lutning === 0 ? '' : formData.lutning}
              onChange={handleNumberChange} // Use specific handler for numbers
              aria-invalid={!!errors.lutning}
              aria-describedby={errors.lutning ? "lutning-error" : undefined}
            />
            <p className="form-helperText">Takfall i grader</p>
            {errors.lutning && <p id="lutning-error" className="text-red-500 text-sm mt-1 text-left">{errors.lutning}</p>}
          </div>

          {/* --- Takbredd --- */}
          <div className="form-group">
            <label htmlFor="takbredd" className="form-label">Takbredd</label>
            <input
              type="number"
              id="takbredd"
              name="takbredd"
              className={`input-field editable-input !w-full ${errors.takbredd ? '!border-red-500' : ''}`}
              value={formData.takbredd === 0 ? '' : formData.takbredd}
              onChange={handleNumberChange}
              aria-invalid={!!errors.takbredd}
              aria-describedby={errors.takbredd ? "takbredd-error" : undefined}
            />
            <p className="form-helperText">Total bredd på taket (meter)</p>
             {errors.takbredd && <p id="takbredd-error" className="text-red-500 text-sm mt-1 text-left">{errors.takbredd}</p>}
          </div>

          {/* --- Takfall --- */}
          <div className="form-group">
            <label htmlFor="takfall" className="form-label">Takfall</label>
            <input
              type="number"
              id="takfall"
              name="takfall"
              className={`input-field editable-input !w-full ${errors.takfall ? '!border-red-500' : ''}`}
              value={formData.takfall === 0 ? '' : formData.takfall}
              onChange={handleNumberChange}
              aria-invalid={!!errors.takfall}
              aria-describedby={errors.takfall ? "takfall-error" : undefined}
            />
            <p className="form-helperText">Meter</p>
            {errors.takfall && <p id="takfall-error" className="text-red-500 text-sm mt-1 text-left">{errors.takfall}</p>}
          </div>

          {/* --- Takfot Till Mark --- */}
          <div className="form-group">
            <label htmlFor="takfotTillMark" className="form-label">Takfot Till Mark</label>
            <input
              type="number"
              id="takfotTillMark"
              name="takfotTillMark"
              className={`input-field editable-input !w-full ${errors.takfotTillMark ? '!border-red-500' : ''}`}
              value={formData.takfotTillMark === 0 ? '' : formData.takfotTillMark}
              onChange={handleNumberChange}
              aria-invalid={!!errors.takfotTillMark}
              aria-describedby={errors.takfotTillMark ? "takfotTillMark-error" : undefined}
            />
            <p className="form-helperText">Avstånd från takfot till marknivå (meter)</p>
            {errors.takfotTillMark && <p id="takfotTillMark-error" className="text-red-500 text-sm mt-1 text-left">{errors.takfotTillMark}</p>}
          </div>

          {/* --- Total Yta --- */}
          <div className="form-group">
            <label htmlFor="totalYta" className="form-label">Total Yta</label>
            <input
              type="number"
              id="totalYta"
              name="totalYta"
              className={`input-field editable-input !w-full ${errors.totalYta ? '!border-red-500' : ''}`}
              value={formData.totalYta === 0 ? '' : formData.totalYta}
              onChange={handleNumberChange}
              aria-invalid={!!errors.totalYta}
              aria-describedby={errors.totalYta ? "totalYta-error" : undefined}
            />
            <p className="form-helperText">Total takyta (kvadratmeter)</p>
            {errors.totalYta && <p id="totalYta-error" className="text-red-500 text-sm mt-1 text-left">{errors.totalYta}</p>}
          </div>

          {/* --- Typ Av Tak --- */}
          <div className="form-group">
            <label htmlFor="typAvTak" className="form-label">Typ av Tak</label>
            <select
              id="typAvTak"
              name="typAvTak"
              className={`input-field editable-input !w-full ${errors.typAvTak ? '!border-red-500' : ''}`}
              value={formData.typAvTak} // No need for || '' if initial state is ''
              onChange={handleChange}
              aria-invalid={!!errors.typAvTak}
              aria-describedby={errors.typAvTak ? "typAvTak-error" : undefined}
            >
              <option value="">Vänligen Välj</option>
              <option value="Sadel">Sadel</option>
              <option value="Valmat">Valmat</option>
              <option value="Mansard">Mansard</option>
            </select>
            {errors.typAvTak && <p id="typAvTak-error" className="text-red-500 text-sm mt-1 text-left">{errors.typAvTak}</p>}
          </div>

          {/* --- Råspont --- */}
          <div className="form-group">
            <label htmlFor="raspont" className="form-label">Råspont</label>
            <input
              type="number" // Assuming this should be a number (e.g., thickness or condition code?) - Adjust if text description
              id="raspont"
              name="raspont"
              className={`input-field editable-input !w-full ${errors.raspont ? '!border-red-500' : ''}`}
              value={formData.raspont === 0 ? '' : formData.raspont}
              onChange={handleNumberChange}
              aria-invalid={!!errors.raspont}
              aria-describedby={errors.raspont ? "raspont-error" : undefined}
            />
            <p className="form-helperText">Beskriv befintlig råspont/underlagstak (om nummer: ange enhet)</p>
            {errors.raspont && <p id="raspont-error" className="text-red-500 text-sm mt-1 text-left">{errors.raspont}</p>}
          </div>

          {/* --- Val Av Takmaterial --- */}
          <div className="form-group">
            <label htmlFor="valAvTakmaterial" className="form-label">Val av Takmaterial</label>
            <select
              id="valAvTakmaterial"
              name="valAvTakmaterial"
              className={`input-field editable-input !w-full ${errors.valAvTakmaterial ? '!border-red-500' : ''}`}
              value={formData.valAvTakmaterial}
              onChange={handleChange}
               aria-invalid={!!errors.valAvTakmaterial}
              aria-describedby={errors.valAvTakmaterial ? "valAvTakmaterial-error" : undefined}
            >
              <option value="">Vänligen Välj</option>
              <option value="Betongpannor">Betongpannor</option>
              <option value="Tegelpannor">Tegelpannor</option>
              <option value="TP20">TP20</option>
              <option value="Plegel 1-kupig">Plegel 1-kupig</option>
              <option value="Klickfals">Klickfals</option>
              <option value="Pannplåt">Pannplåt</option>
            </select>
             {errors.valAvTakmaterial && <p id="valAvTakmaterial-error" className="text-red-500 text-sm mt-1 text-left">{errors.valAvTakmaterial}</p>}
          </div>

          {/* --- Färg --- */}
          <div className="form-group">
            <label htmlFor="farg" className="form-label">Färg</label>
            <select
              id="farg"
              name="farg"
              className={`input-field editable-input !w-full ${errors.farg ? '!border-red-500' : ''}`}
              value={formData.farg}
              onChange={handleChange}
               aria-invalid={!!errors.farg}
              aria-describedby={errors.farg ? "farg-error" : undefined}
            >
              <option value="">Vänligen Välj</option>
              <option value="Svart">Svart</option>
              <option value="Svart matt">Svart matt</option>
              <option value="Svart blank">Svart blank</option>
              <option value="Röd matt">Röd matt</option>
              <option value="Röd blank">Röd blank</option>
              <option value="Grå matt">Grå matt</option>
              <option value="Grå blank">Grå blank</option>
              <option value="Röd Röd Blank">Röd Röd Blank</option>
            </select>
            {errors.farg && <p id="farg-error" className="text-red-500 text-sm mt-1 text-left">{errors.farg}</p>}
          </div>

          {/* --- Snörasskydd --- */}
          <div className="form-group">
            <label htmlFor="snorasskydd" className="form-label">Snörasskydd (meter)</label>
            <input
              type="number"
              id="snorasskydd"
              name="snorasskydd"
              className={`input-field editable-input !w-full ${errors.snorasskydd ? '!border-red-500' : ''}`}
              value={formData.snorasskydd === 0 ? '' : formData.snorasskydd}
              onChange={handleNumberChange}
              placeholder="t.ex. 23"
              aria-invalid={!!errors.snorasskydd}
              aria-describedby={errors.snorasskydd ? "snorasskydd-error" : undefined}
            />
            {/* <p className="form-helperText">Meter</p> */}
             {errors.snorasskydd && <p id="snorasskydd-error" className="text-red-500 text-sm mt-1 text-left">{errors.snorasskydd}</p>}
          </div>

          {/* --- Placering Snörasskydd (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="placeringSnorasskydd" className="form-label">Placering Snörasskydd (Valfri)</label>
            <input
              type="text"
              id="placeringSnorasskydd"
              name="placeringSnorasskydd"
              className={`input-field editable-input !w-full ${errors.placeringSnorasskydd ? '!border-red-500' : ''}`}
              value={formData.placeringSnorasskydd}
              onChange={handleChange}
              aria-invalid={!!errors.placeringSnorasskydd}
              aria-describedby={errors.placeringSnorasskydd ? "placeringSnorasskydd-error" : undefined}
            />
             {errors.placeringSnorasskydd && <p id="placeringSnorasskydd-error" className="text-red-500 text-sm mt-1 text-left">{errors.placeringSnorasskydd}</p>}
          </div>

          {/* --- Snörasskydd Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="snorasskyddFarg" className="form-label">Snörasskydd Färg (Valfri)</label>
            <select
              id="snorasskyddFarg"
              name="snorasskyddFarg"
              className={`input-field editable-input !w-full ${errors.snorasskyddFarg ? '!border-red-500' : ''}`}
              value={formData.snorasskyddFarg}
              onChange={handleChange}
               aria-invalid={!!errors.snorasskyddFarg}
              aria-describedby={errors.snorasskyddFarg ? "snorasskyddFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              <option value="Svart">Svart</option>
              <option value="Silver">Silver</option>
              <option value="Rött">Rött</option>
            </select>
             {errors.snorasskyddFarg && <p id="snorasskyddFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.snorasskyddFarg}</p>}
          </div>

          {/* --- Hängränna --- */}
          <div className="form-group">
            <label htmlFor="hangranna" className="form-label">Hängränna (meter)</label>
            <input
              type="number"
              id="hangranna"
              name="hangranna"
              className={`input-field editable-input !w-full ${errors.hangranna ? '!border-red-500' : ''}`}
              value={formData.hangranna === 0 ? '' : formData.hangranna}
              onChange={handleNumberChange}
              placeholder="t.ex. 23"
              aria-invalid={!!errors.hangranna}
              aria-describedby={errors.hangranna ? "hangranna-error" : undefined}
            />
             {/* <p className="form-helperText">Meter</p> */}
              {errors.hangranna && <p id="hangranna-error" className="text-red-500 text-sm mt-1 text-left">{errors.hangranna}</p>}
          </div>

          {/* --- Hängränna Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="hangrannaFarg" className="form-label">Hängränna Färg (Valfri)</label>
            <select
              id="hangrannaFarg"
              name="hangrannaFarg"
              className={`input-field editable-input !w-full ${errors.hangrannaFarg ? '!border-red-500' : ''}`}
              value={formData.hangrannaFarg}
              onChange={handleChange}
               aria-invalid={!!errors.hangrannaFarg}
              aria-describedby={errors.hangrannaFarg ? "hangrannaFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              <option value="Svart">Svart</option>
              <option value="Vit">Vit</option>
            </select>
             {errors.hangrannaFarg && <p id="hangrannaFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.hangrannaFarg}</p>}
          </div>

          {/* --- Ränndalar --- */}
          <div className="form-group">
            <label htmlFor="ranndalar" className="form-label">Ränndalar (meter)</label>
            <input
              type="number"
              id="ranndalar"
              name="ranndalar"
              className={`input-field editable-input !w-full ${errors.ranndalar ? '!border-red-500' : ''}`}
              value={formData.ranndalar === 0 ? '' : formData.ranndalar}
              onChange={handleNumberChange}
              placeholder="t.ex. 23"
              aria-invalid={!!errors.ranndalar}
              aria-describedby={errors.ranndalar ? "ranndalar-error" : undefined}
            />
            {/* <p className="form-helperText">Meter</p> */}
             {errors.ranndalar && <p id="ranndalar-error" className="text-red-500 text-sm mt-1 text-left">{errors.ranndalar}</p>}
          </div>

          {/* --- Ränndalar Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="ranndalarFarg" className="form-label">Ränndalar Färg (Valfri)</label>
            <select
              id="ranndalarFarg"
              name="ranndalarFarg"
              className={`input-field editable-input !w-full ${errors.ranndalarFarg ? '!border-red-500' : ''}`}
              value={formData.ranndalarFarg}
              onChange={handleChange}
               aria-invalid={!!errors.ranndalarFarg}
              aria-describedby={errors.ranndalarFarg ? "ranndalarFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              <option value="Svart">Svart</option>
              <option value="Vit">Vit</option>
              {/* Add more colors if applicable */}
            </select>
             {errors.ranndalarFarg && <p id="ranndalarFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.ranndalarFarg}</p>}
          </div>

          {/* --- Fotplåt --- */}
          <div className="form-group">
            <label htmlFor="fotplat" className="form-label">Fotplåt (meter)</label>
            <input
              type="number"
              id="fotplat"
              name="fotplat"
              className={`input-field editable-input !w-full ${errors.fotplat ? '!border-red-500' : ''}`}
              value={formData.fotplat === 0 ? '' : formData.fotplat}
              onChange={handleNumberChange}
              placeholder="t.ex. 23"
              aria-invalid={!!errors.fotplat}
              aria-describedby={errors.fotplat ? "fotplat-error" : undefined}
            />
            {/* <p className="form-helperText">Meter</p> */}
             {errors.fotplat && <p id="fotplat-error" className="text-red-500 text-sm mt-1 text-left">{errors.fotplat}</p>}
          </div>

          {/* --- Fotplåt Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="fotplatFarg" className="form-label">Fotplåt Färg (Valfri)</label>
            <select
              id="fotplatFarg"
              name="fotplatFarg"
              className={`input-field editable-input !w-full ${errors.fotplatFarg ? '!border-red-500' : ''}`}
              value={formData.fotplatFarg}
              onChange={handleChange}
               aria-invalid={!!errors.fotplatFarg}
              aria-describedby={errors.fotplatFarg ? "fotplatFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              <option value="Svart">Svart</option>
              <option value="Vit">Vit</option>
               {/* Add more colors if applicable */}
            </select>
             {errors.fotplatFarg && <p id="fotplatFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.fotplatFarg}</p>}
          </div>

          {/* --- Vindskiveplåt --- */}
          <div className="form-group">
            <label htmlFor="vindskiveplat" className="form-label">Vindskiveplåt (meter)</label>
            <input
              type="number"
              id="vindskiveplat"
              name="vindskiveplat"
              className={`input-field editable-input !w-full ${errors.vindskiveplat ? '!border-red-500' : ''}`}
              value={formData.vindskiveplat === 0 ? '' : formData.vindskiveplat}
              onChange={handleNumberChange}
              placeholder="t.ex. 23"
              aria-invalid={!!errors.vindskiveplat}
              aria-describedby={errors.vindskiveplat ? "vindskiveplat-error" : undefined}
            />
            {/* <p className="form-helperText">Meter</p> */}
             {errors.vindskiveplat && <p id="vindskiveplat-error" className="text-red-500 text-sm mt-1 text-left">{errors.vindskiveplat}</p>}
          </div>

          {/* --- Vindskiveplåt Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="vindskiveplatFarg" className="form-label">Vindskiveplåt Färg (Valfri)</label>
            <select
              id="vindskiveplatFarg"
              name="vindskiveplatFarg"
              className={`input-field editable-input !w-full ${errors.vindskiveplatFarg ? '!border-red-500' : ''}`}
              value={formData.vindskiveplatFarg}
              onChange={handleChange}
               aria-invalid={!!errors.vindskiveplatFarg}
              aria-describedby={errors.vindskiveplatFarg ? "vindskiveplatFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              <option value="Svart">Svart</option>
              <option value="Vit">Vit</option>
              <option value="Silver">Silver</option>
              <option value="Rött">Rött</option>
            </select>
             {errors.vindskiveplatFarg && <p id="vindskiveplatFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.vindskiveplatFarg}</p>}
          </div>

          {/* --- Stuprör --- */}
          <div className="form-group">
            <label htmlFor="stupror" className="form-label">Stuprör (antal)</label>
            <input
              type="number"
              id="stupror"
              name="stupror"
              className={`input-field editable-input !w-full ${errors.stupror ? '!border-red-500' : ''}`}
              value={formData.stupror === 0 ? '' : formData.stupror}
              onChange={handleNumberChange}
              placeholder="t.ex. 4"
              aria-invalid={!!errors.stupror}
              aria-describedby={errors.stupror ? "stupror-error" : undefined}
            />
            {/* <p className="form-helperText">Antal</p> */}
            {errors.stupror && <p id="stupror-error" className="text-red-500 text-sm mt-1 text-left">{errors.stupror}</p>}
          </div>

          {/* --- Stuprör Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="stuprorFarg" className="form-label">Stuprör Färg (Valfri)</label>
            <select
              id="stuprorFarg"
              name="stuprorFarg"
              className={`input-field editable-input !w-full ${errors.stuprorFarg ? '!border-red-500' : ''}`}
              value={formData.stuprorFarg}
              onChange={handleChange}
              aria-invalid={!!errors.stuprorFarg}
              aria-describedby={errors.stuprorFarg ? "stuprorFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              <option value="Svart">Svart</option>
              <option value="Vit">Vit</option>
              <option value="Silver">Silver</option>
              <option value="Rött">Rött</option>
              {/* <option value="ingen">Ingen</option> Included in "Vänligen Välj / Ingen" */}
            </select>
            {errors.stuprorFarg && <p id="stuprorFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.stuprorFarg}</p>}
          </div>

          {/* --- Takstege --- */}
          <div className="form-group">
            <label htmlFor="takstege" className="form-label">Takstege (meter)</label>
            <input
              type="number"
              id="takstege"
              name="takstege"
              className={`input-field editable-input !w-full ${errors.takstege ? '!border-red-500' : ''}`}
              value={formData.takstege === 0 ? '' : formData.takstege}
              onChange={handleNumberChange}
              placeholder="t.ex. 5"
              aria-invalid={!!errors.takstege}
              aria-describedby={errors.takstege ? "takstege-error" : undefined}
            />
            {/* <p className="form-helperText">Meter</p> */}
            {errors.takstege && <p id="takstege-error" className="text-red-500 text-sm mt-1 text-left">{errors.takstege}</p>}
          </div>

          {/* --- Takstege Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="takstegeFarg" className="form-label">Takstege Färg (Valfri)</label>
            <select
              id="takstegeFarg"
              name="takstegeFarg"
              className={`input-field editable-input !w-full ${errors.takstegeFarg ? '!border-red-500' : ''}`}
              value={formData.takstegeFarg}
              onChange={handleChange}
              aria-invalid={!!errors.takstegeFarg}
              aria-describedby={errors.takstegeFarg ? "takstegeFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              {/* <option value="ingen">Ingen</option> */}
              <option value="Svart">Svart</option>
              <option value="Silver">Silver</option>
              <option value="Röd">Röd</option>
              <option value="Vit">Vit</option>
            </select>
            {errors.takstegeFarg && <p id="takstegeFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.takstegeFarg}</p>}
          </div>

          {/* --- Avsats Skorsten (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="avsatsSkorsten" className="form-label">Avsats Skorsten (Valfri)</label>
            <select
              id="avsatsSkorsten"
              name="avsatsSkorsten"
              className={`input-field editable-input !w-full ${errors.avsatsSkorsten ? '!border-red-500' : ''}`}
              value={formData.avsatsSkorsten}
              onChange={handleChange}
              aria-invalid={!!errors.avsatsSkorsten}
              aria-describedby={errors.avsatsSkorsten ? "avsatsSkorsten-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              {/* <option value="ingen">Ingen</option> */}
              <option value="Svart">Svart</option>
              <option value="Silver">Silver</option>
              <option value="Röd">Röd</option>
              <option value="Vit">Vit</option>
            </select>
            {errors.avsatsSkorsten && <p id="avsatsSkorsten-error" className="text-red-500 text-sm mt-1 text-left">{errors.avsatsSkorsten}</p>}
          </div>

          {/* --- Skorsten --- */}
          <div className="form-group">
            <fieldset aria-describedby={errors.skorsten ? "skorsten-error" : undefined}>
              <legend className={`form-label ${errors.skorsten ? 'text-red-600' : ''}`}>Skorsten</legend>
              {/* Option 1: Hel */}
              <div className="input-field editable-input !w-fit !mb-3">
                <input
                  type="radio"
                  id="skorsten_hel"
                  name="skorsten"
                  value="Hel"
                  checked={formData.skorsten === 'Hel'}
                  onChange={handleChange}
                  className="form-radio" // Add specific class if needed
                />
                <label htmlFor="skorsten_hel" className="ps-2">Hel</label>
              </div>
              {/* Option 2: Halv */}
              <div className="input-field editable-input !w-fit !mb-3">
                <input
                  type="radio"
                  id="skorsten_halv"
                  name="skorsten"
                  value="Halv"
                  checked={formData.skorsten === 'Halv'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <label htmlFor="skorsten_halv" className="ps-2">Halv</label>
              </div>
              {/* Option 3: Fot */}
              <div className="input-field editable-input !w-fit !mb-3">
                <input
                  type="radio"
                  id="skorsten_fot"
                  name="skorsten"
                  value="Fot"
                  checked={formData.skorsten === 'Fot'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <label htmlFor="skorsten_fot" className="ps-2">Fot</label>
              </div>
              {/* Option 4: Ingen */}
              <div className="input-field editable-input !w-fit">
                <input
                  type="radio"
                  id="skorsten_ingen"
                  name="skorsten"
                  value="Ingen" // Ensure schema allows 'ingen' or maps it appropriately if needed
                  checked={formData.skorsten === 'Ingen'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <label htmlFor="skorsten_ingen" className="ps-2">Ingen</label>
              </div>
            </fieldset>
            {errors.skorsten && <p id="skorsten-error" className="text-red-500 text-sm mt-1 text-left">{errors.skorsten}</p>}
          </div>

          {/* --- Skorsten Färg (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="skorstenFarg" className="form-label">Skorsten Färg (Valfri)</label>
            <select
              id="skorstenFarg"
              name="skorstenFarg"
              className={`input-field editable-input !w-full ${errors.skorstenFarg ? '!border-red-500' : ''}`}
              value={formData.skorstenFarg}
              onChange={handleChange}
              aria-invalid={!!errors.skorstenFarg}
              aria-describedby={errors.skorstenFarg ? "skorstenFarg-error" : undefined}
            >
              <option value="">Vänligen Välj / Ingen</option>
              {/* <option value="ingen">Ingen</option> */}
              <option value="Svart">Svart</option>
              <option value="Silver">Silver</option>
              <option value="Röd">Röd</option>
              <option value="Vit">Vit</option>
            </select>
            {errors.skorstenFarg && <p id="skorstenFarg-error" className="text-red-500 text-sm mt-1 text-left">{errors.skorstenFarg}</p>}
          </div>

          {/* --- Avluftning --- */}
          <div className="form-group">
            <label htmlFor="avluftning" className="form-label">Avluftning (antal)</label>
            <input
              type="number"
              id="avluftning"
              name="avluftning"
              className={`input-field editable-input !w-full ${errors.avluftning ? '!border-red-500' : ''}`}
              value={formData.avluftning === 0 ? '' : formData.avluftning}
              onChange={handleNumberChange}
              placeholder="t.ex. 1"
              aria-invalid={!!errors.avluftning}
              aria-describedby={errors.avluftning ? "avluftning-error" : undefined}
            />
            {/* <p className="form-helperText">Antal</p> */}
            {errors.avluftning && <p id="avluftning-error" className="text-red-500 text-sm mt-1 text-left">{errors.avluftning}</p>}
          </div>

          {/* --- Ventilation --- */}
          <div className="form-group">
            <label htmlFor="ventilation" className="form-label">Ventilation (antal)</label>
            <input
              type="number"
              id="ventilation"
              name="ventilation"
              className={`input-field editable-input !w-full ${errors.ventilation ? '!border-red-500' : ''}`}
              value={formData.ventilation === 0 ? '' : formData.ventilation}
              onChange={handleNumberChange}
              placeholder="t.ex. 2"
              aria-invalid={!!errors.ventilation}
              aria-describedby={errors.ventilation ? "ventilation-error" : undefined}
            />
            {/* <p className="form-helperText">Antal</p> */}
            {errors.ventilation && <p id="ventilation-error" className="text-red-500 text-sm mt-1 text-left">{errors.ventilation}</p>}
          </div>

          {/* --- Tillägg --- */}
          <div className="form-group">
            <fieldset>
              <legend className="form-label">Tillägg (Valfritt)</legend>
               {/* No specific error display needed here unless the whole group has a rule */}
               <div className="input-field editable-input !w-fit !mb-4">
                 <input
                   type="checkbox"
                   id="tillagg_malaVindskivor"
                   name="malaVindskivor" // Matches key within tillagg object
                   data-group="tillagg"  // Used by handleChange
                   checked={formData.tillagg.malaVindskivor}
                   onChange={handleChange}
                   className="form-checkbox" // Add specific class if needed
                 />
                 <label htmlFor="tillagg_malaVindskivor" className="ps-2">Måla vindskivor (+5200kr)</label>
               </div>

               <div className="input-field editable-input !w-fit">
                 <input
                   type="checkbox"
                   id="tillagg_vaderskyddSkorsten"
                   name="vaderskyddSkorsten" // Matches key within tillagg object
                   data-group="tillagg"     // Used by handleChange
                   checked={formData.tillagg.vaderskyddSkorsten}
                   onChange={handleChange}
                    className="form-checkbox"
                />
                 <label htmlFor="tillagg_vaderskyddSkorsten" className="ps-2">Väderskydd till skorsten (+4500kr)</label>
               </div>
            </fieldset>
          </div>

          {/* --- Övrigt (Optional?) --- */}
          <div className="form-group">
            <label htmlFor="ovrigt" className="form-label">Övrigt (Valfri)</label>
            <textarea
              id="ovrigt"
              name="ovrigt"
              className={`input-field editable-input !w-full ${errors.ovrigt ? '!border-red-500' : ''}`}
              rows={5}
              value={formData.ovrigt}
              onChange={handleChange}
              aria-invalid={!!errors.ovrigt}
              aria-describedby={errors.ovrigt ? "ovrigt-error" : undefined}
            />
             {errors.ovrigt && <p id="ovrigt-error" className="text-red-500 text-sm mt-1 text-left">{errors.ovrigt}</p>}
          </div>

          {/* --- Kund 2 (First Name / Last Name Row) --- */}
           <label className="form-label">Kund</label>
           <div className="form-rowContainer form-row">
             <div className="form-group">
               <input
                 type="text"
                 id="kundFirstName2" // Changed id
                 name="kundFirstName2" // Changed name
                 className={`input-field editable-input !w-full ${errors.kundFirstName2 ? '!border-red-500' : ''}`}
                 value={formData.kundFirstName2}
                 onChange={handleChange}
                 aria-invalid={!!errors.kundFirstName2}
                 aria-describedby={errors.kundFirstName2 ? "kundFirstName2-error" : undefined}
               />
               <p className="form-helperText">Förnamn</p>
               {errors.kundFirstName2 && <p id="kundFirstName2-error" className="text-red-500 text-sm mt-1 text-left">{errors.kundFirstName2}</p>}
             </div>
             <div className="form-group">
               <input
                 type="text"
                 id="kundLastName2" // Changed id
                 name="kundLastName2" // Changed name
                 className={`input-field editable-input !w-full ${errors.kundLastName2 ? '!border-red-500' : ''}`}
                 value={formData.kundLastName2}
                 onChange={handleChange}
                 aria-invalid={!!errors.kundLastName2}
                 aria-describedby={errors.kundLastName2 ? "kundLastName2-error" : undefined}
               />
               <p className="form-helperText">Efternamn</p>
               {errors.kundLastName2 && <p id="kundLastName2-error" className="text-red-500 text-sm mt-1 text-left">{errors.kundLastName2}</p>}
             </div>
           </div>

          {/* --- Preliminärt ROT-avdrag --- */}
          <div className="form-group">
            <label htmlFor="preliminarROT" className="form-label">Preliminärt ROT-avdrag (kr)</label>
            <input
              type="number"
              id="preliminarROT"
              name="preliminarROT"
              className={`input-field editable-input !w-full ${errors.preliminarROT ? '!border-red-500' : ''}`}
              value={formData.preliminarROT === 0 ? '' : formData.preliminarROT}
              onChange={handleNumberChange}
              placeholder="t.ex. 15000"
              aria-invalid={!!errors.preliminarROT}
              aria-describedby={errors.preliminarROT ? "preliminarROT-error preliminarROT-desc" : "preliminarROT-desc"}
            />
            <p id="preliminarROT-desc" className="form-helperText">Kunden godkänner att ett preliminärt ROT-avdrag motsvarande ovanstående belopp kommer att sökas. Om Skatteverket helt eller delvis avslår ROT-avdraget förbinder sig kunden att betala det nekade beloppet till Lundmarks Tak & Montage AB.</p>
             {errors.preliminarROT && <p id="preliminarROT-error" className="text-red-500 text-sm mt-1 text-left">{errors.preliminarROT}</p>}
          </div>

          {/* --- Signature --- */}
          <div className="form-group" id="signature-field-container"> {/* Added ID for scroll target */}
            <label htmlFor="signatur" className={`form-label ${errors.signature ? 'text-red-600' : ''}`}>
              Signatur
            </label>
            <div className={`input-field editable-input !w-full !p-0 form-signContainerRelative ${errors.signature ? 'border !border-red-500' : ''}`}>
              {showSignPlaceholder && (
                <div className="form-signPlaceholder">
                  Signera här
                </div>
              )}
              <SignatureCanvas
                ref={sigPadRef}
                penColor='black'
                canvasProps={{ className: 'form-signCanvas' }}
                onBegin={handleSignatureBeginDrawing}
              />
            </div>
             {errors.signature && <p className="text-red-500 text-sm mt-1 text-left">{errors.signature}</p>}
            {/* Use standard Button component if available */}
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={clearSignature}>
               Rensa Signatur
            </Button>
          </div>

          <div className="form-separator"></div>

          {/* --- Submit Button --- */}
          {/* Disable button while mutation is pending */}
          <button
             type="submit"
             className="form-submitButton" // Add your specific submit button styles
             disabled={submitMutation.isPending}
           >
            {submitMutation.isPending ? 'Skickar...' : 'Skicka in'}
          </button>

        </form>
      </main>
    </div>
  );
}