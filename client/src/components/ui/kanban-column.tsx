import React from 'react';
import ProjectCard from './deal-card';
import './KanbanColumn.css';

const KanbanColumn = ({ title, deals, onCardActionClick }) => {
  return (
    <div className="kanban-column">
      <h2 className="column-title">{title}</h2>
      <div className="column-cards">
        {deals.map(deal => (
          <ProjectCard key={deal.id} deal={deal} onActionClick={onCardActionClick} />
        ))}
        {deals.length === 0 && <p className="empty-column-message">Inga projekt här.</p>}
      </div>
    </div>
  );
};

export default KanbanColumn;