import React, { useState, useCallback } from 'react';
import { 
  Flame, 
  Phone, 
  Calendar, 
  Gift, 
  XCircle,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import KanbanLeadCard from './KanbanLeadCard';

interface Lead {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  source?: string;
  status: string;
  pipeline_value?: number;
  lead_score?: number;
  created_at?: string;
  updated_at?: string;
}

interface PipelineStage {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
}

interface KanbanBoardProps {
  leads: Record<string, Lead[]>;
  selectedStage: string | null;
  isDarkMode: boolean;
  onLeadClick: (lead: Lead) => void;
  onAddLead: () => void;
  onCall: (lead: Lead) => void;
  onText: (lead: Lead) => void;
  onSchedule: (lead: Lead) => void;
  onStatusChange?: (leadId: number, newStatus: string) => void;
}

const stages: PipelineStage[] = [
  { id: 'new_lead', label: 'New Leads', icon: Flame, color: '#22C55E' },
  { id: 'contacted', label: 'Contacted', icon: Phone, color: '#84CC16' },
  { id: 'intro_scheduled', label: 'Intro Scheduled', icon: Calendar, color: '#EAB308' },
  { id: 'trial_presented', label: 'Trial Presented', icon: Gift, color: '#F97316' },
  { id: 'lost_winback', label: 'Lost / Winback', icon: XCircle, color: '#EF4444' },
];

// Map old stage IDs to new ones
const stageMapping: Record<string, string> = {
  'new_lead': 'new_lead',
  'attempting_contact': 'contacted',
  'contact_made': 'contacted',
  'intro_scheduled': 'intro_scheduled',
  'offer_presented': 'trial_presented',
  'enrolled': 'trial_presented',
  'nurture': 'contacted',
  'lost_winback': 'lost_winback',
};

export default function KanbanBoard({
  leads,
  selectedStage,
  isDarkMode,
  onLeadClick,
  onAddLead,
  onCall,
  onText,
  onSchedule,
  onStatusChange
}: KanbanBoardProps) {
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(
    stages.reduce((acc, stage) => ({ ...acc, [stage.id]: true }), {})
  );
  const [draggedLeadId, setDraggedLeadId] = useState<number | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [optimisticLeads, setOptimisticLeads] = useState<Record<string, Lead[]>>(leads);

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    })
  );

  // Reorganize leads by new stage structure
  const getLeadsForStage = (stageId: string): Lead[] => {
    const allLeads: Lead[] = [];
    
    Object.entries(optimisticLeads).forEach(([oldStageId, stageLeads]) => {
      const mappedStageId = stageMapping[oldStageId] || oldStageId;
      if (mappedStageId === stageId) {
        allLeads.push(...stageLeads);
      }
    });
    
    return allLeads;
  };

  const toggleStage = (stageId: string) => {
    setExpandedStages(prev => ({
      ...prev,
      [stageId]: !prev[stageId]
    }));
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setDraggedLeadId(active.id as number);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      const stageId = over.id as string;
      if (stages.some(s => s.id === stageId)) {
        setHoveredStageId(stageId);
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggedLeadId(null);
    setHoveredStageId(null);

    if (!over) return;

    const leadId = active.id as number;
    const newStageId = over.id as string;

    // Find the lead
    let foundLead: Lead | null = null;
    let oldStageId: string | null = null;

    for (const [stageKey, stageLeads] of Object.entries(optimisticLeads)) {
      const lead = stageLeads.find(l => l.id === leadId);
      if (lead) {
        foundLead = lead;
        oldStageId = stageKey;
        break;
      }
    }

    if (!foundLead || !oldStageId) return;

    // Check if stage actually changed
    const mappedOldStage = stageMapping[oldStageId] || oldStageId;
    if (mappedOldStage === newStageId) return;

    // Optimistic update
    const updatedLeads = { ...optimisticLeads };
    updatedLeads[oldStageId] = updatedLeads[oldStageId].filter(l => l.id !== leadId);
    
    // Add to new stage (find the original key for the new stage)
    let newStageKey = newStageId;
    for (const [key, value] of Object.entries(stageMapping)) {
      if (value === newStageId && !updatedLeads[key]) {
        newStageKey = key;
        break;
      }
    }
    
    if (!updatedLeads[newStageKey]) {
      updatedLeads[newStageKey] = [];
    }
    updatedLeads[newStageKey].push({ ...foundLead, status: newStageId });
    
    setOptimisticLeads(updatedLeads);

    // Call the callback to persist to database
    if (onStatusChange) {
      onStatusChange(leadId, newStageId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full px-4 md:px-6 pb-8">
        {/* Horizontal Scroll Container */}
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {stages.map((stage) => {
            const Icon = stage.icon;
            const stageLeads = getLeadsForStage(stage.id);
            const isSelected = selectedStage === stage.id;
            const isExpanded = expandedStages[stage.id];
            const isFiltered = selectedStage !== null && !isSelected;
            const isHovered = hoveredStageId === stage.id;

            return (
              <div
                key={stage.id}
                className={`
                  flex-shrink-0 w-[300px] md:w-[320px]
                  transition-all duration-300 ease-out
                  ${isFiltered ? 'opacity-40 scale-95' : 'opacity-100'}
                  ${isHovered && draggedLeadId ? 'scale-105' : ''}
                `}
              >
                {/* Column Header */}
                <div 
                  className={`
                    flex items-center justify-between p-3 rounded-t-xl
                    transition-all duration-200
                    ${isDarkMode 
                      ? 'bg-white/5 border border-b-0 border-white/10' 
                      : 'bg-slate-50 border border-b-0 border-slate-200'
                    }
                    ${isHovered && draggedLeadId ? 'bg-white/10 border-white/20 shadow-lg' : ''}
                  `}
                  style={{
                    borderTopColor: isSelected ? stage.color : undefined,
                    borderTopWidth: isSelected ? '2px' : '1px',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{ 
                        backgroundColor: `${stage.color}${isHovered ? '30' : '20'}`,
                      }}
                    >
                      <Icon className="w-4 h-4" style={{ color: stage.color }} />
                    </div>
                    <div>
                      <h3 className={`
                        text-sm font-semibold
                        ${isDarkMode ? 'text-white' : 'text-slate-800'}
                      `}
                      style={{ color: isSelected ? stage.color : undefined }}
                      >
                        {stage.label}
                      </h3>
                      <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                        {stageLeads.length} {stageLeads.length === 1 ? 'lead' : 'leads'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Collapse Toggle */}
                    <button
                      onClick={() => toggleStage(stage.id)}
                      className={`
                        p-1.5 rounded-lg transition-colors
                        ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-200'}
                      `}
                    >
                      {isExpanded ? (
                        <ChevronUp className={`w-4 h-4 ${isDarkMode ? 'text-white/50' : 'text-slate-400'}`} />
                      ) : (
                        <ChevronDown className={`w-4 h-4 ${isDarkMode ? 'text-white/50' : 'text-slate-400'}`} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Column Body - Droppable Area */}
                <SortableContext
                  items={stageLeads.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div 
                    className={`
                      rounded-b-xl overflow-hidden transition-all duration-300
                      ${isDarkMode 
                        ? 'bg-white/[0.02] border border-t-0 border-white/10' 
                        : 'bg-slate-50/50 border border-t-0 border-slate-200'
                      }
                      ${isExpanded ? 'max-h-[600px]' : 'max-h-0'}
                      ${isHovered && draggedLeadId ? 'ring-2 ring-offset-0' : ''}
                    `}
                    style={{
                      ringColor: isHovered && draggedLeadId ? stage.color : undefined,
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                  >
                    <div className="p-3 space-y-3 overflow-y-auto max-h-[550px] scrollbar-hide">
                      {stageLeads.length === 0 ? (
                        /* Empty State */
                        <div 
                          className={`
                            flex flex-col items-center justify-center py-8 px-4
                            rounded-xl border-2 border-dashed
                            transition-all duration-200
                            ${isDarkMode 
                              ? 'border-white/10 bg-white/[0.02]' 
                              : 'border-slate-200 bg-white/50'
                            }
                            ${isHovered && draggedLeadId ? 'border-white/30 bg-white/10' : ''}
                          `}
                        >
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-all duration-200"
                            style={{ 
                              backgroundColor: `${stage.color}${isHovered && draggedLeadId ? '30' : '10'}`,
                            }}
                          >
                            <Plus className="w-5 h-5" style={{ color: stage.color }} />
                          </div>
                          <p className={`text-sm text-center ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`}>
                            {isHovered && draggedLeadId ? 'Drop here' : 'Add Lead...'}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={onAddLead}
                            className={`
                              mt-2 text-xs
                              ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-700'}
                            `}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add Lead
                          </Button>
                        </div>
                      ) : (
                        /* Lead Cards */
                        stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            className={`
                              transition-all duration-200
                              ${draggedLeadId === lead.id ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}
                            `}
                          >
                            <KanbanLeadCard
                              lead={lead}
                              stageColor={stage.color}
                              isDarkMode={isDarkMode}
                              onClick={() => onLeadClick(lead)}
                              onCall={() => onCall(lead)}
                              onText={() => onText(lead)}
                              onSchedule={() => onSchedule(lead)}
                              isDragging={draggedLeadId === lead.id}
                            />
                          </div>
                        ))
                      )}

                      {/* Add Lead Card at bottom of non-empty columns */}
                      {stageLeads.length > 0 && stage.id === 'trial_presented' && (
                        <button
                          onClick={onAddLead}
                          className={`
                            w-full py-4 rounded-xl border-2 border-dashed
                            flex items-center justify-center gap-2
                            transition-all duration-200
                            ${isDarkMode 
                              ? 'border-white/10 hover:border-white/20 text-white/40 hover:text-white/60' 
                              : 'border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-500'
                            }
                          `}
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm">Add Lead...</span>
                        </button>
                      )}
                    </div>
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        {/* Scrollbar Hide Styles */}
        <style>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>
      </div>
    </DndContext>
  );
}
