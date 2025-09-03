import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import '../css/CommentsDialog.css';

interface Comment {
  id: number;
  text: string;
  createdAt: string;
}

interface CommentsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  customerName: string;
}

export const CommentsDialog: React.FC<CommentsDialogProps> = ({
  isOpen,
  onClose,
  comments,
  customerName
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="comments-dialog">
        <DialogHeader>
          <DialogTitle className="comments-dialog-title">
            Kommentarer för {customerName}
          </DialogTitle>
          <button 
            onClick={onClose}
            className="comments-dialog-close"
          >
          </button>
        </DialogHeader>
        <div className="comments-container">
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment-bubble">
                <div className="comment-text">
                  {comment.text}
                </div>
                <div className="comment-date">
                  {new Date(comment.createdAt).toLocaleDateString('sv-SE', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="no-comments">
              Inga kommentarer tillgängliga
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CommentsDialog;