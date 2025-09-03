import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
}

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  staff_number: string;
}

interface WalkInPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentStaff: Staff;
}

const WalkInPatientModal: React.FC<WalkInPatientModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentStaff
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<Array<{appointment_date: string, start_time: string, end_time: string, status: string}>>([]);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    serviceId: '',
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchTimeSlots();
      fetchExistingAppointments();
      // Set default appointment date to today
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        appointmentDate: now.toISOString().split('T')[0],
        appointmentTime: ''
      }));
    }
  }, [isOpen]);

  // Fetch existing appointments when date changes
  useEffect(() => {
    if (formData.appointmentDate) {
      fetchExistingAppointments();
      fetchAvailableDoctors();
    }
  }, [formData.appointmentDate]);

  // Reset appointment time when service or doctor changes
  useEffect(() => {
    if (formData.serviceId || formData.doctorId) {
      setFormData(prev => ({
        ...prev,
        appointmentTime: ''
      }));
    }
  }, [formData.serviceId, formData.doctorId, formData.appointmentDate]);

  const fetchTimeSlots = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/timeslots', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTimeSlots(data.map((slot: any) => ({
          id: slot.id,
          day_of_week: slot.dayOfWeek,
          start_time: slot.startTime,
          end_time: slot.endTime
        })) || []);
      } else {
        throw new Error('Failed to fetch time slots');
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    }
  };

  const fetchExistingAppointments = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('http://localhost:5001/api/appointments', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const appointments = data
          .filter((apt: any) => apt.status !== 'cancelled')
          .map((apt: any) => ({
            appointment_date: apt.appointmentDate,
            start_time: apt.startTime,
            end_time: apt.endTime,
            status: apt.status
          }));
        setExistingAppointments(appointments || []);
      }
    } catch (error) {
      console.error('Error fetching existing appointments:', error);
    }
  };

  const fetchAvailableDoctors = async () => {
    if (!formData.appointmentDate) return;
    
    try {
      const { data, error } = await supabase.rpc('get_available_doctors_for_date', {
        check_date: formData.appointmentDate
      });

      if (error) throw error;
      console.log('Available doctors for', formData.appointmentDate, ':', data);
      setAvailableDoctors(data || []);
      
      // Reset selected doctor if not available on this date
      if (formData.doctorId && !data?.some((doc: Doctor) => doc.id === formData.doctorId)) {
        setFormData(prev => ({ ...prev, doctorId: '' }));
        toast({
          title: "Doctor Unavailable",
          description: "The selected doctor is not available on this date. Please choose another.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching available doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load available doctors for this date",
        variant: "destructive",
      });
      setAvailableDoctors([]);
    }
  };

  const getAvailableTimeSlotsForDate = () => {
    if (!formData.appointmentDate) return [];
    
    const selectedDate = new Date(formData.appointmentDate);
    const dayOfWeek = selectedDate.getDay();
    
    const selectedService = services.find(s => s.id === formData.serviceId);
    const serviceDuration = selectedService?.duration_minutes || 30;
    
    // Get all time slots for this day
    const daySlots = timeSlots.filter(slot => slot.day_of_week === dayOfWeek);
    
    if (daySlots.length === 0) return [];
    
    // Find the latest end time for the day (overall business hours)
    const latestEndTime = daySlots.reduce((latest, slot) => {
      const [endHour, endMin] = slot.end_time.split(':').map(Number);
      const endMinutes = endHour * 60 + endMin;
      const [latestHour, latestMin] = latest.split(':').map(Number);
      const latestMinutes = latestHour * 60 + latestMin;
      return endMinutes > latestMinutes ? slot.end_time : latest;
    }, '00:00');
    
    const [maxHour, maxMin] = latestEndTime.split(':').map(Number);
    const maxMinutesInDay = maxHour * 60 + maxMin;
    
    // Get existing appointments for the selected date to check availability
    const dateString = formData.appointmentDate;
    const existingAppointmentsForDate = existingAppointments.filter(
      apt => apt.appointment_date === dateString && apt.status !== 'cancelled'
    );
    
    // Filter slots for availability and business hours
    const filteredSlots = daySlots.filter(slot => {
      const [slotStartHour, slotStartMin] = slot.start_time.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const serviceEndMinutes = slotStartMinutes + serviceDuration;
      
      // Service must end before or at the end of business hours
      if (serviceEndMinutes > maxMinutesInDay) return false;
      
      // Calculate the actual end time for this service booking
      const endHour = Math.floor(serviceEndMinutes / 60);
      const endMin = serviceEndMinutes % 60;
      const actualEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
      
      // Check if this time slot conflicts with any existing appointments
      const hasConflict = existingAppointmentsForDate.some(apt => {
        const aptStart = timeToMinutes(apt.start_time);
        const aptEnd = timeToMinutes(apt.end_time);
        const newStart = timeToMinutes(slot.start_time);
        const newEnd = timeToMinutes(actualEndTime);
        
        // Overlap occurs if: new_start < existing_end AND new_end > existing_start
        return newStart < aptEnd && newEnd > aptStart;
      });
      
      return !hasConflict;
    });
    
    // Remove duplicates by start_time and ensure unique keys
    const uniqueSlots = filteredSlots.reduce((unique, slot) => {
      const existingSlot = unique.find(s => s.start_time === slot.start_time);
      if (!existingSlot) {
        unique.push(slot);
      }
      return unique;
    }, [] as TimeSlot[]);
    
    return uniqueSlots;
  };

  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const fetchServices = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/services');
      
      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }
      
      const data = await response.json();
      // Clear existing services before setting new ones to prevent duplicates
      setServices([]);
      setServices(data.map((service: any) => ({
        id: service.id,
        name: service.name,
        duration_minutes: service.durationMinutes
      })) || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Comprehensive field validation with specific messages
    if (!formData.firstName.trim()) {
      toast({
        title: "First Name Required",
        description: "Please enter the patient's first name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.lastName.trim()) {
      toast({
        title: "Last Name Required", 
        description: "Please enter the patient's last name",
        variant: "destructive",
      });
      return;
    }

    if (!formData.phone.trim()) {
      toast({
        title: "Phone Number Required",
        description: "Please enter the patient's phone number",
        variant: "destructive",
      });
      return;
    }

    // Basic phone validation
    const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
    if (!phoneRegex.test(formData.phone.trim())) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid phone number (at least 10 digits)",
        variant: "destructive",
      });
      return;
    }

    // Email validation if provided
    if (formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address or leave it empty",
          variant: "destructive",
        });
        return;
      }
    }

    if (!formData.serviceId) {
      toast({
        title: "Service Required",
        description: "Please select a service for the appointment",
        variant: "destructive",
      });
      return;
    }

    if (!formData.doctorId) {
      toast({
        title: "Doctor Required",
        description: "Please select a doctor for the appointment",
        variant: "destructive",
      });
      return;
    }

    if (!formData.appointmentDate) {
      toast({
        title: "Date Required",
        description: "Please select an appointment date", 
        variant: "destructive",
      });
      return;
    }

    if (!formData.appointmentTime) {
      toast({
        title: "Time Required",
        description: "Please select an appointment time",
        variant: "destructive",
      });
      return;
    }

    // Date validation
    const appointmentDate = new Date(formData.appointmentDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (appointmentDate < today) {
      toast({
        title: "Invalid Date",
        description: "Appointment date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, create or find the patient
      let patientId;
      
      // Check if patient already exists by phone (use maybeSingle to avoid errors)
      const { data: existingPatient, error: patientLookupError } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', formData.phone)
        .maybeSingle();

      if (patientLookupError) {
        console.error('Patient lookup error:', patientLookupError);
        throw new Error('Failed to check existing patient');
      }

      if (existingPatient) {
        patientId = existingPatient.id;
      } else {
        // Create new patient
        const { data: newPatient, error: patientError } = await supabase
          .from('patients')
          .insert({
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            email: formData.email || null,
            user_id: null // Walk-in patients don't have user accounts
          })
          .select('id')
          .single();

        if (patientError) throw patientError;
        patientId = newPatient.id;
      }

      // Get service duration and validate time slot
      const selectedService = services.find(s => s.id === formData.serviceId);
      const duration = selectedService?.duration_minutes || 30;
      
      // Calculate end time based on service duration
      const [hours, minutes] = formData.appointmentTime.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const calculatedEndTime = endTime.toTimeString().slice(0, 5);
      
      // Check for overlapping appointments
      const { data: overlappingAppointments, error: overlapError } = await supabase
        .from('appointments')
        .select('start_time, end_time')
        .eq('appointment_date', formData.appointmentDate)
        .neq('status', 'cancelled');
      
      if (overlapError) {
        console.error('Error checking overlapping appointments:', overlapError);
        throw new Error('Failed to validate appointment time');
      }
      
      // Check if the new appointment overlaps with any existing ones
      const hasOverlap = overlappingAppointments?.some(apt => {
        const aptStart = timeToMinutes(apt.start_time);
        const aptEnd = timeToMinutes(apt.end_time);
        const newStart = timeToMinutes(formData.appointmentTime);
        const newEnd = timeToMinutes(calculatedEndTime);
        
        // Overlap occurs if: new_start < existing_end AND new_end > existing_start
        return newStart < aptEnd && newEnd > aptStart;
      });
      
      if (hasOverlap) {
        toast({
          title: "Error",
          description: "This appointment time overlaps with an existing appointment. Please select a different time.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Find the selected time slot to validate business hours
      const availableSlots = getAvailableTimeSlotsForDate();
      const selectedTimeSlot = availableSlots.find(slot => slot.start_time === formData.appointmentTime);
      
      if (!selectedTimeSlot) {
        toast({
          title: "Error",
          description: "Selected time is not available for the chosen date",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          service_id: formData.serviceId,
          doctor_id: formData.doctorId,
          staff_id: currentStaff.id,
          appointment_date: formData.appointmentDate,
          start_time: formData.appointmentTime,
          end_time: calculatedEndTime,
          status: 'pending',
          booking_type: 'walk_in',
          notes: formData.notes || null
        });

      if (appointmentError) throw appointmentError;

      const isToday = formData.appointmentDate === new Date().toISOString().split('T')[0];
      toast({
        title: "Success",
        description: isToday ? "Walk-in patient appointment created successfully" : "Future appointment scheduled successfully",
      });
      
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        serviceId: '',
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);
      
      let errorMessage = "Failed to create walk-in appointment";
      if (error instanceof Error) {
        console.error('Detailed error:', error.message);
        // Provide more specific error messages
        if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
          errorMessage = "An appointment at this time already exists";
        } else if (error.message.includes('foreign key') || error.message.includes('invalid')) {
          errorMessage = "Invalid data provided. Please check all fields.";
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = "Permission denied. Please contact administrator.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Walk-in Patient</DialogTitle>
          <DialogDescription>
            Register a walk-in patient and schedule an appointment for today or future dates
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Service *</Label>
            <Select
              value={formData.serviceId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} ({service.duration_minutes} min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Doctor Selection */}
          {formData.appointmentDate && (
            <div className="space-y-2">
              <Label htmlFor="doctor">Doctor *</Label>
              {availableDoctors.length === 0 ? (
                <div className="p-4 bg-muted rounded-md text-center text-muted-foreground text-sm">
                  <User className="h-6 w-6 mx-auto mb-2" />
                  <p className="font-medium">No doctors available</p>
                  <p>No doctors are on duty for {new Date(formData.appointmentDate).toLocaleDateString()}</p>
                  <p className="text-xs mt-1">Please select a different date</p>
                </div>
              ) : (
                <>
                  <Select
                    value={formData.doctorId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, doctorId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select the attending doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDoctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id}>
                          <div className="flex flex-col">
                            <span>Dr. {doctor.first_name} {doctor.last_name}</span>
                            {doctor.staff_number && (
                              <span className="text-xs text-muted-foreground">
                                Staff No: {doctor.staff_number}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {availableDoctors.length} doctor{availableDoctors.length > 1 ? 's' : ''} available on {new Date(formData.appointmentDate).toLocaleDateString()}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appointmentDate">Appointment Date *</Label>
              <Input
                id="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={(e) => setFormData(prev => ({ ...prev, appointmentDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="appointmentTime">Appointment Time *</Label>
              <Select
                value={formData.appointmentTime}
                onValueChange={(value) => setFormData(prev => ({ ...prev, appointmentTime: value }))}
                disabled={!formData.serviceId || !formData.doctorId || getAvailableTimeSlotsForDate().length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !formData.serviceId 
                      ? "Select a service first" 
                      : !formData.doctorId
                      ? "Select a doctor first"
                      : getAvailableTimeSlotsForDate().length === 0 
                      ? "No available times for this service duration" 
                      : "Select time"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTimeSlotsForDate().map((slot, index) => {
                    const selectedService = services.find(s => s.id === formData.serviceId);
                    const serviceDuration = selectedService?.duration_minutes || 30;
                    
                    // Calculate service end time for display
                    const [startHour, startMin] = slot.start_time.split(':').map(Number);
                    const startMinutes = startHour * 60 + startMin;
                    const endMinutes = startMinutes + serviceDuration;
                    const endHour = Math.floor(endMinutes / 60);
                    const endMin = endMinutes % 60;
                    const serviceEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
                    
                    return (
                      <SelectItem key={`${slot.start_time}-${index}`} value={slot.start_time}>
                        {slot.start_time.slice(0, 5)} - {serviceEndTime} ({serviceDuration} min)
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional notes or remarks..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Appointment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WalkInPatientModal;