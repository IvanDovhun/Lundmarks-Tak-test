// src/components/ui/DateRangeInput.tsx (Create this new file)

import React, { useState, useEffect } from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { Button } from '@/components/ui/button'; // Assuming you use shadcn Button
import { Input } from '@/components/ui/input';   // Assuming you use shadcn Input
import { PencilIcon, CheckIcon, XIcon } from 'lucide-react'; // Example icons

interface DateRangeInputProps {
  label: string;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  onDatesChange: (dates: { startDate: string | null; endDate: string | null }) => void;
  className?: string;
  hideLabel?: boolean; // <--- Add this prop
}

export function DateRangeInput({
  label,
  startDate,
  endDate,
  onDatesChange,
  className = '',
  hideLabel = false, // <--- Default to false
}: DateRangeInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Use internal state for edits to avoid updating parent until save
  const [editStartDate, setEditStartDate] = useState(startDate || '');
  const [editEndDate, setEditEndDate] = useState(endDate || '');
  const [error, setError] = useState<string | null>(null);

  // Update internal edit state if external props change (e.g., form reset)
  useEffect(() => {
    setEditStartDate(startDate || '');
    setEditEndDate(endDate || '');
  }, [startDate, endDate]);

  const handleEdit = () => {
    // Reset edit state to current actual dates when starting edit
    setEditStartDate(startDate || '');
    setEditEndDate(endDate || '');
    setError(null); // Clear previous errors
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Optional: Reset edit state back to original props values if needed
    // setEditStartDate(startDate || '');
    // setEditEndDate(endDate || '');
  };

  const handleSave = () => {
    setError(null);
    const start = editStartDate ? parseISO(editStartDate) : null;
    const end = editEndDate ? parseISO(editEndDate) : null;

    // Basic Validation
    if (editStartDate && !isValid(start)) {
        setError("Ogiltigt startdatum.");
        return;
    }
    if (editEndDate && !isValid(end)) {
        setError("Ogiltigt slutdatum.");
        return;
    }
    if (start && end && end < start) {
      setError('Slutdatum kan inte vara före startdatum.');
      return;
    }
    // If only one date is entered, allow saving it
    if ((!editStartDate && editEndDate) || (editStartDate && !editEndDate)){
        // You might want validation here - e.g. require both or neither?
        // For now, allowing partial range. Adjust if needed.
         console.warn("Saving partial date range.");
    }


    // Call the callback prop with the new values (or null if empty)
    onDatesChange({
      startDate: editStartDate || null,
      endDate: editEndDate || null,
    });
    setIsEditing(false);
  };

  // Format dates for display, handle null/undefined
  const formatDisplayDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Ej satt';
    try {
      const dateObj = parseISO(dateString); // Input is YYYY-MM-DD
      return isValid(dateObj) ? format(dateObj, 'yyyy-MM-dd') : 'Ogiltigt datum';
    } catch (e) {
      return 'Ogiltigt datum';
    }
  };

  const displayValue = `${formatDisplayDate(startDate)} - ${formatDisplayDate(endDate)}`;
  const showDisplayValue = startDate || endDate; // Only show dash etc. if at least one date exists

  return (
    <div className={!hideLabel ? `form-group ${className}` : className}>
      {!hideLabel && <label className="form-label mb-1">{label}</label>}
      <div className="flex items-center gap-2 flex-wrap">
        {isEditing ? (
          <>
            <div className="flex items-end gap-2 flex-wrap">
              <div className="flex flex-col space-y-1">
                <label htmlFor={`startDate-${label}`} className="text-xs">Start</label>
                <Input
                  id={`startDate-${label}`}
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className={`input-field editable-input !w-auto ${error ? 'border-red-500' : ''}`}
                />
              </div>
               <span className="text-muted-foreground pb-1">-</span>
              <div className="flex flex-col space-y-1">
                <label htmlFor={`endDate-${label}`} className="text-xs">Slut</label>
                <Input
                  id={`endDate-${label}`}
                  type="date"
                  value={editEndDate}
                  onChange={(e) => setEditEndDate(e.target.value)}
                  className={`input-field editable-input !w-auto ${error ? 'border-red-500' : ''}`}
                  min={editStartDate || undefined} // Prevent end date before start date in picker
                />
              </div>
              <Button type="button" size="icon" variant="ghost" onClick={handleSave} className="text-green-600 hover:text-green-700">
                <CheckIcon className="h-4 w-4" />
              </Button>
              <Button type="button" size="icon" variant="ghost" onClick={handleCancel} className="text-red-600 hover:text-red-700">
                <XIcon className="h-4 w-4" />
              </Button>
               {error && <p className="text-red-500 text-xs mt-1 w-full">{error}</p>}
            </div>
          </>
        ) : (
          <>
            <span className="input-field !w-auto min-h-[36px] flex items-center px-3 flex-grow"> {/* Allow span to grow */}
              {showDisplayValue ? displayValue : 'Ej satt'}
            </span>
            <Button type="button" size="icon" variant="ghost" onClick={handleEdit} className="flex-shrink-0"> {/* Prevent button shrink */}
              <PencilIcon className="h-4 w-4" />
            </Button>
            
          </>
        )}
      </div>
      {isEditing && error && <p className="text-red-500 text-xs mt-1 w-full">{error}</p>}
    </div>
  );
}