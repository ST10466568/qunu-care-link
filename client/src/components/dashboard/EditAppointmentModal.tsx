import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
// import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Appointment {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  booking_type: string;
  notes?: string;
  staff_id?: string;
  doctor_id?: string;
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

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  staff_number: string;
}

interface EditAppointmentModalProps {
  appointment: Appointment | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

const EditAppointmentModal: React.FC<EditAppointmentModalProps> = ({
  appointment,
  isOpen,
  onClose,
  onUpdate
}) => {
  const [formData, setFormData] = useState({
    appointment_date: '',
    start_time: '',
    end_time: '',
    notes: '',
    status: '',
    doctor_id: ''
  });
  const [date, setDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (appointment) {
      setFormData({
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        notes: appointment.notes || '',
        status: appointment.status,
        doctor_id: appointment.doctor_id || ''
      });
      setDate(new Date(appointment.appointment_date));
    }
  }, [appointment]);

  useEffect(() => {
    if (date) {
      fetchAvailableDoctors(format(date, 'yyyy-MM-dd'));
    }
  }, [date]);

  const fetchAvailableDoctors = async (selectedDate: string) => {
    setLoadingDoctors(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/staff', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const staffData = await response.json();
        const doctors = staffData
          .filter((staff: any) => staff.role === 'doctor' && staff.isActive)
          .map((staff: any) => ({
            id: staff.id,
            first_name: staff.firstName,
            last_name: staff.lastName,
            staff_number: staff.staffNumber
          }));
        
        setAvailableDoctors(doctors || []);
      } else {
        throw new Error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load available doctors",
        variant: "destructive",
      });
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointment) return;

    // Comprehensive validation
    const appointmentDate = date ? format(date, 'yyyy-MM-dd') : formData.appointment_date;
    
    if (!appointmentDate) {
      toast({
        title: "Date Required",
        description: "Please select an appointment date",
        variant: "destructive",
      });
      return;
    }

    if (!formData.start_time) {
      toast({
        title: "Start Time Required",
        description: "Please enter a start time",
        variant: "destructive",
      });
      return;
    }

    if (!formData.end_time) {
      toast({
        title: "End Time Required", 
        description: "Please enter an end time",
        variant: "destructive",
      });
      return;
    }

    if (!formData.status) {
      toast({
        title: "Status Required",
        description: "Please select an appointment status",
        variant: "destructive",
      });
      return;
    }

    // Validate time logic
    const [startHour, startMin] = formData.start_time.split(':').map(Number);
    const [endHour, endMin] = formData.end_time.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast({
        title: "Invalid Time Range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }

    // Check if date is not too far in the past (allow some flexibility for staff)
    const selectedDate = new Date(appointmentDate);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    if (selectedDate < oneMonthAgo) {
      toast({
        title: "Invalid Date",
        description: "Cannot schedule appointments more than one month in the past",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        appointment_date: appointmentDate,
        start_time: formData.start_time,
        end_time: formData.end_time,
        notes: formData.notes.trim() || null,
        status: formData.status,
        doctor_id: formData.doctor_id || null
      };

      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`http://localhost:5001/api/appointments/${appointment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentDate: appointmentDate,
          startTime: formData.start_time,
          endTime: formData.end_time,
          notes: formData.notes.trim() || '',
          status: formData.status
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to update appointment";
        
        if (response.status === 409) {
          errorMessage = "This appointment time conflicts with another existing appointment";
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = "You don't have permission to update this appointment";
        } else if (response.status === 400) {
          errorMessage = "Invalid appointment data. Please check all fields";
        }
        
        toast({
          title: "Update Failed",
          description: errorMessage,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Appointment Updated",
          description: `Appointment successfully updated for ${format(new Date(appointmentDate), 'PPP')} at ${formData.start_time.slice(0, 5)}`,
        });
        onUpdate();
        onClose();
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred while updating the appointment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!appointment) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Appointment</DialogTitle>
          <DialogDescription>
            Update appointment details for {appointment.patients.first_name} {appointment.patients.last_name}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service">Service</Label>
            <Input
              id="service"
              value={appointment.services.name}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="patient">Patient</Label>
            <Input
              id="patient"
              value={`${appointment.patients.first_name} ${appointment.patients.last_name}`}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="doctor">Doctor</Label>
            <Select 
              value={formData.doctor_id} 
              onValueChange={(value) => setFormData({ ...formData, doctor_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  loadingDoctors 
                    ? "Loading doctors..." 
                    : availableDoctors.length === 0 
                      ? "No doctors available for this date"
                      : "Select a doctor"
                } />
              </SelectTrigger>
              <SelectContent>
                {availableDoctors.map((doctor) => (
                  <SelectItem key={doctor.id} value={doctor.id}>
                    Dr. {doctor.first_name} {doctor.last_name}
                    {doctor.staff_number && ` (${doctor.staff_number})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any notes about this appointment..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Appointment'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAppointmentModal;