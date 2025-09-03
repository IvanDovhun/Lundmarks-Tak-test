// src/components/ProcessDialog.jsx
import React, { useState } from 'react';
// Import your UI components (Button, Input, FileUploader, etc.)
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import FileUploader from './FileUploader'; // Your custom file uploader
import '../css/ProcessDialog.css';
import '../../index.css';
import { PDFIcon, PhotoIcon, UploadIcon } from '@/icons/svg';
import { cn } from "@/lib/utils";
import CalculationViewDialog from './calculation-view-dialog';

const FileUploader = ({ label, onFileChange, id = "file-upload-input", file, multiple=false }) => {
  const uniqueId = React.useId ? React.useId() : id;

  return (
    <>
      <input
        type="file"
        id={uniqueId} // ID for the label to target
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onFileChange(e.target.files[0]);
          }
          // Optional: Reset the input value to allow uploading the same file again
          // e.target.value = null;
        }}
      />
  
      <label htmlFor={uniqueId} className="file-uploader my-3">
        {multiple ? 
        (file.length == 0 ? <UploadIcon className="w-10 h-10" /> : 
         <span className='chosen-file-label my-3'>Valda filer: {file.map((singleFile) => {return singleFile.name + ', ';})}</span>) : 
        (file ? <span className='chosen-file-label my-3'>Vald fil: {file.name}</span> : 
          <UploadIcon className="w-10 h-10" />)}
        
        <p className="file-upload-text">{label || "Ladda upp fil"}</p>
      </label>
    </>
  );
};


const ProgressBar = ({steps, current, maxReached, onDotClick }) => {
  return (
    <div className="progress-bar-container">
      {steps.map((stepNum) => (
        <React.Fragment key={stepNum}>
          <div className={`progress-dot ${stepNum <= maxReached ? 'active' : ''} ${stepNum === current ? 'current' : ''} ${stepNum <= maxReached ? 'cursor-pointer' : ''}`} 
            onClick={() => stepNum <= maxReached && onDotClick && onDotClick(stepNum)}>
            {stepNum}
          </div>
          {stepNum < steps.length && <div className={`progress-line ${stepNum < maxReached ? 'active' : ''}`}></div>}
        </React.Fragment>
      ))}
    </div>
  );
};

