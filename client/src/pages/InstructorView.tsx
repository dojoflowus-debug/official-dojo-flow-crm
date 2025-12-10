import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Printer, Users, Clock, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = '/api';

/**
 * InstructorView - Show bag assignments for a specific class
 * Helps instructors see which students are assigned to which bags
 */
export default function InstructorView() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [classInfo, setClassInfo] = useState(null);
  const [bagAssignments, setBagAssignments] = useState([]);
  const [floorPlan, setFloorPlan] = useState(null);

  useEffect(() => {
    if (classId) {
      fetchClassData();
    }
  }, [classId]);

  const fetchClassData = async () => {
    try {
      setLoading(true);

      // Fetch class info
      const classResponse = await fetch(`${API_URL}/classes/${classId}`);
      if (!classResponse.ok) throw new Error('Failed to fetch class');
      const classData = await classResponse.json();
      setClassInfo(classData);

      // Fetch floor plan and assignments
      const floorPlanResponse = await fetch(`${API_URL}/classes/${classId}/floor-plan`);
      if (floorPlanResponse.ok) {
        const floorData = await floorPlanResponse.json();
        setFloorPlan(floorData.floor_plan);

        // Group assignments by bag number
        const bagMap = new Map();
        floorData.assignments.forEach(assignment => {
          const students = bagMap.get(assignment.bag_number) || [];
          students.push({
            id: assignment.student_id,
            name: `${assignment.first_name} ${assignment.last_name}`,
            first_name: assignment.first_name,
            last_name: assignment.last_name
          });
          bagMap.set(assignment.bag_number, students);
        });

        // Convert to array and sort by bag number
        const assignments = Array.from(bagMap.entries())
          .map(([bag_number, students]) => ({ bag_number, students }))
          .sort((a, b) => a.bag_number - b.bag_number);

        setBagAssignments(assignments);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching class data:', error);
      toast.error('Failed to load class data');
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
        <Button onClick={() => navigate('/classes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Button>
      </div>
    );
  }

  const studentsPerBag = floorPlan?.students_per_bag || 1;
  const totalCapacity = bagAssignments.length * studentsPerBag;
  const totalAssigned = bagAssignments.reduce((sum, bag) => sum + bag.students.length, 0);

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      {/* Header - Hide on print */}
      <div className="max-w-7xl mx-auto mb-8 print:hidden">
        <Button
          variant="ghost"
          onClick={() => navigate('/classes')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Classes
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">{classInfo.name}</h1>
            <div className="flex flex-wrap gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{classInfo.start_time} - {classInfo.end_time}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>Instructor: {classInfo.instructor_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{totalAssigned}/{totalCapacity} students assigned</span>
              </div>
            </div>
          </div>

          <Button onClick={handlePrint} size="lg">
            <Printer className="mr-2 h-5 w-5" />
            Print
          </Button>
        </div>
      </div>

      {/* Print Header - Only visible on print */}
      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold mb-2">{classInfo.name}</h1>
        <div className="text-sm text-gray-600 mb-4">
          <div>{classInfo.start_time} - {classInfo.end_time}</div>
          <div>Instructor: {classInfo.instructor_name}</div>
          <div>{totalAssigned}/{totalCapacity} students assigned</div>
        </div>
      </div>

      {/* Bag Assignments */}
      <div className="max-w-7xl mx-auto">
        {!floorPlan ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">No floor plan configured for this class</p>
          </Card>
        ) : bagAssignments.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">No students assigned yet</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 print:grid-cols-5 print:gap-2">
            {bagAssignments.map(({ bag_number, students }) => (
              <Card key={bag_number} className="p-4 print:p-2 print:break-inside-avoid">
                {/* Bag Number */}
                <div className="flex items-center justify-center mb-3 print:mb-2">
                  <div className="w-16 h-16 print:w-12 print:h-12 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg print:shadow-none">
                    <div className="text-center">
                      <div className="text-xs text-white/80 font-medium print:text-[8px]">BAG</div>
                      <div className="text-2xl print:text-xl font-bold text-white">{bag_number}</div>
                    </div>
                  </div>
                </div>

                {/* Students */}
                <div className="space-y-2 print:space-y-1">
                  {students.map((student, idx) => (
                    <div key={student.id} className="flex items-center gap-2 p-2 print:p-1 bg-muted rounded">
                      <div className="w-8 h-8 print:w-6 print:h-6 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm print:text-xs flex-shrink-0">
                        {student.first_name[0]}{student.last_name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm print:text-xs font-medium truncate">{student.name}</p>
                      </div>
                    </div>
                  ))}

                  {/* Empty slots */}
                  {students.length < studentsPerBag && Array.from({ length: studentsPerBag - students.length }).map((_, idx) => (
                    <div key={`empty-${idx}`} className="flex items-center gap-2 p-2 print:p-1 bg-muted/30 rounded border-2 border-dashed border-muted-foreground/20">
                      <div className="w-8 h-8 print:w-6 print:h-6 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-muted-foreground/40 text-xs">-</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm print:text-xs text-muted-foreground/60 italic">Available</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Capacity Indicator */}
                {studentsPerBag > 1 && (
                  <div className="mt-3 print:mt-2 pt-3 print:pt-2 border-t border-border">
                    <div className="flex items-center justify-center gap-2 text-xs print:text-[10px] text-muted-foreground">
                      <div className="flex gap-1">
                        {Array.from({ length: studentsPerBag }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-2 h-2 print:w-1.5 print:h-1.5 rounded-full ${
                              i < students.length ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                            }`}
                          />
                        ))}
                      </div>
                      <span>{students.length}/{studentsPerBag}</span>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Print Footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p>Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</p>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>
    </div>
  );
}

