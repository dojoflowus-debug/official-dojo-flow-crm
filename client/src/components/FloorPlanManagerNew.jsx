import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Users, Target, CheckCircle2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = '/api';

// Utility: get initials from name
const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
};

// Student Bubble Card Component
function StudentBubbleCard({ student, onSelect, isSelected, compact = true }) {
  const { first_name, last_name, photo_url, bag_number, student_id } = student;
  const initials = getInitials(first_name, last_name);
  const isAssigned = bag_number !== null;

  return (
    <div
      onClick={() => onSelect(student)}
      className={`group relative rounded-2xl border cursor-pointer transition-all ${
        isSelected 
          ? 'border-teal-400/50 bg-teal-500/10' 
          : isAssigned 
            ? 'border-white/10 hover:border-white/20 bg-white/6' 
            : 'border-white/10 hover:border-white/20 bg-white/4'
      } backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.25)] px-3 ${compact ? 'py-2' : 'py-3'}`}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {photo_url ? (
            <img
              src={photo_url}
              alt={`${first_name} ${last_name}`}
              className={`rounded-xl object-cover ${compact ? 'h-9 w-9' : 'h-11 w-11'}`}
            />
          ) : (
            <div className={`bg-gradient-to-br from-teal-500 to-blue-600 text-white grid place-content-center rounded-xl ${compact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base'}`}>
              <span className="font-semibold tracking-wide">{initials}</span>
            </div>
          )}
          {isAssigned && (
            <span className="absolute -top-1 -right-1 bg-emerald-500 text-[10px] text-white px-1.5 py-0.5 rounded-full shadow">
              ASG
            </span>
          )}
        </div>

        {/* Main Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className={`truncate ${compact ? 'text-[13px]' : 'text-sm'} text-white/90 font-medium`}>
              {first_name} {last_name}
            </p>
          </div>
          <div className="mt-0.5 flex items-center gap-3 text-[11px] text-white/60">
            <div className="flex items-center gap-1">
              <span className={`inline-block h-2 w-2 rounded-full ${isAssigned ? 'bg-emerald-400' : 'bg-slate-400'}`} />
              {isAssigned ? 'Assigned' : 'Available'}
            </div>
            <div className="opacity-60">•</div>
            <div>Bag {bag_number ?? '—'}</div>
          </div>
        </div>

        {/* Bag Number Badge */}
        {isAssigned && (
          <div className={`shrink-0 grid place-content-center rounded-xl border border-white/10 bg-white/5 ${compact ? 'h-9 w-9' : 'h-10 w-10'}`}>
            <span className={`${compact ? 'text-xs' : 'text-sm'} font-semibold text-white/90`}>
              {bag_number}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Student Sidebar Component
function StudentSidebar({ student, isOpen, onClose }) {
  if (!student || !isOpen) return null;

  const { first_name, last_name, email, phone, photo_url, bag_number } = student;
  const initials = getInitials(first_name, last_name);

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl transform transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-6 h-full overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Student Header */}
        <div className="text-center mb-6">
          {photo_url ? (
            <img
              src={photo_url}
              alt={`${first_name} ${last_name}`}
              className="w-24 h-24 rounded-2xl object-cover mx-auto mb-4 border-4 border-teal-500/30"
            />
          ) : (
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-teal-500 to-blue-600 text-white grid place-content-center mx-auto mb-4 text-2xl font-bold">
              {initials}
            </div>
          )}
          <h2 className="text-xl font-semibold text-white">{first_name} {last_name}</h2>
          {bag_number && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="text-sm text-emerald-300">Assigned to Bag #{bag_number}</span>
            </div>
          )}
        </div>

        {/* Student Stats */}
        <div className="space-y-4">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">Contact Info</h3>
            <div className="space-y-2">
              {email && (
                <div>
                  <div className="text-xs text-white/50">Email</div>
                  <div className="text-sm text-white/90">{email}</div>
                </div>
              )}
              {phone && (
                <div>
                  <div className="text-xs text-white/50">Phone</div>
                  <div className="text-sm text-white/90">{phone}</div>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-xs uppercase tracking-wider text-white/60 mb-3">Assignment</h3>
            <div className="space-y-2">
              <div>
                <div className="text-xs text-white/50">Bag Number</div>
                <div className="text-2xl font-bold text-white/90">{bag_number ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-white/50">Status</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block h-2 w-2 rounded-full ${bag_number ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                  <span className="text-sm text-white/90">{bag_number ? 'Assigned' : 'Available'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const FloorPlanManager = ({ isOpen, onClose, classId, className }) => {
  const [loading, setLoading] = useState(false);
  const [floorPlan, setFloorPlan] = useState(null);
  const [bagPositions, setBagPositions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBag, setSelectedBag] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showOnlyAssigned, setShowOnlyAssigned] = useState(false);
  const [bagDensity, setBagDensity] = useState('comfort'); // 'compact' or 'comfort'
  const [configMode, setConfigMode] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [formData, setFormData] = useState({
    width_feet: '',
    length_feet: '',
    available_bags: '',
    students_per_bag: ''
  });

  // Fetch floor plan data
  useEffect(() => {
    if (isOpen && classId) {
      fetchFloorPlan();
    }
  }, [isOpen, classId]);

  // Update form when floor plan loads
  useEffect(() => {
    if (floorPlan) {
      setFormData({
        width_feet: floorPlan.width_feet || '',
        length_feet: floorPlan.length_feet || '',
        available_bags: floorPlan.available_bags || '',
        students_per_bag: floorPlan.students_per_bag || ''
      });
    }
  }, [floorPlan]);

  const fetchFloorPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/classes/${classId}/floor-plan`);
      const data = await response.json();
      
      if (response.ok) {
        setFloorPlan(data.floor_plan);
        setBagPositions(data.bag_positions || []);
        setAssignments(data.assignments || []);
      }
    } catch (error) {
      console.error('Error fetching floor plan:', error);
      toast.error('Failed to load floor plan');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setShowSidebar(true);
  };
  
  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.2, 2)); // Max 200%
  };
  
  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.2, 0.5)); // Min 50%
  };
  
  const handleZoomReset = () => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  };
  
  // Pan handlers
  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };
  
  const handleMouseMove = (e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };
  
  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateFloorPlan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/classes/${classId}/floor-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          width_feet: parseInt(formData.width_feet),
          length_feet: parseInt(formData.length_feet),
          available_bags: parseInt(formData.available_bags),
          students_per_bag: parseInt(formData.students_per_bag)
        })
      });
      
      if (response.ok) {
        toast.success('Floor plan updated successfully');
        await fetchFloorPlan();
        setConfigMode(false);
      } else {
        toast.error('Failed to update floor plan');
      }
    } catch (error) {
      console.error('Error updating floor plan:', error);
      toast.error('Failed to update floor plan');
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalStudents = assignments.length;
  const assignedStudents = assignments.filter(a => a.bag_number !== null).length;
  const availableStudents = totalStudents - assignedStudents;
  const totalBags = floorPlan?.available_bags || bagPositions.length;
  const bagsInUse = new Set(assignments.filter(a => a.bag_number).map(a => a.bag_number)).size;
  const maxCapacity = totalBags * (floorPlan?.students_per_bag || 3);
  const capacityPercent = maxCapacity > 0 ? (assignedStudents / maxCapacity) * 100 : 0;
  
  // Calculate proportional floor layout
  const roomWidth = floorPlan?.width_feet || 50;
  const roomLength = floorPlan?.length_feet || 70;
  const aspectRatio = roomWidth / roomLength;
  
  // Each bag needs 3ft width × 8ft length + clearance on all sides
  const bagWidthFt = 3;
  const bagLengthFt = 8;
  // Compact = 3ft clearance (normal), Comfort = 6ft clearance (double)
  const clearanceFt = bagDensity === 'comfort' ? 6 : 3;
  const totalBagWidthFt = bagWidthFt + clearanceFt;
  const totalBagLengthFt = bagLengthFt + clearanceFt;
  
  // Calculate optimal grid layout
  const bagsPerRow = Math.floor(roomWidth / totalBagWidthFt);
  const bagsPerCol = Math.floor(roomLength / totalBagLengthFt);
  const maxBagsFit = bagsPerRow * bagsPerCol;
  
  // Scale for display (fit in container)
  const containerMaxWidth = 900; // max width in px
  const containerMaxHeight = 500; // max height in px
  let displayWidth, displayHeight;
  
  if (aspectRatio > containerMaxWidth / containerMaxHeight) {
    // Width-constrained
    displayWidth = containerMaxWidth;
    displayHeight = containerMaxWidth / aspectRatio;
  } else {
    // Height-constrained
    displayHeight = containerMaxHeight;
    displayWidth = containerMaxHeight * aspectRatio;
  }
  
  // Calculate bag size in pixels (proportional to room)
  const pxPerFoot = displayWidth / roomWidth;
  const bagWidthPx = bagWidthFt * pxPerFoot;
  const bagLengthPx = bagLengthFt * pxPerFoot;
  const clearancePx = clearanceFt * pxPerFoot;

  // Filter students
  const filteredStudents = showOnlyAssigned 
    ? assignments.filter(a => a.bag_number !== null)
    : assignments;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700 text-white p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Class Layout</h2>
                <p className="text-sm text-white/60 mt-1">{className} • Vision/Glass Design</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Filter Toggle */}
                <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-2 py-1">
                  <button
                    onClick={() => setShowOnlyAssigned(false)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${!showOnlyAssigned ? 'bg-white/15 text-white' : 'text-white/60'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setShowOnlyAssigned(true)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${showOnlyAssigned ? 'bg-white/15 text-white' : 'text-white/60'}`}
                  >
                    Assigned
                  </button>
                </div>

                {/* Bag Density Toggle */}
                <div className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-2 py-1">
                  <span className="text-sm px-2 text-white/60">Bag Spacing</span>
                  <button
                    onClick={() => setBagDensity('compact')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${bagDensity === 'compact' ? 'bg-white/15 text-white' : 'text-white/60'}`}
                  >
                    Compact
                  </button>
                  <button
                    onClick={() => setBagDensity('comfort')}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${bagDensity === 'comfort' ? 'bg-white/15 text-white' : 'text-white/60'}`}
                  >
                    Comfort
                  </button>
                </div>

                {/* Config Toggle */}
                <button
                  onClick={() => setConfigMode(!configMode)}
                  className="px-4 py-2 rounded-full bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 text-teal-300 text-sm transition-colors"
                >
                  {configMode ? 'Cancel' : 'Configure'}
                </button>

                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="px-8 py-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            {/* Configuration Form */}
            {configMode && (
              <div className="mb-6 rounded-2xl bg-teal-500/10 border border-teal-500/30 backdrop-blur-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Floor Plan Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Floor Width (feet)</label>
                    <input
                      type="number"
                      name="width_feet"
                      value={formData.width_feet}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Floor Length (feet)</label>
                    <input
                      type="number"
                      name="length_feet"
                      value={formData.length_feet}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Bags Available</label>
                    <input
                      type="number"
                      name="available_bags"
                      value={formData.available_bags}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="48"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Students Per Bag</label>
                    <input
                      type="number"
                      name="students_per_bag"
                      value={formData.students_per_bag}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="3"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleUpdateFloorPlan}
                    disabled={loading}
                    className="px-6 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update Floor Plan'}
                  </button>
                  <div className="text-xs text-white/50">
                    Floor area: {formData.width_feet && formData.length_feet ? `${parseInt(formData.width_feet) * parseInt(formData.length_feet)} sq ft` : '—'}
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar: Metrics */}
              <div className="col-span-12 lg:col-span-3 space-y-4">
                {/* Summary Metrics */}
                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                  <h3 className="text-sm uppercase tracking-wider text-white/60 mb-3">Summary</h3>
                  <div className="space-y-3">
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                        <Users className="h-3 w-3" />
                        Total Students
                      </div>
                      <div className="text-2xl font-semibold text-white">{totalStudents}</div>
                    </div>
                    <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3">
                      <div className="flex items-center gap-2 text-emerald-400/80 text-xs mb-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Assigned
                      </div>
                      <div className="text-2xl font-semibold text-emerald-300">{assignedStudents}</div>
                    </div>
                    <div className="rounded-xl bg-white/5 border border-white/10 p-3">
                      <div className="flex items-center gap-2 text-white/60 text-xs mb-1">
                        <Target className="h-3 w-3" />
                        Available
                      </div>
                      <div className="text-2xl font-semibold text-slate-200">{availableStudents}</div>
                    </div>
                  </div>
                </div>

                {/* Capacity Bar */}
                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                  <h3 className="text-sm uppercase tracking-wider text-white/60 mb-3">Capacity</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Bags in Use</span>
                      <span className="text-white font-semibold">{bagsInUse} / {totalBags}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/60">Students</span>
                      <span className="text-white font-semibold">{assignedStudents} / {maxCapacity}</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mt-3">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500"
                        style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                      />
                    </div>
                    <div className="text-xs text-white/50 text-center mt-1">
                      {capacityPercent.toFixed(0)}% capacity
                    </div>
                  </div>
                </div>

                {/* Legend */}
                <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl p-4">
                  <h3 className="text-sm uppercase tracking-wider text-white/60 mb-3">Legend</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      <span className="text-white/80">Assigned</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      <span className="text-white/80">Available</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Floor Layout & Roster */}
              <div className="col-span-12 lg:col-span-9 space-y-4">
                {/* Floor Layout Grid */}
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm uppercase tracking-wider text-white/60">Floor Layout</h3>
                    <div className="text-xs text-white/50">{totalBags} bags • {floorPlan?.width_feet}ft × {floorPlan?.length_feet}ft</div>
                  </div>
                  <div 
                    className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/0 relative overflow-hidden p-6 flex items-center justify-center"
                    style={{ cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Zoom Controls */}
                    <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                      <button
                        onClick={handleZoomIn}
                        className="h-8 w-8 rounded-lg bg-slate-800/90 border border-white/20 text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
                        title="Zoom In"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleZoomOut}
                        className="h-8 w-8 rounded-lg bg-slate-800/90 border border-white/20 text-white hover:bg-slate-700 transition-colors flex items-center justify-center"
                        title="Zoom Out"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={handleZoomReset}
                        className="h-8 w-8 rounded-lg bg-slate-800/90 border border-white/20 text-white hover:bg-slate-700 transition-colors flex items-center justify-center text-[10px] font-semibold"
                        title="Reset Zoom"
                      >
                        {Math.round(zoom * 100)}%
                      </button>
                    </div>
                    
                    {/* Proportional Floor Container */}
                    <div 
                      className="relative border-2 border-white/20 rounded-lg transition-transform duration-300"
                      style={{
                        width: `${displayWidth}px`,
                        height: `${displayHeight}px`,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                        transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`
                      }}
                    >
                      {/* Grid lines for scale */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)]" 
                           style={{ backgroundSize: `${pxPerFoot * 10}px ${pxPerFoot * 10}px` }} />
                      
                      {/* Room dimensions labels */}
                      <div className="absolute -top-6 left-0 right-0 text-center text-xs text-white/50">
                        {roomWidth}ft
                      </div>
                      <div className="absolute top-0 bottom-0 -left-8 flex items-center text-xs text-white/50" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        {roomLength}ft
                      </div>
                      
                      {/* Bags positioned proportionally */}
                      <div className="relative w-full h-full p-2">
                      {bagPositions.slice(0, totalBags).map((bag, index) => {
                        const studentsOnBag = assignments.filter(a => a.bag_number === bag.bag_number);
                        const hasStudents = studentsOnBag.length > 0;
                        
                        // Calculate bag position in grid
                        const row = Math.floor(index / bagsPerRow);
                        const col = index % bagsPerRow;
                        const leftPx = col * (bagWidthPx + clearancePx) + clearancePx;
                        const topPx = row * (bagLengthPx + clearancePx) + clearancePx;
                        
                        // Photo size based on bag size
                        const photoSize = Math.min(bagWidthPx * 0.8, bagLengthPx * 0.3);
                        
                        return (
                          <div 
                            key={bag.bag_number} 
                            className="absolute group cursor-pointer"
                            style={{
                              left: `${leftPx}px`,
                              top: `${topPx}px`,
                              width: `${bagWidthPx}px`,
                              height: `${bagLengthPx}px`
                            }}
                            onClick={() => hasStudents && setSelectedBag(bag.bag_number)}
                          >
                            {/* Bag outline */}
                            <div className={`absolute inset-0 rounded-lg border-2 transition-all ${
                              hasStudents ? 'border-emerald-400/50 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20' : 'border-white/20 bg-white/5'
                            }`} />
                            
                            {hasStudents ? (
                              // Show stacked student photos
                              <div className="relative w-full h-full flex items-center justify-center p-1">
                                {studentsOnBag.map((student, idx) => {
                                  const offset = idx * (photoSize * 0.3);
                                  const zIndex = studentsOnBag.length - idx;
                                  
                                  return (
                                    <div
                                      key={student.student_id}
                                      className="absolute rounded-full border-2 border-emerald-400/70 overflow-hidden transition-all hover:scale-110 hover:z-50 cursor-pointer shadow-lg"
                                      style={{
                                        width: `${photoSize}px`,
                                        height: `${photoSize}px`,
                                        left: `${offset}px`,
                                        top: `${offset}px`,
                                        zIndex: zIndex
                                      }}
                                      onClick={() => handleStudentSelect(student)}
                                    >
                                      {student.photo_url ? (
                                        <img
                                          src={student.photo_url}
                                          alt={`${student.first_name} ${student.last_name}`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className={`w-full h-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold ${bagDensity === 'compact' ? 'text-xs' : 'text-sm'}`}>
                                          {getInitials(student.first_name, student.last_name)}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              // Show empty bag with number
                              <div className="relative w-full h-full flex items-center justify-center">
                                <div className="text-white/60 text-xs font-semibold">
                                  {bag.bag_number}
                                </div>
                              </div>
                            )}
                            
                            {/* Bag number badge */}
                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-slate-800/90 border border-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold z-10">
                              {bag.bag_number}
                            </div>
                            
                            {/* Student count badge */}
                            {studentsOnBag.length > 0 && (
                              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center shadow-lg z-10">
                                {studentsOnBag.length}
                              </div>
                            )}
                            
                            {/* Tooltip on hover */}
                            {hasStudents && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-white/20 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                {studentsOnBag.map(s => `${s.first_name} ${s.last_name}`).join(', ')}
                              </div>
                            )}
                          </div>
                        );
                      })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Student Roster */}
                <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm uppercase tracking-wider text-white/60">Roster</h3>
                    <div className="text-xs text-white/50">
                      {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {filteredStudents.map((student) => (
                      <StudentBubbleCard
                        key={student.student_id}
                        student={student}
                        onSelect={handleStudentSelect}
                        isSelected={selectedStudent?.student_id === student.student_id}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Sidebar */}
      <StudentSidebar
        student={selectedStudent}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Bag Members Popup Modal */}
      {selectedBag && (
        <Dialog open={!!selectedBag} onOpenChange={() => setSelectedBag(null)}>
          <DialogContent className="bg-slate-900/95 border-white/10 backdrop-blur-xl max-w-md">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Bag #{selectedBag}</h3>
                <button
                  onClick={() => setSelectedBag(null)}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <p className="text-white/60 text-sm">Members assigned to this bag:</p>
                {assignments
                  .filter(a => a.bag_number === selectedBag)
                  .map((student) => (
                    <div
                      key={student.student_id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBag(null);
                        // Small delay to ensure popup closes before sidebar opens
                        setTimeout(() => {
                          handleStudentSelect(student);
                        }, 100);
                      }}
                    >
                      {student.photo_url ? (
                        <img
                          src={student.photo_url}
                          alt={`${student.first_name} ${student.last_name}`}
                          className="h-12 w-12 rounded-full object-cover border-2 border-emerald-400/50"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm border-2 border-emerald-400/50">
                          {getInitials(student.first_name, student.last_name)}
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-white font-semibold">
                          {student.first_name} {student.last_name}
                        </p>
                        <p className="text-white/60 text-sm">Click to view details</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default FloorPlanManager;

