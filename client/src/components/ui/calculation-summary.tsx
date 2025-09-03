import React from 'react';
import { X } from 'lucide-react'; // Or your close icon
import '../css/CalculationSummary.css';

const formatValue = (value, unit = "") => {
  if (value === null || value === undefined || value === '') return 'Ej angivet';
  return `${value}${unit ? ` ${unit}` : ''}`;
};

export const CalculationDetailsDialog = ({ data, onClose }) => {
  if (!data) return null;

  // Define the order and labels for your fields
  // This makes it easier to render and maintain
  const displayFields = [
    { label: "Kundnummer", value: data.kundnummer },
    { label: "Tel 1", value: data.tel1 },
    { label: "Kund", value: data.kund },
    { label: "Adress", value: data.adress },
    { label: "Startdatum", value: new Date(data.startdatum || Date.now()).toLocaleDateString('sv-SE') },
    { label: "Slutdatum", value: new Date(data.slutdatum || Date.now()).toLocaleDateString('sv-SE') },
    { label: "Takbredd", value: formatValue(data.takbredd, "m") },
    { label: "Takfall", value: formatValue(data.takfall, "m") },
    { label: "Total yta", value: formatValue(data.totalYta, "m²") },
    { label: "Typ av tak", value: data.typAvTak },
    { label: "Råspont", value: data.raspont }, // Assuming these keys exist in 'data'
    { label: "Val av takmaterial", value: data.valAvTakmaterial },
    { label: "Färg", value: data.farg },
    { label: "Hängränna", value: formatValue(data.hangranna, "m") },
    { label: "Snörasskydd", value: formatValue(data.snorasskydd, "m") },
    { label: "Ränndalar", value: formatValue(data.ranndalar, "m") },
    { label: "Fotplåt", value: formatValue(data.fotplat, "m") },
    { label: "Vindskiveplåt", value: formatValue(data.vindskiveplat, "m") },
    { label: "Stuprör", value: formatValue(data.stupror, "st") },
    { label: "Takstege", value: formatValue(data.takstege, "m") },
    { label: "Skorsten", value: data.skorsten },
    { label: "Avluftning", value: formatValue(data.avluftning, "st") },
    { label: "Ventilation", value: formatValue(data.ventilation, "st") },
    { label: "Kund", value: data.kund }, // Repeated Kund, as in image
    { label: "Preliminärt ROT", value: `ca ${Number(data.preliminartROT || 0).toLocaleString('sv-SE')} kr` },
  ];

  const currentDate = new Date().toLocaleString('sv-SE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });


  return (
    <div className="calculation-dialog-overlay" onClick={onClose}>
      <div className="calculation-dialog-content" onClick={(e) => e.stopPropagation()}>
        <button className="calculation-dialog-close-button" onClick={onClose}>
          <X size={28} />
        </button>
        <div className="calculation-dialog-header">
          <h3>Projekteringsmall</h3>
          <p className="date-time-stamp">{currentDate}</p>
        </div>
        <div className="calculation-dialog-body">
          {displayFields.map(field => (
            <div className="detail-row" key={field.label}>
              <span className="detail-label">{field.label}</span>
              <span className={`detail-value ${field.value && ['Valmat', 'Tegel', 'Svart', 'Hel'].includes(String(field.value)) ? 'highlighted-value' : ''}`}>
                {field.value !== null && field.value !== undefined ? String(field.value) : 'Ej angivet'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};