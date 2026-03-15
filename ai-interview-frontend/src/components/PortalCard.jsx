import React from 'react';
import { ChevronRight } from 'lucide-react';
import './PortalCard.css';

const PortalCard = ({ title, description, icon, buttonText, accentColor, onClick }) => {
  return (
    <div 
      className="portal-card" 
      onClick={onClick}
      style={{ '--card-accent': accentColor }}
    >
      <div className="portal-card-icon-wrapper">
        {React.createElement(icon, { size: 28 })}
      </div>
      <h3 className="portal-card-title">{title}</h3>
      <p className="portal-card-desc">{description}</p>
      <div className="portal-card-btn">
        {buttonText} <ChevronRight size={16} />
      </div>
    </div>
  );
};

export default PortalCard;
