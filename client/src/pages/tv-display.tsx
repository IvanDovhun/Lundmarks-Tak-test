import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Thermometer, Cloud } from "lucide-react";

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

const TVDisplayPage: React.FC = () => {
  const ganttRef = useRef<HTMLDivElement>(null);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Fetch projects data (only those in Gantt timeline)
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true,
  });

  // Weather icon mapping for TV display
  const getWeatherIcon = (weatherCode: number): string => {
    if (weatherCode === 0) return '☀️'; // Clear sky
    if (weatherCode >= 1 && weatherCode <= 3) return '⛅'; // Partly cloudy
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️'; // Fog
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️'; // Rain
    if (weatherCode >= 71 && weatherCode <= 86) return '❄️'; // Snow
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️'; // Thunderstorm
    return '☀️'; // Default to sunny
  };

  // Fetch weather data for Skellefteå
  const fetchWeatherData = async () => {
    try {
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=64.7506&longitude=20.9522&daily=weathercode,temperature_2m_max,temperature_2m_min&current_weather=true&timezone=Europe%2FStockholm&forecast_days=7'
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  useEffect(() => {
    fetchWeatherData();
    // Update weather every 30 minutes
    const weatherInterval = setInterval(fetchWeatherData, 30 * 60 * 1000);
    
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => {
      clearInterval(weatherInterval);
      clearInterval(timeInterval);
    };
  }, []);

  // Transform project data into Gantt tasks
  const transformProjectsToGanttTasks = (projects: any[]): GanttTask[] => {
    if (!projects) return [];
    
    return projects.map((project: any) => {
      const startDate = project.planningStartDate ? new Date(project.planningStartDate) : new Date();
      const endDate = project.planningEndDate ? new Date(project.planningEndDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      let progress = 0;
      let customClass = 'pending';
      
      switch(project.overallStatus) {
        case 'completed':
          progress = 100;
          customClass = 'completed';
          break;
        case 'in_progress':
          progress = 50;
          customClass = 'in-progress';
          break;
        case 'scheduled':
          progress = 25;
          customClass = 'scheduled';
          break;
        default:
          progress = 0;
          customClass = 'pending';
      }

      const teamDisplayNames = {
        'Team A': 'Labba & Andreas',
        'Team B': 'Mori & Jack', 
        'Team C': 'Isaac & Anton',
        'Team D': 'Elliot & Mille',
        'Team E': 'Liam & Hayle'
      };
      
      const teamDisplay = project.teamAssigned ? teamDisplayNames[project.teamAssigned] || project.teamAssigned : '';
      const projectName = teamDisplay 
        ? `${project.kundFirstName} ${project.kundLastName} - ${teamDisplay}`
        : `${project.kundFirstName} ${project.kundLastName}`;

      return {
        id: `project-${project.id}`,
        name: projectName,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: progress,
        custom_class: customClass,
        team: teamDisplay,
        address: project.address || project.adress,
        customer: `${project.kundFirstName} ${project.kundLastName}`,
        phone: project.tel1
      };
    });
  };

  const ganttTasks = transformProjectsToGanttTasks(projects || []);

  // Create TV-optimized Gantt chart
  const createTVGanttChart = (container: HTMLElement, tasks: any[]) => {
    container.innerHTML = '';

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Generate date range for current month
    const dateRange = [];
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    // Create main container
    const ganttContainer = document.createElement('div');
    ganttContainer.style.cssText = `
      width: 100%;
      height: 100%;
      background: #1a1a1a;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      overflow: hidden;
    `;

    // Create header with large date display
    const header = document.createElement('div');
    header.style.cssText = `
      height: 120px;
      background: linear-gradient(135deg, #1e3a8a, #1e40af);
      display: flex;
      align-items: center;
      padding: 0 40px;
      border-bottom: 3px solid #3b82f6;
    `;

    // Month and year display
    const monthDisplay = document.createElement('div');
    monthDisplay.textContent = today.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' }).toUpperCase();
    monthDisplay.style.cssText = `
      font-size: 48px;
      font-weight: 700;
      color: white;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
      min-width: 400px;
    `;

    // Current time and weather
    const infoSection = document.createElement('div');
    infoSection.style.cssText = `
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    // Time display
    const timeDisplay = document.createElement('div');
    timeDisplay.textContent = currentTime.toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit' 
    });
    timeDisplay.style.cssText = `
      font-size: 36px;
      font-weight: 600;
      color: #fbbf24;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
    `;

    // Current weather
    const weatherDisplay = document.createElement('div');
    if (weatherData?.current_weather) {
      const temp = Math.round(weatherData.current_weather.temperature);
      const weatherIcon = getWeatherIcon(weatherData.current_weather.weathercode);
      weatherDisplay.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 8px;">${weatherIcon}</div>
          <div style="font-size: 28px; font-weight: 600;">${temp}°C</div>
          <div style="font-size: 16px; color: #e5e7eb;">Skellefteå</div>
        </div>
      `;
    }
    weatherDisplay.style.cssText = `
      text-align: center;
      color: white;
    `;

    infoSection.appendChild(timeDisplay);
    infoSection.appendChild(weatherDisplay);
    header.appendChild(monthDisplay);
    header.appendChild(infoSection);
    ganttContainer.appendChild(header);

    // Create weekly view with larger elements
    const weekView = document.createElement('div');
    weekView.style.cssText = `
      padding: 40px;
      height: calc(100% - 120px);
      overflow-y: auto;
    `;

    // Group projects by week
    const today_date = today.getDate();
    const weekStart = Math.max(1, today_date - (today_date % 7));
    const weekEnd = Math.min(endOfMonth.getDate(), weekStart + 6);

    // Week header
    const weekHeader = document.createElement('div');
    weekHeader.style.cssText = `
      display: grid;
      grid-template-columns: 300px repeat(7, 1fr);
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #374151;
    `;

    // Team column header
    const teamHeaderCell = document.createElement('div');
    teamHeaderCell.textContent = 'TEAM';
    teamHeaderCell.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      color: #3b82f6;
      text-align: center;
      padding: 20px;
      background: #374151;
      border-radius: 12px;
    `;
    weekHeader.appendChild(teamHeaderCell);

    // Day headers with weather
    for (let day = weekStart; day <= weekEnd; day++) {
      const dayDate = new Date(currentYear, currentMonth, day);
      const isToday = day === today.getDate();
      
      const dayHeader = document.createElement('div');
      
      // Get weather for this day
      let weatherIcon = '☀️';
      if (weatherData?.daily?.time) {
        const dateStr = dayDate.toISOString().split('T')[0];
        const weatherIndex = weatherData.daily.time.indexOf(dateStr);
        if (weatherIndex !== -1 && weatherData.daily.weathercode) {
          weatherIcon = getWeatherIcon(weatherData.daily.weathercode[weatherIndex]);
        }
      }
      
      dayHeader.innerHTML = `
        <div style="text-align: center;">
          <div style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">
            ${dayDate.toLocaleDateString('sv-SE', { weekday: 'short' }).toUpperCase()}
          </div>
          <div style="font-size: 32px; font-weight: 700; margin-bottom: 8px; ${isToday ? 'color: #fbbf24;' : ''}">${day}</div>
          <div style="font-size: 32px;">${weatherIcon}</div>
        </div>
      `;
      
      dayHeader.style.cssText = `
        padding: 20px;
        background: ${isToday ? '#1e40af' : '#374151'};
        border-radius: 12px;
        border: ${isToday ? '3px solid #fbbf24' : 'none'};
        text-align: center;
        color: white;
      `;
      
      weekHeader.appendChild(dayHeader);
    }

    weekView.appendChild(weekHeader);

    // Group tasks by team
    const teamGroups = new Map();
    tasks.forEach(task => {
      const team = task.team || 'Inget team';
      if (!teamGroups.has(team)) {
        teamGroups.set(team, []);
      }
      teamGroups.get(team).push(task);
    });

    // Display teams and their projects
    teamGroups.forEach((teamTasks, teamName) => {
      const teamRow = document.createElement('div');
      teamRow.style.cssText = `
        display: grid;
        grid-template-columns: 300px repeat(7, 1fr);
        gap: 20px;
        margin-bottom: 30px;
        align-items: start;
      `;

      // Team info cell
      const teamCell = document.createElement('div');
      teamCell.innerHTML = `
        <div style="text-align: center; padding: 30px; background: #1e40af; border-radius: 12px; min-height: 120px; display: flex; flex-direction: column; justify-content: center;">
          <div style="font-size: 28px; font-weight: 700; color: white; margin-bottom: 10px;">
            ${teamName}
          </div>
          <div style="font-size: 16px; color: #bfdbfe;">
            ${teamTasks.length} projekt
          </div>
        </div>
      `;
      teamRow.appendChild(teamCell);

      // Day cells for this team
      for (let day = weekStart; day <= weekEnd; day++) {
        const dayDate = new Date(currentYear, currentMonth, day);
        const dateStr = dayDate.toISOString().split('T')[0];
        
        const dayCell = document.createElement('div');
        dayCell.style.cssText = `
          min-height: 120px;
          background: #374151;
          border-radius: 12px;
          padding: 15px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        `;

        // Find projects for this team on this day
        const dayProjects = teamTasks.filter(task => {
          const taskStart = new Date(task.start);
          const taskEnd = new Date(task.end);
          return dayDate >= taskStart && dayDate <= taskEnd;
        });

        dayProjects.forEach(project => {
          const projectCard = document.createElement('div');
          const statusColor = project.custom_class === 'completed' ? '#10b981' : 
                             project.custom_class === 'in-progress' ? '#3b82f6' : '#9ca3af';
          
          projectCard.innerHTML = `
            <div style="background: ${statusColor}; padding: 12px; border-radius: 8px; color: white;">
              <div style="font-size: 16px; font-weight: 600; margin-bottom: 4px;">
                ${project.customer}
              </div>
              <div style="font-size: 14px; opacity: 0.9;">
                ${project.address || ''}
              </div>
            </div>
          `;
          
          dayCell.appendChild(projectCard);
        });

        if (dayProjects.length === 0) {
          dayCell.innerHTML = '<div style="color: #6b7280; text-align: center; margin-top: 40px; font-size: 18px;">Ledigt</div>';
        }

        teamRow.appendChild(dayCell);
      }

      weekView.appendChild(teamRow);
    });

    ganttContainer.appendChild(weekView);
    container.appendChild(ganttContainer);
  };

  useEffect(() => {
    if (ganttRef.current && ganttTasks.length > 0) {
      createTVGanttChart(ganttRef.current, ganttTasks);
    }
  }, [ganttTasks, weatherData, currentTime]);

  return (
    <div className="h-screen w-screen bg-gray-900 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-8"></div>
            <p className="text-2xl">Laddar projektdata...</p>
          </div>
        </div>
      ) : (
        <div ref={ganttRef} className="w-full h-full"></div>
      )}
    </div>
  );
};

export default TVDisplayPage;