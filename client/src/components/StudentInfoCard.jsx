import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Award, Calendar, CreditCard, X } from 'lucide-react';

const API_URL = '/api';

/**
 * StudentInfoCard - Popup dialog showing full student or lead information
 * 
 * Props:
 * - studentId: number - ID of student or lead
 * - isOpen: boolean
 * - onClose: function
 */
const StudentInfoCard = ({ studentId, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [isLead, setIsLead] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentData();
    }
  }, [isOpen, studentId]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Try fetching as student first
      let response = await fetch(`${API_URL}/students/${studentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
        setIsLead(false);
      } else {
        // Try as lead
        response = await fetch(`${API_URL}/leads/${studentId}`);
        if (response.ok) {
          const data = await response.json();
          setStudentData(data);
          setIsLead(true);
        }
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student/lead data:', error);
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isLead ? 'Lead Information' : 'Student Information'}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : studentData ? (
          <div className="space-y-4">
            {/* Photo */}
            <div className="flex justify-center">
              {studentData.photo_url ? (
                <img
                  src={studentData.photo_url}
                  alt={`${studentData.first_name} ${studentData.last_name}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-primary"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary">
                  {studentData.first_name?.[0]}{studentData.last_name?.[0]}
                </div>
              )}
            </div>

            {/* Name */}
            <div className="text-center">
              <h3 className="text-2xl font-bold">
                {studentData.first_name} {studentData.last_name}
              </h3>
              {isLead && (
                <p className="text-sm text-muted-foreground mt-1">
                  Lead - {studentData.status || 'New'}
                </p>
              )}
            </div>

            {/* Contact Info */}
            <div className="space-y-3 pt-4 border-t">
              {studentData.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{studentData.email}</p>
                  </div>
                </div>
              )}

              {studentData.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{studentData.phone}</p>
                  </div>
                </div>
              )}

              {!isLead && studentData.belt_rank && (
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Belt Rank</p>
                    <p className="text-sm font-medium">{studentData.belt_rank}</p>
                  </div>
                </div>
              )}

              {!isLead && studentData.age && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Age</p>
                    <p className="text-sm font-medium">{studentData.age} years old</p>
                  </div>
                </div>
              )}

              {!isLead && studentData.membership_status && (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Membership</p>
                    <p className="text-sm font-medium capitalize">{studentData.membership_status}</p>
                  </div>
                </div>
              )}

              {isLead && studentData.interest && (
                <div className="flex items-center gap-3">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Interest</p>
                    <p className="text-sm font-medium">{studentData.interest}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Notes (for leads) */}
            {isLead && studentData.notes && (
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground mb-1">Notes</p>
                <p className="text-sm">{studentData.notes}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="pt-4">
              <Button onClick={onClose} className="w-full">
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">No data found</div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default StudentInfoCard;

