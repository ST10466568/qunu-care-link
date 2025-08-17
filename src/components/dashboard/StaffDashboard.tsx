import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Clock, Users, CheckCircle, XCircle, AlertCircle, Plus, FileText, Edit, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ScheduleView from './ScheduleView';
import EditAppointmentModal from './EditAppointmentModal';
import Reports from './Reports';
import WalkInPatientModal from './WalkInPatientModal';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse' | 'admin';
  phone?: string;
  staff_number?: string;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  staff_id?: string;
  service_id: string;
  patient_id: string;
  services: {
    name: string;
    description?: string;
  };
  patients: {
    first_name: string;
    last_name: string;
    phone: string;
    patient_number?: string;
  };
}

interface StaffDashboardProps {
  staff: Staff;
}

const StaffDashboard: React.FC<StaffDashboardProps> = ({ staff }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState({
    today: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showReports, setShowReports] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAppointments();
  }, [staff.id]);

  const fetchAppointments = async () => {
    try {
      // Fetch appointments based on role
      let query = supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, description),
          patients:patient_id (first_name, last_name, phone, patient_number)
        `);

      // If not admin, only show own appointments
      if (staff.role !== 'admin') {
        query = query.eq('staff_id', staff.id);
      }

      const { data, error } = await query
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching appointments:', error);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      } else {
        setAppointments(data || []);
        calculateStats(data || []);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (appointmentData: Appointment[]) => {
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = appointmentData.filter(apt => apt.appointment_date === today);
    
    setStats({
      today: todayAppointments.length,
      pending: appointmentData.filter(apt => apt.status === 'pending').length,
      confirmed: appointmentData.filter(apt => apt.status === 'confirmed').length,
      completed: appointmentData.filter(apt => apt.status === 'completed').length,
    });
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', appointmentId);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update appointment status",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Appointment status updated",
        });
        fetchAppointments(); // Refresh data
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    }
  };

  const canManageAppointment = (appointment: Appointment): boolean => {
    // Admin can manage all appointments
    if (staff.role === 'admin') {
      return true;
    }
    
    // Doctor can only manage appointments on days they are scheduled
    if (staff.role === 'doctor') {
      // For now, we'll allow doctors to manage their own appointments
      // In a more complex system, you'd check if they're scheduled for that specific day
      return appointment.staff_id === staff.id;
    }
    
    return false;
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

  const todayAppointments = appointments.filter(apt => 
    apt.appointment_date === new Date().toISOString().split('T')[0]
  );

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  );

  const pendingAppointments = appointments.filter(apt => apt.status === 'pending');

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'doctor': return 'Doctor';
      case 'nurse': return 'Nurse';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  if (showSchedule) {
    return <ScheduleView staff={staff} onBack={() => setShowSchedule(false)} />;
  }

  if (showReports) {
    return <Reports staff={staff} onBack={() => setShowReports(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific welcome message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {getRoleDisplayName(staff.role)} {staff.first_name}</CardTitle>
          <CardDescription>
            {staff.role === 'admin' 
              ? 'Manage clinic operations and oversee all appointments'
              : 'Manage your appointments and patient care'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {staff.role === 'admin' && (
              <>
                <Button className="flex items-center space-x-2" onClick={() => setShowWalkInModal(true)}>
                  <Plus className="h-4 w-4" />
                  <span>Add Walk-in Patient</span>
                </Button>
                <Button variant="outline" onClick={() => setShowReports(true)}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Button>
                <Button variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Staff
                </Button>
              </>
            )}
            <Button variant="outline" onClick={() => setShowSchedule(true)}>
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appointments Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today">Today ({stats.today})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({stats.pending})</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Today's Schedule</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('en-ZA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading appointments...</div>
              ) : todayAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No appointments today</h3>
                  <p className="text-muted-foreground">You have a free day!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id}
                      appointment={appointment}
                      onStatusUpdate={updateAppointmentStatus}
                      onEdit={setEditingAppointment}
                      showPatientInfo={true}
                      formatTime={formatTime}
                      getStatusColor={getStatusColor}
                      canManage={canManageAppointment(appointment)}
                      staff={staff}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
              <CardDescription>
                Appointments waiting for your approval
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No pending appointments</h3>
                  <p className="text-muted-foreground">All appointments are up to date!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingAppointments.map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id}
                      appointment={appointment}
                      onStatusUpdate={updateAppointmentStatus}
                      onEdit={setEditingAppointment}
                      showPatientInfo={true}
                      formatTime={formatTime}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                      canManage={canManageAppointment(appointment)}
                      staff={staff}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Appointments</CardTitle>
              <CardDescription>
                Your scheduled appointments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {upcomingAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No upcoming appointments</h3>
                  <p className="text-muted-foreground">Your schedule is clear!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingAppointments.slice(0, 10).map((appointment) => (
                    <AppointmentCard 
                      key={appointment.id}
                      appointment={appointment}
                      onStatusUpdate={updateAppointmentStatus}
                      onEdit={setEditingAppointment}
                      showPatientInfo={true}
                      formatTime={formatTime}
                      formatDate={formatDate}
                      getStatusColor={getStatusColor}
                      canManage={canManageAppointment(appointment)}
                      staff={staff}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <EditAppointmentModal
        appointment={editingAppointment}
        isOpen={!!editingAppointment}
        onClose={() => setEditingAppointment(null)}
        onUpdate={fetchAppointments}
      />

      <WalkInPatientModal
        isOpen={showWalkInModal}
        onClose={() => setShowWalkInModal(false)}
        onSuccess={fetchAppointments}
        currentStaff={staff}
      />
    </div>
  );
};

// Appointment Card Component
interface AppointmentCardProps {
  appointment: Appointment;
  onStatusUpdate: (id: string, status: string) => void;
  onEdit: (appointment: Appointment) => void;
  showPatientInfo: boolean;
  formatTime: (time: string) => string;
  formatDate?: (date: string) => string;
  getStatusColor: (status: string) => string;
  canManage: boolean;
  staff: Staff;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onStatusUpdate,
  onEdit,
  showPatientInfo,
  formatTime,
  formatDate,
  getStatusColor,
  canManage,
  staff
}) => {
  return (
    <div className="border rounded-lg p-4">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <div className="flex items-center space-x-2">
            <h4 className="font-medium">{appointment.services.name}</h4>
            <Badge className={getStatusColor(appointment.status)}>
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
            {appointment.booking_type !== 'online' && (
              <Badge variant="outline">
                {appointment.booking_type === 'walk_in' ? 'Walk-in' : 'Phone'}
              </Badge>
            )}
          </div>
          
          {showPatientInfo && (
            <div className="text-sm">
              <strong>Patient:</strong> {appointment.patients.first_name} {appointment.patients.last_name}
              {appointment.patients.patient_number && ` (${appointment.patients.patient_number})`}
              <br />
              <strong>Phone:</strong> {appointment.patients.phone}
            </div>
          )}
          
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {formatDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(appointment.appointment_date)}</span>
              </div>
            )}
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</span>
            </div>
          </div>
          
          {appointment.services.description && (
            <p className="text-sm text-muted-foreground">{appointment.services.description}</p>
          )}
          
          {appointment.notes && (
            <p className="text-sm bg-muted p-2 rounded">
              <strong>Notes:</strong> {appointment.notes}
            </p>
          )}
        </div>
        
        {canManage && (
          <div className="flex flex-col space-y-2 ml-4">
            {appointment.status === 'pending' && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => onStatusUpdate(appointment.id, 'confirmed')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, 'cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
            
            {appointment.status === 'confirmed' && (
              <div className="flex space-x-2">
                <Button 
                  size="sm" 
                  onClick={() => onStatusUpdate(appointment.id, 'completed')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onStatusUpdate(appointment.id, 'cancelled')}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
            
            {(appointment.status === 'pending' || appointment.status === 'confirmed') && (
              <Button 
                size="sm" 
                variant="ghost"
                className="text-primary hover:text-primary/80"
                onClick={() => onEdit(appointment)}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Appointment
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDashboard;