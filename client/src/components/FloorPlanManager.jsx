import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import FloorPlanDiagram from './FloorPlanDiagram';
import StudentInfoCard from './StudentInfoCard';
import { Loader2, X, Download, Plus, Minus, ChevronDown } from 'lucide-react';

const API_URL = '/api';

/**
 * FloorPlanManager - Manage floor plan configuration for a class
 * Modern dark theme design matching mockup
 */
const FloorPlanManager = ({ classId, className, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [floorPlan, setFloorPlan] = useState(null);
  const [bagPositions, setBagPositions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Student info card state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentCard, setShowStudentCard] = useState(false);
  
  // Form state
  const [width, setWidth] = useState('50');
  const [length, setLength] = useState('70');
  const [availableBags, setAvailableBags] = useState('1');
  const [studentsPerBag, setStudentsPerBag] = useState('3');
  const [hasExistingPlan, setHasExistingPlan] = useState(false);
  const [maxBags, setMaxBags] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Fetch existing floor plan
  useEffect(() => {
    if (isOpen && classId) {
      fetchFloorPlan();
    }
  }, [isOpen, classId]);
  
  const fetchFloorPlan = async () => {
    try {
      setLoading(true);
      console.log('Fetching floor plan for class:', classId);
      const response = await fetch(`${API_URL}/classes/${classId}/floor-plan`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Floor plan data received:', data);
        console.log('Bag positions count:', data.bag_positions?.length);
        console.log('Assignments count:', data.assignments?.length);
        
        setFloorPlan(data.floor_plan);
        setBagPositions(data.bag_positions || []);
        setAssignments(data.assignments || []);
        setWidth(data.floor_plan.width_feet.toString());
        setLength(data.floor_plan.length_feet.toString());
        setAvailableBags(data.floor_plan.available_bags ? data.floor_plan.available_bags.toString() : '');
        setStudentsPerBag(data.floor_plan.students_per_bag ? data.floor_plan.students_per_bag.toString() : '3');
        setMaxBags(data.floor_plan.total_bags || 0);
        setHasExistingPlan(true);
      } else if (response.status === 404) {
        console.log('No floor plan found (404)');
        setHasExistingPlan(false);
        setFloorPlan(null);
        setBagPositions([]);
        setAssignments([]);
      } else {
        console.error('Floor plan fetch failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching floor plan:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSaveFloorPlan = async (e) => {
    e.preventDefault();
    
    const widthNum = parseFloat(width);
    const lengthNum = parseFloat(length);
    
    if (isNaN(widthNum) || isNaN(lengthNum) || widthNum <= 0 || lengthNum <= 0) {
      toast.error('Please enter valid dimensions');
      return;
    }
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API_URL}/classes/${classId}/floor-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          width_feet: widthNum,
          length_feet: lengthNum,
          available_bags: availableBags ? parseInt(availableBags) : null,
          students_per_bag: parseInt(studentsPerBag),
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        toast.success('Floor plan updated successfully');
        await fetchFloorPlan();
      } else {
        toast.error(data.error || 'Failed to update floor plan');
      }
    } catch (error) {
      console.error('Error saving floor plan:', error);
      toast.error('Failed to save floor plan');
    } finally {
      setLoading(false);
    }
  };
  
  const handleClearAssignments = async () => {
    if (!confirm('Are you sure you want to clear all bag assignments?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/classes/${classId}/floor-plan/clear-assignments`, {
        method: 'POST',
      });
      
      const data = await response.json();
      toast.success(`Cleared ${data.cleared_count} assignments`);
      await fetchFloorPlan();
    } catch (error) {
      console.error('Error clearing assignments:', error);
      toast.error('Failed to clear assignments');
    } finally {
      setLoading(false);
    }
  };
  
  const handleStudentClick = (student) => {
    setSelectedStudent(student);
    setShowStudentCard(true);
  };
  
  const totalCapacity = (parseInt(availableBags || maxBags || 0) * parseInt(studentsPerBag || 1));
  
  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[900px] w-full max-h-[95vh] overflow-y-auto bg-slate-800 border-slate-700 text-white p-0">
          {/* Header */}
          <div className="sticky top-0 z-10 bg-slate-800 border-b border-slate-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Floor Plan: {className}</h2>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>
          
          <div className="px-8 py-6 space-y-6">
            {/* Floor Dimensions Section */}
            <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600">
              <h3 className="text-lg font-semibold mb-4">Floor Dimensions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Floor Width (feet)</label>
                  <input
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Floor Length (feet)</label>
                  <input
                    type="number"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                    placeholder="70"
                  />
                </div>
              </div>
            </div>
            
            {/* Classroom Capacity Banner */}
            <div className="bg-gradient-to-r from-teal-900/80 to-emerald-900/80 rounded-2xl p-6 border border-teal-700/50">
              <div className="text-center">
                <p className="text-sm text-teal-200 mb-2">Classroom Capacity</p>
                <p className="text-5xl font-bold text-white mb-2">{totalCapacity} Students</p>
                <p className="text-sm text-teal-300">
                  Based on: {availableBags || maxBags || 0} bag × {studentsPerBag} students per ag
                </p>
              </div>
            </div>
            
            {/* Bag Configuration Section */}
            <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600">
              <h3 className="text-lg font-semibold mb-4">Bag Configuration</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Bags Available</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={availableBags}
                      onChange={(e) => setAvailableBags(e.target.value)}
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                      placeholder="1"
                    />
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Students Per Bag</label>
                  <div className="relative">
                    <select
                      value={studentsPerBag}
                      onChange={(e) => setStudentsPerBag(e.target.value)}
                      className="w-full bg-slate-600 border border-slate-500 rounded-lg px-4 py-3 text-white text-2xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none"
                    >
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              
              {/* Info bullets */}
              <div className="space-y-2 text-sm text-slate-300 mb-6">
                <p>• Each bag requires 3 × 8 ft (2ft bag + 3ft clearance)</p>
                <p>• Arranged in an optimized grid</p>
                <p>• Only bags you own will be shown</p>
              </div>
              
              <Button
                onClick={handleSaveFloorPlan}
                disabled={loading}
                className="w-full bg-slate-600 hover:bg-slate-500 text-white font-medium py-3 rounded-lg transition-colors"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                Update Floor Plan
              </Button>
            </div>
            
            {/* Floor Layout Section */}
            <div className="bg-slate-700/50 rounded-2xl p-6 border border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Floor Layout</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                    <span className="text-sm text-slate-300">Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-slate-300">Assigned</span>
                  </div>
                  <button className="p-2 hover:bg-slate-600 rounded-lg transition-colors">
                    <Download className="h-5 w-5 text-slate-400" />
                  </button>
                </div>
              </div>
              
              {/* Floor Plan Diagram */}
              <div 
                className="bg-slate-200 rounded-xl p-6 min-h-[300px] overflow-auto"
                style={{ cursor: zoomLevel > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
                onMouseDown={(e) => {
                  if (zoomLevel > 1) {
                    setIsDragging(true);
                    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
                  }
                }}
                onMouseMove={(e) => {
                  if (isDragging && zoomLevel > 1) {
                    setPanOffset({
                      x: e.clientX - dragStart.x,
                      y: e.clientY - dragStart.y
                    });
                  }
                }}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
              >
                {bagPositions.length > 0 ? (
                  <div style={{ 
                    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`, 
                    transformOrigin: 'top left', 
                    transition: isDragging ? 'none' : 'transform 0.2s'
                  }}>
                    <FloorPlanDiagram
                      floorPlan={floorPlan}
                      bagPositions={bagPositions}
                      assignments={assignments}
                      onStudentClick={handleStudentClick}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-400">
                    <p>No floor plan configured yet. Enter dimensions and click "Update Floor Plan".</p>
                  </div>
                )}
              </div>
              
              {/* Zoom Controls */}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-300">Zoom: {Math.round(zoomLevel * 100)}%</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2))}
                    className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                    title="Zoom In"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.5))}
                    className="p-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors"
                    title="Zoom Out"
                  >
                    <Minus className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setZoomLevel(1)}
                    className="px-3 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg transition-colors text-xs"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
            
            {/* Clear Assignments Button */}
            {assignments.length > 0 && (
              <Button
                onClick={handleClearAssignments}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
              >
                Clear All Assignments
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Student Info Card */}
      <StudentInfoCard
        studentId={selectedStudent?.student_id}
        isOpen={showStudentCard}
        onClose={() => setShowStudentCard(false)}
      />
    </>
  );
};

export default FloorPlanManager;

