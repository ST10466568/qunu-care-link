import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock } from 'lucide-react';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
  services: {
    name: string;
    description?: string;
  };
  staff?: {
    first_name: string;
    last_name: string;
    role: string;
  };
}

interface AllAppointmentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
}

const AllAppointmentsModal = ({ isOpen, onClose, appointments }: AllAppointmentsModalProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'no_show': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date}T${a.start_time}`);
    const dateB = new Date(`${b.appointment_date}T${b.start_time}`);
    return dateB.getTime() - dateA.getTime(); // Most recent first
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>All Appointments</DialogTitle>
          <DialogDescription>
            Your complete appointment history ({appointments.length} total)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {sortedAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No appointments found</p>
            </div>
          ) : (
            sortedAppointments.map((appointment) => {
              const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
              const isUpcoming = appointmentDateTime >= new Date() && appointment.status !== 'cancelled';
              
              return (
                <div 
                  key={appointment.id} 
                  className={`border rounded-lg p-4 ${!isUpcoming ? 'opacity-75' : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{appointment.services.name}</h4>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                        {isUpcoming && (
                          <Badge variant="outline" className="text-xs">
                            Upcoming
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
                        </div>
                      </div>
                      
                      {appointment.staff && (
                        <div className="text-sm text-muted-foreground">
                          With: {appointment.staff.first_name} {appointment.staff.last_name} ({appointment.staff.role})
                        </div>
                      )}
                      
                      {appointment.services.description && (
                        <p className="text-sm text-muted-foreground">{appointment.services.description}</p>
                      )}
                      
                      {appointment.notes && (
                        <p className="text-sm bg-muted p-2 rounded">
                          <strong>Notes:</strong> {appointment.notes}
                        </p>
                      )}
                    </div>
                    
                    {isUpcoming && (
                      <div className="flex space-x-2 ml-4">
                        <Button variant="outline" size="sm">Edit</Button>
                        <Button variant="outline" size="sm">Cancel</Button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AllAppointmentsModal;