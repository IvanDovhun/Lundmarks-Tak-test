import React, { useState, useEffect, useRef } from 'react';
import '../css/DemoCard.css'; // We'll create this CSS file
import { UserIcon, MapIcon, CalendarIcon, PriceIcon, PDFIcon, ImageIcon, ChatIcon, BuildingIcon, ProjectingIcon, AttachIcon, CameraIcon } from '../../icons/svg';
import { Deal } from '@shared/schema';
import CommentsDialog from './comments-dialog';
import { Plus, FileText, Edit, Camera, ChevronDown, Calculator } from 'lucide-react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

const iconMap = {
  pdf: PDFIcon,
  image: ImageIcon,
  chat: ChatIcon,
}

const openPDF = (dealId: number) => {
  const pdfUrl = `/api/deals/${dealId}/pdf`;
  window.open(pdfUrl, "_blank");
};

export const DealCard = ({ deal, onProjectMutation, isAdmin }: { deal: Deal; onProjectMutation: () => void; isAdmin: boolean }) => {
  const [isCommentsDialogOpen, setIsCommentsDialogOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const handleCommentsClick = () => {
    setIsCommentsDialogOpen(true);
  };

  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click handler from firing
    setIsMenuOpen(!isMenuOpen);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const uploadImageMutation = useMutation({
    mutationFn: async (data: File) => {
      console.log("Uploading new image to project: ", deal.dealId);
      console.log(data);
      const formData = new FormData();
      formData.append('image', data);
      const res = await apiRequest("POST", `/api/deals/${deal.id}/upload-image`, formData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Beräkning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <div className="demonstration-card">
      <div className="card-info-row card-title">
        <div className="info-item">
          <UserIcon className="card-icon card-title-icon" />
          <span>{deal.customerName}</span>
        </div>
        {deal.dealId && (
          <div className="info-item deal-id-item ms-auto">
            <BuildingIcon className="card-icon card-title-icon" />
            <span>{deal.dealId}</span>
          </div>
        )}
      </div>
      <div className="card-info-row">
        <MapIcon className="card-icon"/>
        <span>{deal.adress}</span>
      </div>
      <div className="card-info-row">
        <CalendarIcon className="card-icon" />
        <span>{new Date(deal.date).toLocaleDateString('sv-SE')}</span>
      </div>
      <div className="card-info-row">
        <PriceIcon className="card-icon" />
        <span>{deal.price.toLocaleString('sv-SE')} kr</span>
      </div>
      {isAdmin && (
        <div className="card-seller">
          Säljare: {deal.sellerName}
        </div>
      )}
      <div className="card-actions">
        <div className='action-button' onClick={(e) => {
          e.stopPropagation();
          openPDF(deal.id);
        }}>
          <PDFIcon className="action-icon" />
        </div>
        {deal.imageLinks?.map(imageLink => {
          return <div className='action-button' key={imageLink} onClick={(e) => {
            e.stopPropagation();
            window.open(imageLink, '_blank', 'noopener,noreferrer');
          }}
          title={`View image: ${imageLink.substring(imageLink.lastIndexOf('/') + 1)}`}>
            {imageLink.includes('agreementFile') ? <ImageIcon className="action-icon" /> :
            <ImageIcon className="action-icon" />}
          </div>;
        })}
        {deal.comments?.length > 0 && (
          <div className='action-button' onClick={(e) => {
            e.stopPropagation();
            handleCommentsClick();
          }}>
            <ChatIcon className="action-icon" />
          </div>
        )}
      </div>

      {/* Plus button and menu - without the specific SVG icon */}
      {isAdmin && deal.dealStatus != 'Klar' && <div className="plus-menu-container" ref={menuRef}>
        <div className={`action-button plus-button ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          {isMenuOpen ? <ChevronDown className="action-icon" /> : <Plus className="action-icon" />}
        </div>
        
        {isMenuOpen && (
          <div className="plus-menu">
            {/* Removed the first menu item that had the SVG icon */}
            <div className="menu-item" onClick={(e) => {
              e.stopPropagation();
              navigate(`/revised-calculation?dealId=${deal.id}`);
              setIsMenuOpen(false);
            }}>
              <Calculator className="menu-icon" />
            </div>
            <div className="menu-item" onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(false);
              /* Add edit action */
            }}>
              <AttachIcon className="menu-icon" />
            </div>
            <div className="menu-item">
              <>
                <input
                  type="file"
                  id={deal.dealId} // ID for the label to target
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      uploadImageMutation.mutate(e.target.files[0])
                      setIsMenuOpen(false);
                    }
                    // Optional: Reset the input value to allow uploading the same file again
                    // e.target.value = null;
                  }}
                />

                <label htmlFor={deal.dealId} className="menu-item my-3">
                  <CameraIcon className="menu-icon" />
                </label>
              </>
            </div>
          </div>
        )}
      </div>}

      <CommentsDialog
        isOpen={isCommentsDialogOpen}
        onClose={() => setIsCommentsDialogOpen(false)}
        comments={deal.comments || []}
        customerName={deal.customerName}
      />
    </div>
  );
};

export default DealCard;