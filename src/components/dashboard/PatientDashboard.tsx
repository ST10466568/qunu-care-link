import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Phone, Mail, Plus, User, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BookAppointment from './BookAppointment';
import AllAppointmentsModal from './AllAppointmentsModal';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  patient_number?: string;
}

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
  doctor?: {
    first_name: string;
    last_name: string;
    role: string;
    staff_number?: string;
  };
}

interface PatientDashboardProps {
  patient: Patient;
}

const PatientDashboard: React.FC<PatientDashboardProps> = ({ patient }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showAllAppointments, setShowAllAppointments] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [patient.id]);

  const fetchAppointments = async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, description),
          staff:staff_id (first_name, last_name, role)
        `)
        .eq('patient_id', patient.id)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
        return;
      }

      // Fetch doctor information for appointments that have doctor_id
      const appointmentsWithDoctors = await Promise.all(
        (data || []).map(async (appointment) => {
          if (appointment.doctor_id) {
            const { data: doctorData } = await supabase
              .from('staff')
              .select('first_name, last_name, role, staff_number')
              .eq('id', appointment.doctor_id)
              .single();
            
            return {
              ...appointment,
              doctor: doctorData || null
            };
          }
          return appointment;
        })
      );

      setAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

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
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  const upcomingAppointments = appointments.filter(apt => 
    new Date(`${apt.appointment_date}T${apt.start_time}`) >= new Date() &&
    apt.status !== 'cancelled'
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(`${apt.appointment_date}T${apt.start_time}`) < new Date() ||
    apt.status === 'cancelled'
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patient ID</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patient.patient_number || 'Not assigned'}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contact</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{patient.phone}</div>
            {patient.email && (
              <div className="text-sm text-muted-foreground flex items-center mt-1">
                <Mail className="h-3 w-3 mr-1" />
                {patient.email}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Book appointments and manage your healthcare
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button 
              className="flex items-center space-x-2"
              onClick={() => setShowBooking(!showBooking)}
            >
              <Plus className="h-4 w-4" />
              <span>{showBooking ? 'Hide Booking' : 'Book New Appointment'}</span>
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowAllAppointments(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View All Appointments
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Book Appointment Form */}
      {showBooking && (
        <BookAppointment 
          patientId={patient.id} 
          onBookingComplete={() => {
            setShowBooking(false);
            fetchAppointments();
          }}
        />
      )}

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Appointments</CardTitle>
          <CardDescription>
            Your scheduled appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading appointments...</div>
          ) : upcomingAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No upcoming appointments</h3>
              <p className="text-muted-foreground mb-4">
                You don't have any scheduled appointments. Book one now to get the care you need.
              </p>
              <Button
                onClick={() => setShowBooking(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{appointment.services.name}</h4>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
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
                       {(appointment.doctor || appointment.staff) && (
                         <div className="text-sm text-muted-foreground flex items-center">
                           <User className="h-4 w-4 mr-1" />
                           <span>
                             {appointment.doctor ? (
                               <>Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                               {appointment.doctor.staff_number && (
                                 <span className="ml-1 text-xs">({appointment.doctor.staff_number})</span>
                               )}</>
                             ) : appointment.staff ? (
                               <>{appointment.staff.first_name} {appointment.staff.last_name} ({appointment.staff.role})</>
                             ) : null}
                           </span>
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
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">Edit</Button>
                      <Button variant="outline" size="sm">Cancel</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Past Appointments</CardTitle>
            <CardDescription>
              Your appointment history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastAppointments.slice(0, 5).map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4 opacity-75">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{appointment.services.name}</h4>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
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
                       {(appointment.doctor || appointment.staff) && (
                         <div className="text-sm text-muted-foreground flex items-center">
                           <User className="h-4 w-4 mr-1" />
                           <span>
                             {appointment.doctor ? (
                               <>Dr. {appointment.doctor.first_name} {appointment.doctor.last_name}
                               {appointment.doctor.staff_number && (
                                 <span className="ml-1 text-xs">({appointment.doctor.staff_number})</span>
                               )}</>
                             ) : appointment.staff ? (
                               <>{appointment.staff.first_name} {appointment.staff.last_name} ({appointment.staff.role})</>
                             ) : null}
                           </span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              ))}
              {pastAppointments.length > 5 && (
                <Button variant="outline" className="w-full">
                  View All Past Appointments ({pastAppointments.length - 5} more)
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Appointments Modal */}
      <AllAppointmentsModal
        isOpen={showAllAppointments}
        onClose={() => setShowAllAppointments(false)}
        appointments={appointments}
      />
    </div>
  );
};

export default PatientDashboard;