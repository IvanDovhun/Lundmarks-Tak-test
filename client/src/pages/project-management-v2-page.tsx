import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Project, ProjectWithTeam } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/ui/navbar";
import { 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Calendar,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Circle,
  Building2,
  Package
} from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

export default function ProjectManagementV2Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterTeam, setFilterTeam] = useState("all");
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [editingCell, setEditingCell] = useState<{projectId: number, field: string} | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch projects
  const { data: projects, isLoading } = useQuery<ProjectWithTeam[]>({
    queryKey: ["/api/projects"],
  });

  // Filter and search projects
  const filteredProjects = useMemo(() => {
    if (!projects) return [];
    
    return projects.filter(project => {
      const matchesSearch = !searchTerm || 
        project.kundFirstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.kundLastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.projektCode?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === "all" || project.overallStatus === filterStatus;
      const matchesTeam = filterTeam === "all" || project.teamName === filterTeam;
      
      return matchesSearch && matchesStatus && matchesTeam;
    });
  }, [projects, searchTerm, filterStatus, filterTeam]);

  // Get unique teams for filter
  const teams = useMemo(() => {
    if (!projects) return [];
    const uniqueTeams = [...new Set(projects.map(p => p.teamName).filter(Boolean))];
    return uniqueTeams;
  }, [projects]);

  // Update project phase mutation
  const updatePhaseMutation = useMutation({
    mutationFn: async ({ projectId, phase, status }: { 
      projectId: number; 
      phase: 'stallning' | 'borttagning' | 'material' | 'faktura1'; 
      status: 'pending' | 'grädad' | 'completed';
    }) => {
      return apiRequest(`/api/projects/${projectId}/phases/${phase}`, {
        method: "PATCH",
        body: JSON.stringify({ 
          status, 
          completedDate: status === 'completed' ? new Date().toISOString() : null 
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Framgång",
        description: "Projektfas uppdaterad",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera projektfas",
        variant: "destructive",
      });
    },
  });

  // Update project field mutation
  const updateFieldMutation = useMutation({
    mutationFn: async ({ projectId, field, value }: { 
      projectId: number; 
      field: string; 
      value: string | number | Date | null;
    }) => {
      return apiRequest(`/api/projects/${projectId}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setEditingCell(null);
      toast({
        title: "Framgång",
        description: "Projekt uppdaterat",
      });
    },
    onError: (error) => {
      toast({
        title: "Fel",
        description: error instanceof Error ? error.message : "Kunde inte uppdatera projekt",
        variant: "destructive",
      });
    },
  });

  const getPhaseIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'grädad': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      case 'pending': return <Circle className="w-4 h-4 text-gray-400" />;
      default: return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'grädad': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    try {
      const d = typeof date === 'string' ? new Date(date) : date;
      return format(d, "yyyy-MM-dd", { locale: sv });
    } catch {
      return "-";
    }
  };

  const handlePhaseClick = async (projectId: number, phase: 'stallning' | 'borttagning' | 'material' | 'faktura1', currentStatus: string) => {
    let newStatus: 'pending' | 'grädad' | 'completed';
    
    switch (currentStatus) {
      case 'pending': newStatus = 'grädad'; break;
      case 'grädad': newStatus = 'completed'; break;
      case 'completed': newStatus = 'pending'; break;
      default: newStatus = 'grädad';
    }
    
    try {
      await updatePhaseMutation.mutateAsync({ projectId, phase, status: newStatus });
    } catch (error) {
      // Error handling is already managed by the mutation's onError callback
      console.error('Failed to update phase:', error);
    }
  };

  // Handle row click for highlighting
  const handleRowClick = (projectId: number) => {
    setSelectedRowId(selectedRowId === projectId ? null : projectId);
  };

  // Handle inline editing
  const handleCellEdit = (projectId: number, field: string, currentValue: any) => {
    setEditingCell({ projectId, field });
    setEditValue(currentValue?.toString() || "");
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;
    
    try {
      let processedValue: string | number | Date | null = editValue;
      
      // Process value based on field type
      if (editingCell.field === 'platskassa') {
        processedValue = parseFloat(editValue.replace(/[^\d.-]/g, '')) || 0;
      } else if (editingCell.field.includes('Date')) {
        if (editValue && editValue.trim() !== '') {
          processedValue = new Date(editValue);
        } else {
          processedValue = null;
        }
      }
      
      await updateFieldMutation.mutateAsync({
        projectId: editingCell.projectId,
        field: editingCell.field,
        value: processedValue
      });
    } catch (error) {
      // Error handling is already managed by the mutation's onError callback
      console.error('Failed to save edit:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-8 h-8 text-blue-600" />
            <span>📊 Projekthantering V2</span>
          </h1>
          <p className="text-muted-foreground mt-1">
            Excel-liknande översikt av alla projekt i systemet
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white border-gray-200">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2 min-w-[300px]">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Sök projekt, kund, adress eller kod..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border-gray-300"
              />
            </div>
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] border-gray-300">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla status</SelectItem>
                <SelectItem value="active">Aktiva</SelectItem>
                <SelectItem value="completed">Avslutade</SelectItem>
                <SelectItem value="on_hold">Pausade</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTeam} onValueChange={setFilterTeam}>
              <SelectTrigger className="w-[150px] border-gray-300">
                <SelectValue placeholder="Team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alla team</SelectItem>
                {teams.map(team => (
                  <SelectItem key={team} value={team || ""}>{team}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>{filteredProjects.length} av {projects?.length || 0} projekt</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projects Table */}
      <Card className="bg-white border-gray-200">
        <CardHeader className="bg-gray-50 border-b border-gray-200">
          <CardTitle className="flex items-center space-x-2 text-gray-800">
            <Building2 className="w-5 h-5" />
            <span>Projektöversikt</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 border-b border-gray-300">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Projekt
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[140px]">
                    Kund
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[180px]">
                    Adress
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[80px]">
                    Team
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Ställning
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Borttagning
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Material
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Platskassa
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                    Mat. Lev 1
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                    Mat. Lev 2
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[120px]">
                    Slutbesiktning
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider min-w-[100px]">
                    Faktura 1
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProjects.map((project) => (
                  <tr 
                    key={project.id} 
                    onClick={() => handleRowClick(project.id)}
                    className={`cursor-pointer transition-colors duration-150 border-b border-gray-100 ${
                      selectedRowId === project.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Projekt */}
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-900 text-sm">
                        {project.projektCode || `P${project.id}`}
                      </div>
                    </td>

                    {/* Kund */}
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">
                        {project.kundFirstName} {project.kundLastName}
                      </div>
                    </td>

                    {/* Adress */}
                    <td className="px-3 py-2">
                      <div className="text-sm text-gray-900">{project.address}</div>
                    </td>

                    {/* Team */}
                    <td className="px-3 py-2">
                      {project.teamName ? (
                        <span className="text-xs font-medium text-gray-700">
                          {project.teamName}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>

                    {/* Ställning */}
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhaseClick(project.id, 'stallning', project.stallningStatus || 'pending');
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${getPhaseColor(project.stallningStatus || 'pending')} hover:opacity-80`}
                        disabled={updatePhaseMutation.isPending}
                      >
                        {project.stallningStatus === 'completed' ? 'Klar' : project.stallningStatus === 'grädad' ? 'Pågår' : 'Väntar'}
                      </button>
                    </td>

                    {/* Borttagning */}
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhaseClick(project.id, 'borttagning', project.borttagningStatus || 'pending');
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${getPhaseColor(project.borttagningStatus || 'pending')} hover:opacity-80`}
                        disabled={updatePhaseMutation.isPending}
                      >
                        {project.borttagningStatus === 'completed' ? 'Klar' : project.borttagningStatus === 'grädad' ? 'Pågår' : 'Väntar'}
                      </button>
                    </td>

                    {/* Material */}
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhaseClick(project.id, 'material', project.materialStatus || 'pending');
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${getPhaseColor(project.materialStatus || 'pending')} hover:opacity-80`}
                        disabled={updatePhaseMutation.isPending}
                      >
                        {project.materialStatus === 'completed' ? 'Klar' : project.materialStatus === 'grädad' ? 'Pågår' : 'Väntar'}
                      </button>
                    </td>

                    {/* Platskassa */}
                    <td className="px-3 py-2">
                      {editingCell?.projectId === project.id && editingCell?.field === 'platskassa' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-20 h-6 text-xs"
                            autoFocus
                          />
                          <Button onClick={handleSaveEdit} size="sm" className="h-6 px-2 text-xs">✓</Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="outline" className="h-6 px-2 text-xs">✗</Button>
                        </div>
                      ) : (
                        <div 
                          className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellEdit(project.id, 'platskassa', project.platskassa);
                          }}
                        >
                          {project.platskassa ? `${project.platskassa.toLocaleString('sv-SE')} kr` : '-'}
                        </div>
                      )}
                    </td>

                    {/* Material Leverans 1 */}
                    <td className="px-3 py-2">
                      {editingCell?.projectId === project.id && editingCell?.field === 'materialLeverans1Date' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-32 h-7 text-xs [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            autoFocus
                          />
                          <Button onClick={handleSaveEdit} size="sm" className="h-7 px-1 text-xs">✓</Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="outline" className="h-7 px-1 text-xs">✗</Button>
                        </div>
                      ) : (
                        <div 
                          className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            const dateValue = project.materialLeverans1Date ? 
                              (typeof project.materialLeverans1Date === 'string' ? project.materialLeverans1Date.split('T')[0] : 
                               new Date(project.materialLeverans1Date).toISOString().split('T')[0]) : '';
                            handleCellEdit(project.id, 'materialLeverans1Date', dateValue);
                          }}
                        >
                          {formatDate(project.materialLeverans1Date)}
                        </div>
                      )}
                    </td>

                    {/* Material Leverans 2 */}
                    <td className="px-3 py-2">
                      {editingCell?.projectId === project.id && editingCell?.field === 'materialLeverans2Date' ? (
                        <div className="flex items-center space-x-1">
                          <Input
                            type="date"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-32 h-7 text-xs [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                            autoFocus
                          />
                          <Button onClick={handleSaveEdit} size="sm" className="h-7 px-1 text-xs">✓</Button>
                          <Button onClick={handleCancelEdit} size="sm" variant="outline" className="h-7 px-1 text-xs">✗</Button>
                        </div>
                      ) : (
                        <div 
                          className="text-xs text-gray-600 cursor-pointer hover:bg-gray-100 px-1 py-1 rounded"
                          onClick={(e) => {
                            e.stopPropagation();
                            const dateValue = project.materialLeverans2Date ? 
                              (typeof project.materialLeverans2Date === 'string' ? project.materialLeverans2Date.split('T')[0] : 
                               new Date(project.materialLeverans2Date).toISOString().split('T')[0]) : '';
                            handleCellEdit(project.id, 'materialLeverans2Date', dateValue);
                          }}
                        >
                          {formatDate(project.materialLeverans2Date)}
                        </div>
                      )}
                    </td>

                    {/* Slutbesiktning */}
                    <td className="px-3 py-2">
                      <div className="text-xs text-gray-600">
                        {formatDate(project.slutbesiktningDate)}
                      </div>
                    </td>

                    {/* Faktura 1 */}
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePhaseClick(project.id, 'faktura1', project.faktura1Status || 'pending');
                        }}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${getPhaseColor(project.faktura1Status || 'pending')} hover:opacity-80`}
                        disabled={updatePhaseMutation.isPending}
                      >
                        {project.faktura1Status === 'completed' ? 'Skickad' : project.faktura1Status === 'grädad' ? 'Förberedd' : 'Väntar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredProjects.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <FileSpreadsheet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Inga projekt hittades med de valda filtren</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-gray-700">Förklaring:</div>
            <div className="flex items-center space-x-6 text-xs text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-300 rounded"></div>
                <span>Väntar</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-300 rounded"></div>
                <span>Pågår</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-300 rounded"></div>
                <span>Klar</span>
              </div>
              <div className="text-gray-500">
                Klicka på statusknapparna för att uppdatera fasen
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </>
  );
}