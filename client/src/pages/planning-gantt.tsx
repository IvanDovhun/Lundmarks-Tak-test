import React, { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Clock, Settings, Plus, ArrowLeft, Phone, MapPin, Wrench, X } from "lucide-react";
import { Link } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Project } from "@shared/schema";
import Navbar from "@/components/ui/navbar";

// Simple Gantt implementation based on the Frappe Gantt example
interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

interface ProjectGanttData {
  id: number;
  customerName: string;
  teamAssigned: string;
  address: string;
  startDatum: string;
  slutDatum: string;
  totalYta: number;
  typAvTak: string;
  valAvTakmaterial: string;
  overallStatus: string;
  tel1: string;
  projektCode: string;
}

const PlanningGantt: React.FC = () => {
  const { toast } = useToast();
  const ganttRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<string>('Week');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);

  // Fetch projects data (only those in Gantt timeline)
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/projects'],
    enabled: true,
  });

  // Fetch all available projects (not in Gantt yet)
  const { data: allProjects } = useQuery({
    queryKey: ['/api/all-projects'],
    enabled: showAddProjectModal,
  });

  const queryClient = useQueryClient();

  // Weather icon mapping
  const getWeatherIcon = (weatherCode: number): string => {
    // WMO Weather interpretation codes
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
        'https://api.open-meteo.com/v1/forecast?latitude=64.7506&longitude=20.9522&daily=weathercode,temperature_2m_max,temperature_2m_min&timezone=Europe%2FStockholm&forecast_days=14'
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  // Add project to Gantt timeline
  const addToGanttMutation = useMutation({
    mutationFn: async (data: { projectId: number; startDate: string; endDate: string; teamAssigned?: string }) => {
      return apiRequest('POST', '/api/planning/add-project', data);
    },
    onSuccess: () => {
      toast({
        title: "Projekt tillagt",
        description: "Projektet har lagts till i Gantt-schemat",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setShowAddProjectModal(false);
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte lägga till projekt",
        variant: "destructive"
      });
    }
  });

  // Remove project from Gantt timeline
  const removeFromGanttMutation = useMutation({
    mutationFn: async (projectId: number) => {
      return apiRequest('DELETE', `/api/planning/remove-project/${projectId}`);
    },
    onSuccess: () => {
      toast({
        title: "Projekt borttaget",
        description: "Projektet har tagits bort från Gantt-schemat",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort projekt",
        variant: "destructive"
      });
    }
  });

  // Transform project data into Gantt tasks using planning dates
  const transformProjectsToGanttTasks = (projects: any[]): GanttTask[] => {
    if (!projects) return [];
    
    return projects.map((project: any) => {
      // Use planning dates for Gantt timeline (separate from actual project dates)
      const startDate = project.planningStartDate ? new Date(project.planningStartDate) : new Date();
      const endDate = project.planningEndDate ? new Date(project.planningEndDate) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Calculate progress based on status
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

      // Get display name for team
      const teamDisplayNames = {
        'Team A': 'Labba & Andreas',
        'Team B': 'Mori & Jack', 
        'Team C': 'Isaac & Anton',
        'Team D': 'Elliot & Mille',
        'Team E': 'Liam & Hayle'
      };
      
      const teamDisplay = project.teamAssigned ? teamDisplayNames[project.teamAssigned] || project.teamAssigned : '';
      const projectAddress = project.adress || project.address || `${project.kundFirstName} ${project.kundLastName}`;
      const projectName = teamDisplay 
        ? `${projectAddress} - ${teamDisplay}`
        : projectAddress;

      return {
        id: `project-${project.id}`,
        name: projectName,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: progress,
        custom_class: customClass,
      };
    });
  };

  // Filter projects by selected team
  const filteredProjects = projects?.filter((project: any) => {
    if (selectedTeam === 'all') return true;
    return project.teamAssigned === selectedTeam;
  }) || [];

  const ganttTasks = transformProjectsToGanttTasks(filteredProjects);

  // Function to show project details popup
  const showProjectPopup = (project: any, anchorElement: HTMLElement) => {
    // Remove any existing popup
    const existingPopup = document.querySelector('.project-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'project-popup';
    popup.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 24px -3px rgba(0, 0, 0, 0.2);
      padding: 16px;
      z-index: 1000;
      min-width: 300px;
      max-width: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Position popup near the clicked element
    const rect = anchorElement.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX}px`;
    popup.style.top = `${rect.bottom + window.scrollY + 10}px`;

    // Popup content
    popup.innerHTML = `
      <div style="border-bottom: 1px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 12px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">
          ${project.kundFirstName} ${project.kundLastName}
        </h3>
        <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">
          📍 ${project.address}
        </p>
      </div>
      
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
        <div>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Tak</p>
          <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 500;">
            ${project.typAvTak || 'Ej specificerat'}
          </p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Material</p>
          <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 500;">
            ${project.valAvTakmaterial || 'Ej specificerat'}
          </p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Yta</p>
          <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 500;">
            ${project.totalYta || 0} m²
          </p>
        </div>
        <div>
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Team</p>
          <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 500;">
            ${project.teamAssigned || 'Ej tilldelat'}
          </p>
        </div>
      </div>

      ${project.tel1 ? `
        <div style="margin-bottom: 12px;">
          <p style="margin: 0; font-size: 12px; color: #6b7280;">Telefon</p>
          <p style="margin: 2px 0 0 0; font-size: 14px; font-weight: 500;">
            📞 ${project.tel1}
          </p>
        </div>
      ` : ''}

      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button 
          onclick="window.location.href='/project-leader-zendesk?projectId=${project.id}'"
          style="
            flex: 1;
            padding: 8px 12px;
            background: #3b82f6;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          "
        >
          Hantera Projekt
        </button>
        <button 
          onclick="document.querySelector('.project-popup').remove()"
          style="
            padding: 8px 12px;
            background: #f3f4f6;
            color: #374151;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          "
        >
          Stäng
        </button>
      </div>
    `;

    // Add to document
    document.body.appendChild(popup);

    // Close popup when clicking outside
    const closePopup = (e: Event) => {
      if (!popup.contains(e.target as Node)) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    };
    
    // Add event listener after a brief delay to prevent immediate closure
    setTimeout(() => {
      document.addEventListener('click', closePopup);
    }, 100);

    // Show success toast
    toast({
      title: "Projektdetaljer",
      description: `Visar information för ${project.kundFirstName} ${project.kundLastName}`,
    });
  };

  // Function to show team edit popup
  const showTeamEditPopup = (project: any, anchorElement: HTMLElement) => {
    // Remove any existing popup
    const existingPopup = document.querySelector('.team-edit-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'team-edit-popup';
    popup.style.cssText = `
      position: absolute;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      box-shadow: 0 10px 24px -3px rgba(0, 0, 0, 0.2);
      padding: 16px;
      z-index: 1000;
      min-width: 250px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Position popup near the clicked element
    const rect = anchorElement.getBoundingClientRect();
    popup.style.left = `${rect.left + window.scrollX - 200}px`;
    popup.style.top = `${rect.top + window.scrollY - 50}px`;

    // Available teams
    const availableTeams = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];
    const teamNames = {
      'Team A': 'Labba & Andreas',
      'Team B': 'Mori & Jack',
      'Team C': 'Isaac & Anton', 
      'Team D': 'Elliot & Mille',
      'Team E': 'Liam & Hayle'
    };

    // Popup content
    popup.innerHTML = `
      <div style="margin-bottom: 12px;">
        <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600;">
          Redigera team för ${project.kundFirstName} ${project.kundLastName}
        </h4>
        <p style="margin: 0; font-size: 12px; color: #6b7280;">
          Nuvarande: ${project.teamAssigned || 'Ej tilldelat'}
        </p>
      </div>
      
      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">Team</label>
        <select id="teamSelect" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        ">
          <option value="">Välj team...</option>
          ${availableTeams.map(team => `
            <option value="${team}" ${project.teamAssigned === team ? 'selected' : ''}>
              ${teamNames[team]}
            </option>
          `).join('')}
        </select>
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">Startdatum</label>
        <input type="date" id="startDateInput" value="${project.planningStartDate || project.ganttStartDate || ''}" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        ">
      </div>

      <div style="margin-bottom: 12px;">
        <label style="display: block; margin-bottom: 4px; font-size: 12px; font-weight: 500;">Slutdatum</label>
        <input type="date" id="endDateInput" value="${project.planningEndDate || project.ganttEndDate || ''}" style="
          width: 100%;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
          font-size: 14px;
        ">
      </div>

      <div style="display: flex; gap: 8px;">
        <button 
          id="saveTeamBtn"
          style="
            flex: 1;
            padding: 8px 12px;
            background: #10b981;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          "
        >
          Spara
        </button>
        <button 
          id="removeTeamBtn"
          style="
            padding: 8px 12px;
            background: #ef4444;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          "
        >
          Ta bort team
        </button>
        <button 
          id="removeProjectBtn"
          style="
            padding: 8px 12px;
            background: #dc2626;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          "
        >
          Ta bort från Gantt
        </button>
        <button 
          id="cancelTeamBtn"
          style="
            padding: 8px 12px;
            background: #f3f4f6;
            color: #374151;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
          "
        >
          Avbryt
        </button>
      </div>
    `;

    // Add to document
    document.body.appendChild(popup);

    // Event handlers
    const saveBtn = popup.querySelector('#saveTeamBtn') as HTMLButtonElement;
    const removeBtn = popup.querySelector('#removeTeamBtn') as HTMLButtonElement;
    const cancelBtn = popup.querySelector('#cancelTeamBtn') as HTMLButtonElement;
    const teamSelect = popup.querySelector('#teamSelect') as HTMLSelectElement;

    saveBtn.addEventListener('click', async () => {
      const newTeam = teamSelect.value;
      const startDateInput = popup.querySelector('#startDateInput') as HTMLInputElement;
      const endDateInput = popup.querySelector('#endDateInput') as HTMLInputElement;
      
      const startDate = startDateInput?.value;
      const endDate = endDateInput?.value;
      
      if (!newTeam) {
        alert('Välj ett team först!');
        return;
      }

      if (!startDate || !endDate) {
        alert('Välj både start- och slutdatum!');
        return;
      }

      if (new Date(startDate) > new Date(endDate)) {
        alert('Startdatum måste vara före slutdatum!');
        return;
      }

      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            teamAssigned: newTeam,
            planningStartDate: startDate,
            planningEndDate: endDate,
            inGanttTimeline: true
          })
        });
        
        if (response.ok) {
          toast({
            title: "Projekt uppdaterat",
            description: `${teamNames[newTeam]} tilldelat till projektet`,
          });
          // Refresh the page to update the display
          window.location.reload();
        } else {
          throw new Error('Failed to update project');
        }
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte uppdatera projekt",
          variant: "destructive"
        });
      }
      popup.remove();
    });

    removeBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`/api/projects/${project.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamAssigned: null })
        });
        
        if (response.ok) {
          toast({
            title: "Team borttaget",
            description: "Team-tilldelning har tagits bort från projektet",
          });
          // Refresh the page to update the display
          window.location.reload();
        } else {
          throw new Error('Failed to remove team');
        }
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte ta bort team",
          variant: "destructive"
        });
      }
      popup.remove();
    });

    const removeProjectBtn = popup.querySelector('#removeProjectBtn') as HTMLButtonElement;
    removeProjectBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`/api/planning/remove-project/${project.id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          toast({
            title: "Projekt borttaget",
            description: "Projektet har tagits bort från Gantt-schemat",
          });
          // Refresh the page to update the display
          window.location.reload();
        } else {
          throw new Error('Failed to remove project from Gantt');
        }
      } catch (error) {
        toast({
          title: "Fel",
          description: "Kunde inte ta bort projekt från Gantt",
          variant: "destructive"
        });
      }
      popup.remove();
    });

    cancelBtn.addEventListener('click', () => {
      popup.remove();
    });

    // Close popup when clicking outside
    const closePopup = (e: Event) => {
      if (!popup.contains(e.target as Node)) {
        popup.remove();
        document.removeEventListener('click', closePopup);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closePopup);
    }, 100);
  };

  // Get unique teams for filtering
  const availableTeams = [...new Set(projects?.map((p: any) => p.teamAssigned).filter(Boolean))] || [];
  
  // Team mapping for display
  const teamDisplayNames: Record<string, string> = {
    'all': 'Alla Team',
    'Team A': 'Labba & Andreas',
    'Team B': 'Mori & Jack', 
    'Team C': 'Isaac & Anton',
    'Team D': 'Elliot & Mille',
    'Team E': 'Liam & Hayle',
  };

  const createGanttChart = (container: HTMLElement, tasks: GanttTask[]) => {
    // Clear existing content
    container.innerHTML = '';

    // Create the gantt container with responsive design
    const ganttContainer = document.createElement('div');
    ganttContainer.className = 'frappe-gantt-container';
    const dynamicHeight = Math.max(200, tasks.length * 55 + 160); // 55px per task + header + controls
    ganttContainer.style.cssText = `
      width: 100%;
      height: ${dynamicHeight}px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      overflow-x: auto;
      overflow-y: hidden;
    `;

    // Calculate date range based on tasks
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Generate date range (current month plus next month)
    const dateRange = [];
    for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
      dateRange.push(new Date(d));
    }

    // Create header
    const header = document.createElement('div');
    header.className = 'gantt-header';
    header.style.cssText = `
      height: 80px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      padding: 0 20px;
      position: sticky;
      top: 0;
      z-index: 10;
    `;

    // Create month header
    const monthHeader = document.createElement('div');
    monthHeader.textContent = `${today.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })}`;
    monthHeader.style.cssText = `
      font-size: 14px;
      font-weight: 600;
      color: #374151;
      margin-right: 20px;
      min-width: 120px;
    `;

    // Create date grid
    const dateGrid = document.createElement('div');
    dateGrid.style.cssText = `
      display: flex;
      flex: 1;
    `;

    // Generate date headers for the current month with weather icons
    dateRange.forEach((date, index) => {
      const dayHeader = document.createElement('div');
      const isToday = date.toDateString() === today.toDateString();
      
      // Get weather for this date
      let weatherIcon = '☀️'; // Default sunny icon
      if (weatherData?.daily?.time) {
        const dateStr = date.toISOString().split('T')[0];
        const weatherIndex = weatherData.daily.time.indexOf(dateStr);
        if (weatherIndex !== -1 && weatherData.daily.weathercode) {
          weatherIcon = getWeatherIcon(weatherData.daily.weathercode[weatherIndex]);
        }
      }
      
      // Create header with day number and weather icon
      dayHeader.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
          <div style="font-size: 12px; font-weight: 500;">${date.getDate()}</div>
          <div style="font-size: 14px;">${weatherIcon}</div>
        </div>
      `;
      
      dayHeader.style.cssText = `
        width: 40px;
        height: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        border-right: 1px solid #f3f4f6;
        ${isToday ? 'background: #374151; color: white; border-radius: 4px; margin: 2px;' : ''}
      `;
      
      dateGrid.appendChild(dayHeader);
    });

    header.appendChild(monthHeader);
    header.appendChild(dateGrid);
    ganttContainer.appendChild(header);

    // Create tasks area with better spacing
    const tasksArea = document.createElement('div');
    tasksArea.className = 'gantt-tasks';
    tasksArea.style.cssText = `
      position: relative;
      padding: 20px;
      min-height: ${tasks.length * 55}px;
    `;

    // Create grid lines
    const gridLines = document.createElement('div');
    gridLines.style.cssText = `
      position: absolute;
      top: 0;
      left: 140px;
      width: calc(100% - 140px);
      height: 100%;
      pointer-events: none;
    `;

    // Draw vertical grid lines for current month days
    for (let i = 0; i <= endOfMonth.getDate(); i++) {
      const line = document.createElement('div');
      const today = new Date();
      const isToday = i === today.getDate();
      line.style.cssText = `
        position: absolute;
        left: ${i * 40}px;
        top: 0;
        width: 1px;
        height: 100%;
        background: #f3f4f6;
        ${isToday ? 'background: #374151; width: 2px;' : ''}
      `;
      gridLines.appendChild(line);
    }

    tasksArea.appendChild(gridLines);

    // Create tasks
    tasks.forEach((task, index) => {
      const taskRow = document.createElement('div');
      taskRow.style.cssText = `
        display: flex;
        align-items: center;
        margin-bottom: 15px;
        position: relative;
        height: 40px;
      `;

      // Task label - show team with edit button
      const taskLabel = document.createElement('div');
      const projectId = task.id.replace('project-', '');
      const project = projects?.find((p: any) => p.id === parseInt(projectId));
      const teamName = project?.teamAssigned || 'Ej tilldelat';
      
      taskLabel.style.cssText = `
        width: 140px;
        font-size: 12px;
        color: #374151;
        padding-right: 10px;
        text-align: right;
        font-weight: 500;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 5px;
      `;

      // Team name span with proper display name
      const teamSpan = document.createElement('span');
      const displayTeamName = teamDisplayNames[teamName] || teamName || 'Inget team';
      teamSpan.textContent = displayTeamName;
      teamSpan.style.cssText = `
        flex: 1;
        text-align: right;
      `;

      // Edit team button
      const editBtn = document.createElement('button');
      editBtn.innerHTML = '✏️';
      editBtn.style.cssText = `
        width: 20px;
        height: 20px;
        border: none;
        background: #f3f4f6;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0.7;
        transition: opacity 0.2s;
      `;

      editBtn.addEventListener('mouseenter', () => {
        editBtn.style.opacity = '1';
        editBtn.style.background = '#e5e7eb';
      });

      editBtn.addEventListener('mouseleave', () => {
        editBtn.style.opacity = '0.7';
        editBtn.style.background = '#f3f4f6';
      });

      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showTeamEditPopup(project, editBtn);
      });

      taskLabel.appendChild(teamSpan);
      taskLabel.appendChild(editBtn);

      // Task bar container
      const taskBarContainer = document.createElement('div');
      taskBarContainer.style.cssText = `
        flex: 1;
        position: relative;
        height: 25px;
        margin-left: 20px;
      `;

      // Calculate task position and width based on dates
      const taskStartDate = new Date(task.start);
      const taskEndDate = new Date(task.end);
      
      // Calculate days from start of month to properly position tasks
      const startOfMonth = new Date(taskStartDate.getFullYear(), taskStartDate.getMonth(), 1);
      const daysDiff = Math.floor((taskStartDate - startOfMonth) / (1000 * 60 * 60 * 24));
      const duration = Math.max(Math.floor((taskEndDate - taskStartDate) / (1000 * 60 * 60 * 24)) + 1, 1);
      
      // Use proper day width for better readability
      const dayWidth = 40; // Restore normal day width
      const taskStart = daysDiff * dayWidth;
      const taskWidth = Math.max(duration * dayWidth, dayWidth); // Minimum width of one day

      // Task bar
      const taskBar = document.createElement('div');
      taskBar.style.cssText = `
        position: absolute;
        left: ${taskStart}px;
        width: ${taskWidth}px;
        height: 20px;
        background: ${task.custom_class === 'completed' ? '#10b981' : 
                     task.custom_class === 'in-progress' ? '#3b82f6' : '#9ca3af'};
        border-radius: 4px;
        cursor: pointer;
        transition: opacity 0.2s;
        display: flex;
        align-items: center;
        padding: 0 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      `;

      // Task progress
      if (task.progress > 0) {
        const progressBar = document.createElement('div');
        progressBar.style.cssText = `
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: ${task.progress}%;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
        `;
        taskBar.appendChild(progressBar);
      }

      // Task label on bar
      const taskBarLabel = document.createElement('span');
      taskBarLabel.textContent = task.name;
      taskBarLabel.style.cssText = `
        font-size: 11px;
        color: white;
        font-weight: 500;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        z-index: 1;
      `;
      taskBar.appendChild(taskBarLabel);

      // Add hover effect
      taskBar.addEventListener('mouseenter', () => {
        taskBar.style.opacity = '0.8';
      });
      taskBar.addEventListener('mouseleave', () => {
        taskBar.style.opacity = '1';
      });

      // Add click handler for project details
      taskBar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Task clicked:', task.id);
        
        const projectId = task.id.replace('project-', '');
        const project = projects?.find((p: any) => p.id === parseInt(projectId));
        console.log('Found project:', project);
        
        if (project) {
          // Create and show team edit popup for date/team editing
          showTeamEditPopup(project, taskBar);
        } else {
          toast({
            title: "Projekt ej hittad",
            description: "Kunde inte hitta projektdata",
            variant: "destructive"
          });
        }
      });

      taskBarContainer.appendChild(taskBar);

      // Add dependency arrow if exists
      if (task.dependencies && index > 0) {
        const arrow = document.createElement('div');
        arrow.style.cssText = `
          position: absolute;
          left: ${taskStart - 20}px;
          top: 10px;
          width: 15px;
          height: 1px;
          background: #6b7280;
          z-index: 2;
        `;
        
        const arrowHead = document.createElement('div');
        arrowHead.style.cssText = `
          position: absolute;
          right: -5px;
          top: -3px;
          width: 0;
          height: 0;
          border-left: 5px solid #6b7280;
          border-top: 3px solid transparent;
          border-bottom: 3px solid transparent;
        `;
        arrow.appendChild(arrowHead);
        taskBarContainer.appendChild(arrow);
      }

      taskRow.appendChild(taskLabel);
      taskRow.appendChild(taskBarContainer);
      tasksArea.appendChild(taskRow);
    });

    ganttContainer.appendChild(tasksArea);

    // Add controls at the bottom
    const controls = document.createElement('div');
    controls.style.cssText = `
      padding: 15px 20px;
      background: #f9fafb;
      border-top: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 12px;
    `;

    const holidayLabel = document.createElement('label');
    holidayLabel.innerHTML = 'Mark a holiday: <input type="date" style="margin-left: 5px; padding: 2px 5px; border: 1px solid #d1d5db; border-radius: 4px;">';
    
    const ignoreLabel = document.createElement('label');
    ignoreLabel.innerHTML = 'Ignore a Day: <input type="date" style="margin-left: 5px; padding: 2px 5px; border: 1px solid #d1d5db; border-radius: 4px;">';

    const weekendToggle = document.createElement('label');
    weekendToggle.innerHTML = 'Mark weekends: <input type="checkbox" style="margin-left: 5px;">';

    const excludeToggle = document.createElement('label');
    excludeToggle.innerHTML = 'Exclude weekends: <input type="checkbox" checked style="margin-left: 5px;">';

    controls.appendChild(holidayLabel);
    controls.appendChild(ignoreLabel);
    controls.appendChild(weekendToggle);
    controls.appendChild(excludeToggle);

    ganttContainer.appendChild(controls);
    container.appendChild(ganttContainer);
  };

  useEffect(() => {
    if (ganttRef.current) {
      if (ganttTasks.length > 0) {
        createGanttChart(ganttRef.current, ganttTasks);
      } else {
        // Show empty state
        ganttRef.current.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 300px; color: #6b7280;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">📊</div>
              <h3 style="font-size: 18px; margin-bottom: 8px;">Inga projekt att visa</h3>
              <p style="font-size: 14px;">Skapa eller tilldela projekt för att se dem i Gantt-schemat</p>
            </div>
          </div>
        `;
      }
    }
  }, [viewMode, ganttTasks, weatherData]);

  return (
    <div>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/project-leader" className="text-gray-500 hover:text-gray-700">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold">Projektplanering</h1>
          </div>
          <p className="text-gray-600 mt-1">Interaktiv Gantt-schema för projekthantering</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Scroll to today functionality
              toast({
                title: "Scroll to Today",
                description: "Navigating to current date",
              });
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Idag
          </Button>
          
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Vy" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Day">Dag</SelectItem>
              <SelectItem value="Week">Vecka</SelectItem>
              <SelectItem value="Month">Månad</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setShowAddProjectModal(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nytt Projekt
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Totalt Projekt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projects?.length || 0}</div>
            <p className="text-xs text-gray-500">Aktiva projekt</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pågående</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {projects?.filter((p: any) => p.overallStatus === 'in_progress').length || 0}
            </div>
            <p className="text-xs text-gray-500">I progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Klara</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {projects?.filter((p: any) => p.overallStatus === 'completed').length || 0}
            </div>
            <p className="text-xs text-gray-500">Avslutade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Väntande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {projects?.filter((p: any) => p.overallStatus === 'pending' || !p.overallStatus).length || 0}
            </div>
            <p className="text-xs text-gray-500">Ej startade</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Project Modal */}
      <Dialog open={showAddProjectModal} onOpenChange={setShowAddProjectModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lägg till projekt i Gantt-schema</DialogTitle>
            <DialogDescription>
              Välj projekt att lägga till i tidsplaneringen. Du kan välja team och datum.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {allProjects?.map((project: any) => (
              <ProjectSelectionCard 
                key={project.id}
                project={project}
                onAdd={addToGanttMutation.mutate}
                isAdding={addToGanttMutation.isPending}
              />
            ))}
            
            {(!allProjects || allProjects.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">📋</div>
                <h3 className="text-lg font-medium mb-2">Inga tillgängliga projekt</h3>
                <p>Alla projekt är redan tillagda i Gantt-schemat</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Gantt Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Projektschema</CardTitle>
          <CardDescription>
            Interaktiv tidsplan som visar alla projekt och deras faser
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Laddar projektdata...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div ref={ganttRef} className="w-full min-w-[800px]"></div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Teamfilter</CardTitle>
          <CardDescription>Filtrera projekt per snickare-team</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant={selectedTeam === 'all' ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedTeam('all')}
            >
              <Users className="h-3 w-3 mr-1" />
              Alla Team
            </Badge>
            {/* Available teams from database */}
            {availableTeams.map((team) => (
              <Badge 
                key={team} 
                variant={selectedTeam === team ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedTeam(team)}
              >
                <Users className="h-3 w-3 mr-1" />
                {teamDisplayNames[team] || team}
              </Badge>
            ))}
            {/* Predefined teams that can be assigned */}
            {Object.entries(teamDisplayNames).filter(([key]) => key !== 'all' && !availableTeams.includes(key)).map(([teamKey, teamName]) => (
              <Badge 
                key={teamKey}
                variant="secondary"
                className="opacity-50"
              >
                <Users className="h-3 w-3 mr-1" />
                {teamName} (Inga projekt)
              </Badge>
            ))}
          </div>
          <div className="mt-3 text-sm text-gray-600">
            <strong>Tillgängliga team:</strong> Labba & Andreas, Mori & Jack, Isaac & Anton, Elliot & Mille, Liam & Hayle
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

// Component for selecting projects to add to Gantt
const ProjectSelectionCard = ({ project, onAdd, isAdding }: {
  project: any;
  onAdd: (data: { projectId: number; startDate: string; endDate: string; teamAssigned?: string }) => void;
  isAdding: boolean;
}) => {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const future = new Date();
    future.setDate(future.getDate() + 7);
    return future.toISOString().split('T')[0];
  });
  const [selectedTeam, setSelectedTeam] = useState<string>('');

  const availableTeams = ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'];
  const teamNames = {
    'Team A': 'Labba & Andreas',
    'Team B': 'Mori & Jack',
    'Team C': 'Isaac & Anton', 
    'Team D': 'Elliot & Mille',
    'Team E': 'Liam & Hayle'
  };

  const handleAdd = () => {
    if (!startDate || !endDate) {
      return;
    }
    
    onAdd({
      projectId: project.id,
      startDate,
      endDate,
      teamAssigned: selectedTeam || undefined
    });
  };

  return (
    <Card className="p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold">
            {project.kundFirstName} {project.kundLastName}
          </h3>
          <p className="text-gray-600 text-sm">{project.address}</p>
          <div className="flex gap-4 mt-2 text-sm text-gray-500">
            <span>📞 {project.tel1}</span>
            <span>🏠 {project.typAvTak}</span>
            <span>📋 {project.projektCode}</span>
          </div>
        </div>
        
        <Badge variant={project.overallStatus === 'completed' ? 'default' : 'secondary'}>
          {project.overallStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <Label htmlFor={`start-${project.id}`}>Startdatum</Label>
          <Input
            id={`start-${project.id}`}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor={`end-${project.id}`}>Slutdatum</Label>
          <Input
            id={`end-${project.id}`}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        
        <div>
          <Label htmlFor={`team-${project.id}`}>Team (valfritt)</Label>
          <Select value={selectedTeam} onValueChange={setSelectedTeam}>
            <SelectTrigger>
              <SelectValue placeholder="Välj team..." />
            </SelectTrigger>
            <SelectContent>
              {availableTeams.map(team => (
                <SelectItem key={team} value={team}>
                  {teamNames[team]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleAdd}
          disabled={isAdding || !startDate || !endDate}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isAdding ? 'Lägger till...' : 'Lägg till i Gantt'}
        </Button>
      </div>
    </Card>
  );
};

export default PlanningGantt;