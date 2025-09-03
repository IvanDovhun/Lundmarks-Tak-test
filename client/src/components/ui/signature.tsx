import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

function SignatureField({ onSave, placeholderText = "Signera här..." }) {
  const [showPlaceholder, setShowPlaceholder] = useState(true); // State for placeholder
  const sigPadRef = useRef(null);

  const clear = () => {
    sigPadRef.current.clear();
    setShowPlaceholder(true); // Show placeholder again when cleared
  };

  const handleBeginDrawing = () => {
    setShowPlaceholder(false); // Hide placeholder on drawing start
  };


  return (
    <>
      <div>
        {showPlaceholder && (
          <div className="signPlaceholder">
            {placeholderText}
          </div>
        )}
        <SignatureCanvas
          ref={sigPadRef}
          penColor='black'
          canvasProps={{ className: 'signCanvas' }}
          onBegin={handleBeginDrawing} // Add the onBegin handler
          // onEnd could also be used to check isEmpty if needed,
          // but onBegin is better for hiding the placeholder immediately
          // onEnd={() => { if(sigPadRef.current.isEmpty()) setShowPlaceholder(true); }}
        />
      </div>
      <div className="signButton">
        <button type="button" className="button" onClick={clear}>Clear</button>
      </div>
  </>
  );
}

export { SignatureField }