import React from 'react';
import { X } from 'lucide-react';
import './ActionModal.css';

const ActionModal = ({ isOpen, onClose, deal, onModalOptionClick }) => {
  if (!isOpen || !deal) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close-button" onClick={onClose}>
          <X size={24} />
        </button>
        <h3 className="modal-title">Vad vill du göra?</h3>
        <p className="modal-deal-info">
          Projekt: {deal.dealId} - {deal.buyerName}
        </p>
        <div className="modal-actions">
          <button className="modal-action-button" onClick={() => onModalOptionClick('add', deal)}>
            Göra tillägg
          </button>
          <button className="modal-action-button" onClick={() => onModalOptionClick('viewCalculation', deal)}>
            Se Beräkning
          </button>
          {/* Add more buttons as needed based on context */}
        </div>
      </div>
    </div>
  );
};

export default ActionModal;