import React from 'react';
import { X } from "lucide-react";
import '../css/CalculationViewDialog.css';

interface CalculationViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  calculation: any;
}

export const CalculationViewDialog: React.FC<CalculationViewDialogProps> = ({
  isOpen,
  onClose,
  calculation
}) => {
  if (!isOpen || !calculation) return null;

  console.log(calculation);

  const currentDate = new Date().toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Map calculation data to display fields
  const displayFields = [
    { label: 'Kundnummer', value: calculation.customerNumber || 'Ej angivet' },
    { label: 'Tel 1', value: calculation.inputData.customerPhone || 'Ej angivet' },
    { label: 'Kund', value: calculation.inputData.customerName || 'Ej angivet' },
    { label: 'Adress', value: calculation.inputData.customerAdress || 'Ej angivet' },
    { label: 'Startdatum', value: calculation.createdAt ? new Date(calculation.createdAt).toLocaleDateString('sv-SE') : 'Ej angivet' },
    { label: 'Slutdatum', value: calculation.endDate ? new Date(calculation.endDate).toLocaleDateString('sv-SE') : 'Ej angivet' },
    { label: 'Takbredd', value: calculation.roofWidth != null ? `${calculation.roofWidth} m` : 'Ej angivet' },
    { label: 'Takfall', value: calculation.roofSlope != null ? `${calculation.roofSlope} m` : 'Ej angivet' },
    { label: 'Total yta', value: calculation.inputData.area != null ? `${calculation.inputData.area} m²` : 'Ej angivet' },
    { label: 'Typ av tak', value: calculation.inputData.roofType.name || 'Ej angivet' },
    { label: 'Råspont', value: calculation.inputData.raspont != null ? `${calculation.inputData.raspont} m²` : 'Ej angivet' },
    { label: 'Val av takmaterial', value: calculation.inputData.materialType.name || 'Ej angivet' },
    { label: 'Färg', value: calculation.color || 'Ej angivet' },
    { label: 'Hängränna', value: calculation.inputData.hängränna != null ? `${calculation.inputData.hängränna} m` : 'Ej angivet' },
    { label: 'Snörasskydd', value: calculation.inputData.snörasskydd != null ? `${calculation.inputData.snörasskydd} m` : 'Ej angivet' },
    { label: 'Ränndalar', value: calculation.inputData.ränndalar != null ? `${calculation.inputData.ränndalar} m` : 'Ej angivet' },
    { label: 'Fotplåt', value: calculation.inputData.fotplåt != null ? `${calculation.inputData.fotplåt} m` : 'Ej angivet' },
    { label: 'Vindskiveplåt', value: calculation.inputData.vindskivor != null ? `${calculation.inputData.vindskivor} m` : 'Ej angivet' },
    { label: 'Stuprör', value: calculation.inputData.stuprör != null ? `${calculation.inputData.stuprör} st` : 'Ej angivet' },
    { label: 'Takstege', value: calculation.inputData.takstege != null ? `${calculation.inputData.takstege} m` : 'Ej angivet' },
    { label: 'Skorsten', value: calculation.inputData.chimneyType.name || 'Ej angivet' },
    { label: 'Avluftning', value: calculation.inputData.avluftning != null ? `${calculation.inputData.avluftning} st` : 'Ej angivet' },
    { label: 'Ventilation', value: calculation.inputData.ventilation != null ? `${calculation.inputData.ventilation} st` : 'Ej angivet' },
    { label: 'Avancerad Byggställning', value: calculation.inputData.advancedScaffolding != null ? calculation.inputData.advancedScaffolding ? 'Ja' : 'Nej' : 'Ej angivet' },
    { label: 'Byggställning Två Våningar', value: calculation.inputData.twoFloorScaffolding != null ? calculation.inputData.twoFloorScaffolding ? 'Ja' : 'Nej' : 'Ej angivet' },
    { label: 'Kund', value: calculation.inputData.customerName || 'Ej angivet' },
    { label: 'Preliminärt ROT', value: calculation.rotAvdrag != null ? `ca ${calculation.rotAvdrag} kr` : 'Ej angivet' }
  ];

  return (
    <div className="calculation-view-overlay" onClick={onClose}>
      <div className="calculation-view-content" onClick={(e) => e.stopPropagation()}>
        <button className="calculation-view-close" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="calculation-view-header">
          <h2>Projekteringsmall</h2>
          <p className="calculation-view-date">{currentDate}</p>
        </div>

        <div className="calculation-view-body">
          {displayFields.map((field, index) => (
            <div key={index} className="calculation-field-row">
              <span className="field-label">{field.label}</span>
              <span className="field-value">{field.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CalculationViewDialog;
