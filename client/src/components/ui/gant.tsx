import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  // eachDayOfInterval, // No longer needed for explicit day headers
  differenceInDays,
  addDays,
  addWeeks,
  isSameDay,
  max,
  min,
  parseISO,
  startOfDay,
  isWithinInterval,
  getWeek,
  endOfDay, // Needed for interval checks
} from 'date-fns';
import { sv } from 'date-fns/locale';

import '../css/GanttChart.css';

// Enhanced color palettes for teams
const getTeamColor = (teamName, teamColor) => {
  const colorPalette = {
    'Team A': '#667eea',
    'Team B': '#f093fb', 
    'Team C': '#4facfe',
    'Team D': '#43e97b',
    'Team E': '#fa709a',
    'Team F': '#fee140',
    'default': teamColor || '#667eea'
  };
  return colorPalette[teamName] || colorPalette.default;
};

const getTeamColorDark = (teamName, teamColor) => {
  const colorPalette = {
    'Team A': '#764ba2',
    'Team B': '#f68084',
    'Team C': '#00d2ff', 
    'Team D': '#38f9d7',
    'Team E': '#fecfef',
    'Team F': '#fa8c00',
    'default': teamColor ? darkenColor(teamColor) : '#764ba2'
  };
  return colorPalette[teamName] || colorPalette.default;
};

const darkenColor = (color) => {
  // Simple darkening function - in production, use a proper color library
  return color.replace(/[0-9a-f]/gi, (match) => {
    return Math.max(0, parseInt(match, 16) - 3).toString(16);
  });
};

// --- Helper Functions ---
const safeParseDate = (dateInput) => {
    // Handle null/undefined/empty inputs
    if (!dateInput || dateInput === '' || dateInput === null || dateInput === undefined) {
        return null;
    }
    
    if (dateInput instanceof Date) {
        return startOfDay(dateInput);
    }
    if (typeof dateInput === 'string') {
        try {
            return startOfDay(parseISO(dateInput));
        } catch (e) {
            console.error("Invalid date string format:", dateInput, e);
            return null;
        }
    }
    if (typeof dateInput === 'number') {
        return startOfDay(new Date(dateInput));
    }
    console.error("Invalid date input type:", dateInput);
    return null;
};

// --- Constants ---
const WEEKS_TO_SHOW = 6;
const NAVIGATION_STEP_WEEKS = 1;
const INITIAL_VIEW_START_OFFSET_WEEKS = -2; // Start 3 weeks before current week