export const ProcessDialog = ({
  currentStep,
  highestStepReached,
  nextStep,
  dealMade,
  onDealChoice,
  reasonNoDeal,
  onReasonChange,
  revisit,
  onRevisitChoice,
  agreementFile,
  onAgreementFileChange,
  projectImages,
  onProjectImagesChange,
  processNotes,
  onProcessNotesChange,
  onClose,
  onSaveDeal,
  isSaving,
  onNavigateToStep,
  calculation,
}) => {
  const [isCalculationViewOpen, setIsCalculationViewOpen] = useState(false);

  const renderStepContent = () => {
    // Step 1: Blev det en affär?
    if (currentStep == 1) {
      return (
        <div className="step-content">
          <span className='dialog-label'>Blev det en affär?</span>
          <div className="flex gap-4 mt-2">
            <button className={cn(
                `calculator-yes-button
                ${dealMade === true ? "radio-button-true" : ""}`)} onClick={() => onDealChoice(true)}>
              <span className='button-text'>Ja</span>
            </button>
            <button className={cn(
                `calculator-no-button
                ${dealMade === false ? "radio-button-false" : ""}`)} onClick={() => onDealChoice(false)}>
              <span className='button-text'>Nej</span>
            </button>
          </div>
        </div>
      );
    }

    // Step 2 - Path for "Ja"
    if (currentStep == 2 && dealMade === true) {
      return (
        <div className="step-content">
          <h4 className='dialog-label'>Ladda upp Avtal</h4>
          <p className="text-sm text-gray-500">Bild på avtal, hus, projekteringsupptäckter</p>
          <FileUploader label="Välj bild..." onFileChange={onAgreementFileChange} file={agreementFile} />
          {/* You might have "Skippa" and "Ta Bild" here */}
          <div className="flex items-center mt-1 gap-2">
             <div className={cn(`skip-button ${agreementFile ? "!text-green-600" : ""}`)} onClick={nextStep}>{agreementFile ? "Fortsätt" : "Skippa"}</div>
             <div className='take-photo-button flex gap-3 align-center'>
               <PhotoIcon className='w-5 h-5'/>
               Ta bild
             </div>
          </div>
        </div>
      );
    }

    if (currentStep == 3 && dealMade === true) {
      return (
        <div className="step-content">
          <h4 className="dialog-label">Ladda upp Bilder</h4>
          <p className="text-sm text-gray-500">Bild på hus, projekteringsupptäckter</p>
          <FileUploader label="Välj bild..." onFileChange={(file) => onProjectImagesChange(prev => [...prev, file])} file={projectImages} multiple={true}/>
          {/* Multiple image upload logic would be more complex */}
          <div className="flex items-center mt-1 gap-2">
             <div className={cn(`skip-button ${projectImages.length > 0 ? "!text-green-600" : ""}`)} onClick={nextStep}>{projectImages.length > 0 ? "Fortsätt" : "Skippa"}</div>
             <div className='take-photo-button flex gap-3 align-center'>
               <PhotoIcon className='w-5 h-5'/>
               Ta bild
             </div>
          </div>
          {/* Typically after this step, you'd go to a "summary" or directly enable save */}
        </div>
      );
    }

    if (currentStep == 4 && dealMade === true) {
      return (
        <div className="step-content">
          <h4 className="dialog-label">Anteckningar</h4>
          <p className="text-sm text-gray-400 italic">Inför projektering</p>
          <div className="flex flex-1 mt-2">
            <input
              type="text"
              value={processNotes}
              onChange={(e) => {onProcessNotesChange(e.target.value)}}
              className="input-field editable-input"
            />
          </div>
          <button className="save-button mt-6" onClick={onSaveDeal}>
            <span>{isSaving ? 'Sparar...' : 'Spara som Affär'}</span>
          </button>
        </div>
      );
    }

    // Step 2 - Path for "Nej"
    if (currentStep >= 2 && dealMade === false) {
      return (
        <div className="step-content">
          <h4 className="dialog-label">Varför blev det inte en affär?</h4>
          <div className="flex flex-1 mt-2">
            <input
              type="text"
              value={reasonNoDeal}
              onChange={(e) => onReasonChange(e.target.value)}
              className="input-field editable-input"
            />
          </div>

          <h4 className="dialog-label mt-6">Värt återbesök?</h4>
          <div className="flex gap-4 mt-2">
            <button className={cn(
                `calculator-yes-button
                ${revisit === true ? "radio-button-true" : ""}`)} onClick={() => onRevisitChoice(true)}>
              <span className='button-text'>Ja</span>
            </button>
            <button className={cn(
                `calculator-no-button
                ${revisit === false ? "radio-button-false" : ""}`)} onClick={() => onRevisitChoice(false)}>
              <span className='button-text'>Nej</span>
            </button>
          </div>
          <div className="flex gap-4 mt-2">

            <button className="save-button mt-6 !bg-white">
              <span>{isSaving ? 'Sparar...' : 'Skapa Offert'}</span>
            </button>
            <button className="save-button mt-6" onClick={onSaveDeal}>
              <span>{isSaving ? 'Sparar...' : 'Spara som Demo'}</span>
            </button>
          </div>
        </div>
      );
    }

    // Step 3 (or summary before save)
    if (currentStep >=3) {
        return (
            <div className="step-content">
                <h4>Slutför Processen</h4>
                <p>Granska dina val och spara.</p>
                {/* Display summary here if needed */}
            </div>
        )
    }

    return null; // Should not happen if logic is correct
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>Process</h2>
          {dealMade === true && currentStep >= 2 && ( // Show "Se Beräkning" only on "Ja" path after step 1
            <button className="flex p-2" onClick={() => setIsCalculationViewOpen(true)}>
              {/* <FileTextIcon className="mr-2" />  Use your PDF icon */}
              <PDFIcon className='w-7 h-7'/>
              <span className='dialog-label ms-2 text-xl'>Se Beräkning</span>
            </button>
          )}
        </div>

        <div className="dialog-body">
          <div className="main-form-area">
            {renderStepContent()}
          </div>
          <ProgressBar steps={dealMade ? [1, 2, 3, 4] : [1, 2]} current={currentStep} maxReached={highestStepReached} onDotClick={onNavigateToStep}/>
        </div>
      </div>

      <CalculationViewDialog
        isOpen={isCalculationViewOpen}
        onClose={() => setIsCalculationViewOpen(false)}
        calculation={calculation}
      />
    </div>
  );
};