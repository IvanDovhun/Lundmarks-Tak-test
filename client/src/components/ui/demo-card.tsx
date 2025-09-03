import React, { useState } from 'react';
import '../css/DemoCard.css'; // We'll create this CSS file
import { UserIcon, MapIcon, CalendarIcon, PriceIcon, PDFIcon, ImageIcon, ChatIcon, DownloadFileIcon } from '../../icons/svg';
import CommentsDialog from './comments-dialog';


const iconMap = {
  pdf: PDFIcon,
  image: ImageIcon,
  chat: ChatIcon,
}

export const DemoCard = ({ item, showSellerInfo  }) => {
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);

  const handleCommentsClick = () => {
    setIsCommentsDialogOpen(true);
  };

  return (
    <div className="demonstration-card">
      <div className="card-info-row card-title">
        <UserIcon className="card-icon" />
        <span>{item.customerName}</span>
      </div>
      <div className="card-info-row">
        <MapIcon className="card-icon"/>
        <span>{item.adress}</span>
      </div>
      <div className="card-info-row">
        <CalendarIcon className="card-icon" />
        <span>{new Date(item.date).toLocaleDateString('sv-SE')}</span>
      </div>
      <div className="card-info-row">
        <PriceIcon className="card-icon" />
        <span>{item.price.toLocaleString('sv-SE')} kr</span>
      </div>
      {showSellerInfo && (
        <div className="card-seller">
          Säljare: {item.sellerName}
        </div>
      )}
      <div className="card-actions">
        {item.comments?.length > 0 && (
          <div className='action-button' onClick={handleCommentsClick}>
            <ChatIcon className="action-icon" />
          </div>
        )}
      </div>

      <CommentsDialog
        isOpen={isCommentsDialogOpen}
        onClose={() => setIsCommentsDialogOpen(false)}
        comments={item.comments || []}
        customerName={item.customerName}
      />
    </div>
  );
};

export default DemoCard;