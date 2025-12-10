import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, MapPin, FileText, Tag } from 'lucide-react';

interface Lead {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  status: string;
  source?: string;
  notes?: string;
}

interface LeadInfoCardProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * LeadInfoCard - Popup dialog showing full lead information
 * Used by Kai AI to display lead details when user asks "Show me [lead name]"
 */
const LeadInfoCard: React.FC<LeadInfoCardProps> = ({ lead, isOpen, onClose }) => {
  if (!isOpen || !lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Lead Information
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Photo/Avatar */}
          <div className="flex justify-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary">
              {lead.first_name?.[0]}{lead.last_name?.[0]}
            </div>
          </div>

          {/* Name */}
          <div className="text-center">
            <h3 className="text-2xl font-bold">
              {lead.first_name} {lead.last_name}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Lead - {lead.status}
            </p>
          </div>

          {/* Contact Info */}
          <div className="space-y-3 pt-4 border-t">
            {lead.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{lead.email}</p>
                </div>
              </div>
            )}

            {lead.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium">{lead.phone}</p>
                </div>
              </div>
            )}

            {lead.source && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="text-sm font-medium">{lead.source}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Pipeline Stage</p>
                <p className="text-sm font-medium">{lead.status}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Notes</p>
              </div>
              <p className="text-sm">{lead.notes}</p>
            </div>
          )}

          {/* Close Button */}
          <div className="pt-4">
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LeadInfoCard;