// --- Component ---
const GanttChart = ({ cards = [] }) => {
  const [today, setToday] = useState(startOfDay(new Date()));

  // Calculate the start date for the initial view
  const calculateInitialViewStart = useCallback(() => {
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    return addWeeks(currentWeekStart, INITIAL_VIEW_START_OFFSET_WEEKS);
  }, [today]); // Recalculate if today changes (e.g., across midnight)

  // State to manage the start date of the visible 8-week window
  const [viewStartDate, setViewStartDate] = useState(calculateInitialViewStart());

  // Update viewStartDate if today changes causing initial view to shift
  useEffect(() => {
      setViewStartDate(calculateInitialViewStart());
  }, [calculateInitialViewStart]);


  // --- Calculate Fixed 8-Week Timeline ---
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    // Ensure viewStartDate is the start of a week
    const start = startOfWeek(viewStartDate, { weekStartsOn: 1 });
    const end = endOfWeek(addWeeks(start, WEEKS_TO_SHOW - 1), { weekStartsOn: 1 });

    return {
      timelineStart: start,
      timelineEnd: end,
      totalDays: WEEKS_TO_SHOW * 7,
    };
  }, [viewStartDate]); // Recalculate only when the viewStartDate changes


  const weeks = useMemo(() => {
    if (!timelineStart || !timelineEnd) return [];
    const intervalWeeks = eachWeekOfInterval(
      { start: timelineStart, end: timelineEnd },
      { weekStartsOn: 1 }
    );

    // Map directly using index for positioning in the grid
    return intervalWeeks.map((weekStart, index) => {
      // Each week spans 7 days in our fixed grid
      const startDayIndex = index * 7;
      const durationDays = 7;

      return {
        name: `V${getWeek(weekStart, { weekStartsOn: 1, firstWeekContainsDate: 4 })}`,
        startDayIndex, // 0, 7, 14, ...
        durationDays, // Always 7
      };
    });
  }, [timelineStart, timelineEnd]); // Depends only on the overall interval

 const months = useMemo(() => {
     if (!timelineStart || !timelineEnd) return [];
     const monthData = [];
     let current = timelineStart;

     while (current <= timelineEnd) {
         const monthStart = startOfMonth(current);
         const monthEnd = endOfMonth(current);

         // Find intersection with the current timeline view
         const effectiveMonthStart = max([monthStart, timelineStart]);
         const effectiveMonthEnd = min([monthEnd, timelineEnd]);

         const startDayIndex = differenceInDays(effectiveMonthStart, timelineStart);
         const endDayIndex = differenceInDays(effectiveMonthEnd, timelineStart);
         const durationDays = endDayIndex - startDayIndex + 1;

         if (durationDays > 0) {
             monthData.push({
                 name: format(effectiveMonthStart, 'MMMM', { locale: sv }),
                 startDayIndex,
                 durationDays,
             });
         }

         // Move to the day after the end of the current month's intersection
         current = addDays(effectiveMonthEnd, 1);
     }
     return monthData;
 }, [timelineStart, timelineEnd]);


  // --- Calculate Position for "Today" Line ---
  const todayPosition = useMemo(() => {
    if (!isWithinInterval(today, { start: timelineStart, end: timelineEnd })) {
      return null; // Today is outside the visible range
    }
    const daysFromStart = differenceInDays(today, timelineStart);
    return ((daysFromStart + 0.5) / totalDays) * 100;
  }, [today, timelineStart, timelineEnd, totalDays]);

  // --- Calculate Card Positions (No change needed here) ---
   const getCardPosition = useCallback((card) => {
       const startDate = safeParseDate(card.startDate);
       const endDate = safeParseDate(card.endDate);

       if (!startDate || !endDate || !timelineStart || !timelineEnd || totalDays <= 0 || endDate < startDate) {
           return { display: 'none' };
       }

       const cardEnd = endOfDay(endDate); // Use end of day for interval check
       if (cardEnd < timelineStart || startDate > timelineEnd) {
           return { display: 'none' }; // Card is completely outside the view
       }

       const effectiveStartDate = max([startDate, timelineStart]);
       const effectiveEndDate = min([endDate, timelineEnd]);

       const startDayIndex = differenceInDays(effectiveStartDate, timelineStart);
       const endDayIndex = differenceInDays(effectiveEndDate, timelineStart);

       const durationDays = Math.max(0, endDayIndex - startDayIndex + 1);

       if (durationDays <= 0) {
           return { display: 'none' };
       }

       const leftPercent = (startDayIndex / totalDays) * 100;
       const widthPercent = (durationDays / totalDays) * 100;

       return {
           left: `${leftPercent}%`,
           width: `${widthPercent}%`,
           display: 'flex',
       };
   }, [timelineStart, timelineEnd, totalDays]);


  // --- Navigation Handlers ---
  const handlePrev = () => {
    setViewStartDate(prev => addWeeks(prev, -NAVIGATION_STEP_WEEKS)); // Move 4 weeks back
  };

  const handleNext = () => {
    setViewStartDate(prev => addWeeks(prev, NAVIGATION_STEP_WEEKS)); // Move 4 weeks forward
  };

   // Update today's date periodically
   useEffect(() => {
       const timer = setInterval(() => {
           const newToday = startOfDay(new Date());
           if (!isSameDay(today, newToday)) {
               setToday(newToday); // This will trigger re-calculation of initial view if needed
           }
       }, 60 * 1000);
       return () => clearInterval(timer);
   }, [today]); // Dependency is only today

    // Style for the grid - use fractional units
    const timelineGridStyle = useMemo(() => ({
        gridTemplateColumns: `repeat(${totalDays}, 1fr)`,
    }), [totalDays]); // totalDays is constant (56) but kept for clarity

    // Calculate the number of rows needed for the grid background
    const rowCount = cards.length; // Number of project rows
    console.log(rowCount);

  return (
    <div className="gantt-chart-container">
       {/* --- Navigation Controls --- */}
       <div className="gantt-navigation">
           <button onClick={handlePrev}> Föregående</button>
            {/* Format date range using short month format */}
           <span>
                {format(timelineStart, 'd MMM yyyy', { locale: sv })} - {format(timelineEnd, 'd MMM yyyy', { locale: sv })}
            </span>
           <button onClick={handleNext}>Nästa </button>
       </div>

      <div className="gantt-chart">
          {/* --- Header --- */}
          <div className="gantt-header">
              <div className="gantt-header-projects">PROJEKT</div>
              <div className="gantt-header-timeline"> {/* No scroll needed here */}
                  {/* Month Row */}
                  <div className="gantt-row gantt-months" style={timelineGridStyle}>
                      {months.map((month, index) => (
                          <div
                              key={`month-${index}`}
                              className="gantt-header-cell month-cell"
                              style={{
                                  gridColumn: `${month.startDayIndex + 1} / span ${month.durationDays}`,
                              }}
                          >
                              {month.name}
                          </div>
                      ))}
                  </div>
                  {/* Week Row */}
                  <div className="gantt-row gantt-weeks" style={timelineGridStyle}>
                      {weeks.map((week, index) => (
                          <div
                              key={`week-${index}`}
                              className="gantt-header-cell week-cell"
                              style={{
                                   // Each week cell now spans exactly 7 grid columns
                                  gridColumn: `${week.startDayIndex + 1} / span ${week.durationDays}`,
                              }}
                          >
                              {week.name}
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* --- Grid Body --- */}
          <div className="gantt-body">
              <div className="gantt-projects-column"> {/* No longer sticky */}
                  {cards.map((card, index) => (
                      <div key={card.id || index} className="gantt-row project-name-cell">
                          {card.address}
                      </div>
                  ))}
              </div>

              {/* Timeline Column - NO SCROLL */}
              <div className="gantt-timeline-column">
                  {/* Background Grid Lines */}
                  <div
                      className="gantt-grid-background"
                      style={{
                          ...timelineGridStyle,
                           // Set row count dynamically based on cards length + spacer row
                          gridTemplateRows: `repeat(${rowCount}, 55px)`
                      }}
                  >
                      {/* Render flat grid cells based on total days * rows */}
                      {[...Array(totalDays * (rowCount))].map((_, i) => (
                          <div key={`grid-${i}`} className="gantt-grid-cell"></div>
                      ))}
                  </div>

                  {/* Card Bars Container - Spans full width */}
                  <div className="gantt-cards-container">
                      {cards.map((card, index) => {
                          const style = getCardPosition(card);
                          return (
                              <div key={card.id || index} className="gantt-row card-row">
                                  {style.display !== 'none' && (
                                      <div 
                                        className="gantt-card-bar" 
                                        style={{
                                          ...style,
                                          '--bar-color': getTeamColor(card.team, card.teamColor),
                                          '--bar-color-dark': getTeamColorDark(card.team, card.teamColor)
                                        }}
                                      >
                                          <span className="card-bar-text">{card.team}</span>
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>

                  {/* Today Line Container - Spans full width */}
                  {todayPosition !== null && (
                      <div className="gantt-today-line-container">
                          <div
                              className="gantt-today-line"
                              style={{ left: `${todayPosition}%` }}
                          ></div>
                          <div
                              className="gantt-today-label"
                              style={{ left: `${todayPosition}%` }}
                          >
                              IDAG
                          </div>
                      </div>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
};

export default GanttChart;