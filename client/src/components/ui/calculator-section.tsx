import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes for type checking


function CalculatorSection({
  title,
  children, // Using children for the main body content is idiomatic React
  endContent,
  className = '',
  titleClassName = '',
  bodyClassName = '',
  endClassName = '',
}) {
  return (
    // You can use <section>, <div>, or any appropriate container
    <section className={`calculator-section ${className}`}>
      {/* --- Title --- */}
      {title && ( // Render title only if provided
        // Using h3, adjust heading level (h2, h4 etc.) as needed semantically
        <>
          <h3 className={`calculator-title ${titleClassName}`}>
            {title}
          </h3>
          {/* --- Separator After Title --- */}
          <hr className={`calculator-separator`} />
        </>
      )}

      {/* --- Body Content (using children) --- */}
      {children && ( // Render body only if children are provided
          <div className={`calculation-section-body ${bodyClassName} space-y-4`}>
              {children}
          </div>
      )}


      {/* --- End Content (Optional) --- */}
      {endContent && ( // Render end content only if provided
      <>
        <hr className={`calculation-section-separator`} />
        <div className={`calculation-section-end ${endClassName}`}>
          {endContent}
        </div>
      </>
      )}
    </section>
  );
}

// PropTypes for type checking and documentation
CalculatorSection.propTypes = {
  title: PropTypes.string.isRequired, // Title is required
  children: PropTypes.node,          // Body content (can be anything renderable)
  endContent: PropTypes.node,        // Optional end content
  className: PropTypes.string,       // Optional class for the container
  titleClassName: PropTypes.string,  // Optional class for the title
  bodyClassName: PropTypes.string,   // Optional class for the body wrapper
  endClassName: PropTypes.string,    // Optional class for the end content wrapper
};

export default CalculatorSection;