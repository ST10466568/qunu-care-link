import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    serviceId: '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchServices();
      fetchTimeSlots();
      // Set default appointment date to today
      const now = new Date();
      setFormData(prev => ({
        ...prev,
        appointmentDate: now.toISOString().split('T')[0],
        appointmentTime: ''
      }));
    }
  }, [isOpen]);

  const fetchTimeSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('time_slots')
        .select('*')
        .eq('is_active', true)
        .order('day_of_week, start_time');
      
      if (error) throw error;
      setTimeSlots(data || []);
    } catch (error) {
      console.error('Error fetching time slots:', error);
      toast({
        title: "Error",
        description: "Failed to load available time slots",
        variant: "destructive",
      });
    }
  };

  const getAvailableTimeSlotsForDate = () => {
    if (!formData.appointmentDate) return [];
    
    const selectedDate = new Date(formData.appointmentDate);
    const dayOfWeek = selectedDate.getDay();
    
    return timeSlots.filter(slot => slot.day_of_week === dayOfWeek);
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, duration_minutes')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      // Clear existing services before setting new ones to prevent duplicates
      setServices([]);
      setServices(data || []);
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
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.serviceId || !formData.appointmentDate || !formData.appointmentTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // First, create or find the patient
      let patientId;
      
      // Check if patient already exists by phone
      const { data: existingPatient } = await supabase
        .from('patients')
        .select('id')
        .eq('phone', formData.phone)
        .single();

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
      
      // Find the selected time slot to get the exact start and end times
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
      
      // Calculate end time based on service duration
      const [hours, minutes] = formData.appointmentTime.split(':').map(Number);
      const startTime = new Date();
      startTime.setHours(hours, minutes, 0, 0);
      const endTime = new Date(startTime.getTime() + duration * 60000);

      // Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          service_id: formData.serviceId,
          staff_id: currentStaff.id,
          appointment_date: formData.appointmentDate,
          start_time: formData.appointmentTime,
          end_time: endTime.toTimeString().slice(0, 5),
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
        appointmentDate: '',
        appointmentTime: '',
        notes: ''
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating walk-in appointment:', error);
      toast({
        title: "Error",
        description: "Failed to create walk-in appointment",
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
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableTimeSlotsForDate().length === 0 ? (
                    <SelectItem value="" disabled>
                      No business hours for selected date
                    </SelectItem>
                  ) : (
                    getAvailableTimeSlotsForDate().map((slot) => (
                      <SelectItem key={slot.id} value={slot.start_time}>
                        {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                      </SelectItem>
                    ))
                  )}
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