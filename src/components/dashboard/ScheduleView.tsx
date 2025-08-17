import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Schedule {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  services: {
    name: string;
  };
  patients: {
    first_name: string;
    last_name: string;
  };
}

interface ScheduleViewProps {
  staff: Staff;
  onBack: () => void;
}

const ScheduleView: React.FC<ScheduleViewProps> = ({ staff, onBack }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchScheduleData();
  }, [staff.id, currentWeek]);

  const fetchScheduleData = async () => {
    try {
      // Fetch staff schedules
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('staff_schedules')
        .select('*')
        .eq('staff_id', staff.id)
        .eq('is_active', true);

      if (scheduleError) {
        console.error('Error fetching schedules:', scheduleError);
        toast({
          title: "Error",
          description: "Failed to load schedule",
          variant: "destructive",
        });
      } else {
        setSchedules(scheduleData || []);
      }

      // Fetch appointments for the current week
      const weekStart = getWeekStart(currentWeek);
      const weekEnd = getWeekEnd(currentWeek);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name),
          patients:patient_id (first_name, last_name)
        `)
        .eq('staff_id', staff.id)
        .gte('appointment_date', weekStart.toISOString().split('T')[0])
        .lte('appointment_date', weekEnd.toISOString().split('T')[0])
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      const { data: appointmentData, error: appointmentError } = await query;

      if (appointmentError) {
        console.error('Error fetching appointments:', appointmentError);
        toast({
          title: "Error",
          description: "Failed to load appointments",
          variant: "destructive",
        });
      } else {
        setAppointments(appointmentData || []);
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const start = getWeekStart(date);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-ZA', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeek(newWeek);
  };

  const getAppointmentsForDay = (dayOfWeek: number, date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.appointment_date === dateString
    );
  };

  const getScheduleForDay = (dayOfWeek: number) => {
    return schedules.find(schedule => schedule.day_of_week === dayOfWeek);
  };

  const renderWeekView = () => {
    const weekStart = getWeekStart(currentWeek);
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dayOfWeek = date.getDay();
      const schedule = getScheduleForDay(dayOfWeek);
      const dayAppointments = getAppointmentsForDay(dayOfWeek, date);

      days.push(
        <div key={i} className="border rounded-lg p-4 min-h-[300px]">
          <div className="font-medium mb-2">
            {dayNames[dayOfWeek]}
            <div className="text-sm text-muted-foreground">
              {date.toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
            </div>
          </div>

          {schedule ? (
            <div className="mb-4">
              <div className="text-sm text-muted-foreground mb-2">
                Working Hours: {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
              </div>
              
              <div className="space-y-2">
                {dayAppointments.length === 0 ? (
                  <div className="text-sm text-muted-foreground italic">No appointments</div>
                ) : (
                  dayAppointments.map(appointment => (
                    <div key={appointment.id} className="p-2 border rounded text-sm">
                      <div className="font-medium">{appointment.services.name}</div>
                      <div className="text-muted-foreground">
                        {appointment.patients.first_name} {appointment.patients.last_name}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="flex items-center text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}
                        </span>
                        <Badge className={`text-xs ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground italic">Not scheduled</div>
          )}
        </div>
      );
    }

    return days;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading schedule...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Schedule - Dr. {staff.first_name} {staff.last_name}</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" size="sm" onClick={() => navigateWeek('prev')}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous Week
            </Button>
            
            <h3 className="text-lg font-medium">
              Week of {getWeekStart(currentWeek).toLocaleDateString('en-ZA', { 
                month: 'long', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </h3>
            
            <Button variant="outline" size="sm" onClick={() => navigateWeek('next')}>
              Next Week
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
            {renderWeekView()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScheduleView;