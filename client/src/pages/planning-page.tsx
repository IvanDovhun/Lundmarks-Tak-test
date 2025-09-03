import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Users, Clock, Settings } from "lucide-react";
import FrappeGantt from "../lib/frappe-gantt-bundle.js";
import "../lib/gantt-css.css";

interface GanttTask {
  id: string;
  name: string;
  start: string;
  end: string;
  progress: number;
  dependencies?: string;
  custom_class?: string;
}

interface ProjectData {
  id: number;
  customerName: string;
  teamAssigned: string;
  address: string;
  phases: {
    bortforsling: { status: string; date?: string };
    byggställning: { status: string; date?: string };
    material1: { status: string; date?: string };
    material2: { status: string; date?: string };
  };
}

export default function PlanningPage() {
  const [viewMode, setViewMode] = useState<'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'>('Week');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstance = useRef<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch project data
  const { data: projects, isLoading } = useQuery({
    queryKey: ['/api/project-leader/tickets'],
    retry: false,
  });

  // Teams data
  const teams = [
    { id: 'all', name: 'Alla team' },
    { id: 'labbis-andreas', name: 'Labbis & Andreas' },
    { id: 'berra', name: 'Berra' },
    { id: 'mori-jack', name: 'Mori & Jack' },
    { id: 'isaac-anton', name: 'Isaac & Anton' },
    { id: 'elliot-mille', name: 'Elliot & Mille' },
    { id: 'liam-hayle', name: 'Liam & Hayle' },
  ];

  // Convert project data to Gantt tasks
  const convertToGanttTasks = (projectData: any[]): GanttTask[] => {
    if (!projectData) return [];

    const tasks: GanttTask[] = [];
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    projectData.forEach((project, index) => {
      const teamId = project.teamAssigned?.toLowerCase().replace(/[^a-z]/g, '-') || 'unassigned';
      
      // Filter by selected team
      if (selectedTeam !== 'all' && teamId !== selectedTeam) {
        return;
      }

      const baseDate = new Date(today.getTime() + index * 2 * 24 * 60 * 60 * 1000);
      const projectStartDate = baseDate.toISOString().split('T')[0];
      
      // Phase 1: Bortforsling
      const bortforslingStart = new Date(baseDate);
      const bortforslingEnd = new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000);
      tasks.push({
        id: `${project.id}-bortforsling`,
        name: `${project.adress || project.address || project.customerName} - Bortforsling`,
        start: bortforslingStart.toISOString().split('T')[0],
        end: bortforslingEnd.toISOString().split('T')[0],
        progress: project.bortforslingStatus === 'completed' ? 100 : 
                 project.bortforslingStatus === 'scheduled' ? 50 : 0,
        custom_class: getStatusClass(project.bortforslingStatus),
      });

      // Phase 2: Byggställning
      const byggställningStart = new Date(bortforslingEnd.getTime() + 1 * 24 * 60 * 60 * 1000);
      const byggställningEnd = new Date(byggställningStart.getTime() + 3 * 24 * 60 * 60 * 1000);
      tasks.push({
        id: `${project.id}-byggställning`,
        name: `${project.adress || project.address || project.customerName} - Byggställning`,
        start: byggställningStart.toISOString().split('T')[0],
        end: byggställningEnd.toISOString().split('T')[0],
        progress: project.byggställningStatus === 'completed' ? 100 : 
                 project.byggställningStatus === 'scheduled' ? 50 : 0,
        dependencies: `${project.id}-bortforsling`,
        custom_class: getStatusClass(project.byggställningStatus),
      });

      // Phase 3: Material 1
      const material1Start = new Date(byggställningStart.getTime() + 1 * 24 * 60 * 60 * 1000);
      const material1End = new Date(material1Start.getTime() + 1 * 24 * 60 * 60 * 1000);
      tasks.push({
        id: `${project.id}-material1`,
        name: `${project.adress || project.address || project.customerName} - Material 1`,
        start: material1Start.toISOString().split('T')[0],
        end: material1End.toISOString().split('T')[0],
        progress: project.materialStatus === 'delivered' ? 100 : 
                 project.materialStatus === 'ordered' ? 50 : 0,
        custom_class: getStatusClass(project.materialStatus),
      });

      // Phase 4: Material 2 (if exists)
      if (project.materialLeverans2Status && project.materialLeverans2Status !== 'pending') {
        const material2Start = new Date(material1End.getTime() + 7 * 24 * 60 * 60 * 1000);
        const material2End = new Date(material2Start.getTime() + 1 * 24 * 60 * 60 * 1000);
        tasks.push({
          id: `${project.id}-material2`,
          name: `${project.adress || project.address || project.customerName} - Material 2`,
          start: material2Start.toISOString().split('T')[0],
          end: material2End.toISOString().split('T')[0],
          progress: project.materialLeverans2Status === 'delivered' ? 100 : 
                   project.materialLeverans2Status === 'ordered' ? 50 : 0,
          dependencies: `${project.id}-material1`,
          custom_class: getStatusClass(project.materialLeverans2Status),
        });
      }
    });

    return tasks;
  };

  const getStatusClass = (status: string): string => {
    switch (status) {
      case 'completed':
      case 'delivered':
        return 'bar-completed';
      case 'scheduled':
      case 'ordered':
        return 'bar-scheduled';
      default:
        return 'bar-pending';
    }
  };

  // Initialize Frappe Gantt
  useEffect(() => {
    if (!ganttRef.current || !projects) return;

    const tasks = convertToGanttTasks(projects);
    
    if (tasks.length === 0) {
      ganttRef.current.innerHTML = '<div class="text-center py-8 text-gray-500">Inga projekt att visa</div>';
      return;
    }

    // Destroy existing instance
    if (ganttInstance.current) {
      ganttInstance.current = null;
    }

    // Clear the container
    ganttRef.current.innerHTML = '';

    try {
      console.log('Initializing Frappe Gantt with tasks:', tasks);
      
      ganttInstance.current = new FrappeGantt(ganttRef.current, tasks, {
        view_mode: viewMode.replace(' ', '_').toLowerCase(),
        date_format: 'YYYY-MM-DD',
        column_width: viewMode === 'Week' ? 30 : viewMode === 'Month' ? 10 : 50,
        bar_height: 20,
        bar_corner_radius: 3,
        padding: 18,
        on_click: function(task) {
          console.log('Task clicked:', task);
          toast({
            title: "Uppgift klickad",
            description: task.name,
          });
        },
        on_date_change: function(task, start, end) {
          console.log('Date changed:', task, start, end);
          toast({
            title: "Datum ändrat",
            description: `${task.name}: ${start.toLocaleDateString('sv-SE')} - ${end.toLocaleDateString('sv-SE')}`,
          });
        },
      });
      
      console.log('Frappe Gantt initialized successfully');
    } catch (error) {
      console.error('Error initializing Frappe Gantt:', error);
      ganttRef.current.innerHTML = `<div class="text-center py-8 text-red-500">Fel vid laddning av schema: ${error.message || 'Okänt fel'}</div>`;
    }
  }, [projects, viewMode, selectedTeam]);



  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            <p>Laddar projektschema...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="w-8 h-8" />
            Planering
          </h1>
          <p className="text-gray-600 mt-1">Projektschema och teamplanering</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => {
              // Scroll to today in Frappe Gantt
              const todayElement = ganttRef.current?.querySelector('.today');
              if (todayElement && ganttRef.current) {
                const container = ganttRef.current.querySelector('.gantt-container');
                if (container) {
                  const todayX = parseInt(todayElement.getAttribute('x1') || '0');
                  container.scrollLeft = Math.max(0, todayX - container.clientWidth / 2);
                }
              }
            }}
          >
            Idag
          </Button>
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
          >
            Uppdatera
          </Button>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Inställningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Vy:</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Quarter Day">Kvartsdag</SelectItem>
                  <SelectItem value="Half Day">Halvdag</SelectItem>
                  <SelectItem value="Day">Dag</SelectItem>
                  <SelectItem value="Week">Vecka</SelectItem>
                  <SelectItem value="Month">Månad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Team:</label>
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-4 ml-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-300 rounded"></div>
                <span className="text-sm">Väntande</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-400 rounded"></div>
                <span className="text-sm">Schemalagt</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm">Klart</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gantt Chart */}
      <Card className="min-h-96">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Projektschema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            ref={ganttRef} 
            className="gantt-container"
            style={{ minHeight: '400px' }}
          />
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {projects?.length || 0}
              </div>
              <div className="text-sm text-gray-600">Totala projekt</div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {projects?.filter((p: any) => 
                  p.bortforslingStatus === 'completed' && 
                  p.byggställningStatus === 'completed' && 
                  p.materialStatus === 'delivered'
                ).length || 0}
              </div>
              <div className="text-sm text-gray-600">Färdiga projekt</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {projects?.filter((p: any) => 
                  p.bortforslingStatus === 'scheduled' || 
                  p.byggställningStatus === 'scheduled' || 
                  p.materialStatus === 'ordered'
                ).length || 0}
              </div>
              <div className="text-sm text-gray-600">Schemalagda</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {projects?.filter((p: any) => 
                  p.bortforslingStatus === 'pending' && 
                  p.byggställningStatus === 'pending' && 
                  p.materialStatus === 'pending'
                ).length || 0}
              </div>
              <div className="text-sm text-gray-600">Väntande</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Gantt Styles */}
      <style>{`
        .gantt-container .bar-completed {
          fill: #10b981 !important;
        }
        .gantt-container .bar-scheduled {
          fill: #3b82f6 !important;
        }
        .gantt-container .bar-pending {
          fill: #9ca3af !important;
        }
        .gantt-container .details-container {
          padding: 10px;
          background: white;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        .gantt-container .details-container h5 {
          margin: 0 0 8px 0;
          font-weight: bold;
          color: #1f2937;
        }
        .gantt-container .details-container p {
          margin: 4px 0;
          font-size: 14px;
          color: #6b7280;
        }
        .gantt-container .gantt .grid-row {
          fill: transparent;
          stroke: #e5e7eb;
          stroke-width: 1;
        }
        .gantt-container .gantt .grid-header {
          fill: #f9fafb;
          stroke: #e5e7eb;
          stroke-width: 1;
        }
        .gantt-container .gantt .today-highlight {
          fill: #dbeafe;
          opacity: 0.3;
        }
        .gantt-container .gantt .bar {
          stroke-width: 0;
          transition: opacity 0.2s;
          opacity: 0.8;
        }
        .gantt-container .gantt .bar:hover {
          opacity: 1;
        }
        .gantt-container .gantt .bar-progress {
          fill: #000;
          opacity: 0.1;
        }
        .gantt-container .gantt .bar-label {
          fill: #374151;
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}