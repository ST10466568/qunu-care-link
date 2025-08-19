import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Service {
  id: string;
  name: string;
  description: string;
  duration_minutes: number;
}

interface TimeSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ExistingAppointment {
  appointment_date: string;
  start_time: string;
  end_time: string;
}

interface BookAppointmentProps {
  patientId: string;
  onBookingComplete: () => void;
}

const BookAppointment = ({ patientId, onBookingComplete }: BookAppointmentProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [existingAppointments, setExistingAppointments] = useState<ExistingAppointment[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchServices();
    fetchTimeSlots();
    fetchExistingAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchExistingAppointments();
    }
  }, [selectedDate]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, description, duration_minutes')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } else {
      // Clear existing services before setting new ones to prevent duplicates
      setServices([]);
      setServices(data || []);
    }
  };

  const fetchTimeSlots = async () => {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('is_active', true)
      .order('day_of_week, start_time');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load time slots",
        variant: "destructive",
      });
    } else {
      setTimeSlots(data || []);
    }
  };

  const fetchExistingAppointments = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_date, start_time, end_time')
      .neq('status', 'cancelled');

    if (error) {
      console.error('Error fetching existing appointments:', error);
    } else {
      setExistingAppointments(data || []);
    }
  };

  const isTimeSlotAvailable = (date: string, startTime: string, endTime: string) => {
    return !existingAppointments.some(apt => 
      apt.appointment_date === date && 
      apt.start_time === startTime && 
      apt.end_time === endTime
    );
  };

  const getNextAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayOfWeek = date.getDay();
      
      // Check if we have time slots for this day
      const hasSlots = timeSlots.some(slot => slot.day_of_week === dayOfWeek);
      if (hasSlots) {
        dates.push({
          value: date.toISOString().split('T')[0],
          label: `${daysOfWeek[dayOfWeek]}, ${date.toLocaleDateString()}`,
          dayOfWeek
        });
      }
    }
    
    return dates;
  };

  const getAvailableTimeSlotsForDate = () => {
    if (!selectedDate || !selectedService) return [];
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    const selectedServiceData = services.find(service => service.id === selectedService);
    const serviceDuration = selectedServiceData?.duration_minutes || 30;
    
    const slotsForDay = timeSlots.filter(slot => slot.day_of_week === dayOfWeek);
    
    // Filter slots that can accommodate the full service duration and aren't already booked
    return slotsForDay.filter(slot => {
      // Check if the service can be completed within this time slot
      const [slotStartHour, slotStartMin] = slot.start_time.split(':').map(Number);
      const [slotEndHour, slotEndMin] = slot.end_time.split(':').map(Number);
      
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const slotEndMinutes = slotEndHour * 60 + slotEndMin;
      const serviceEndMinutes = slotStartMinutes + serviceDuration;
      
      // Service must end before or at the slot end time and slot must be available
      return serviceEndMinutes <= slotEndMinutes && 
             isTimeSlotAvailable(selectedDate, slot.start_time, slot.end_time);
    });
  };

  const handleBookAppointment = async () => {
    if (!selectedService || !selectedDate || !selectedTimeSlot) {
      toast({
        title: "Missing Information",
        description: "Please select a service, date, and time slot",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const timeSlot = timeSlots.find(slot => slot.id === selectedTimeSlot);
    if (!timeSlot) return;

    const { error } = await supabase
      .from('appointments')
      .insert({
        patient_id: patientId,
        service_id: selectedService,
        appointment_date: selectedDate,
        start_time: timeSlot.start_time,
        end_time: timeSlot.end_time,
        status: 'pending',
        booking_type: 'online'
      });

    setLoading(false);

    if (error) {
      toast({
        title: "Booking Failed",
        description: "Failed to book appointment. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Appointment Booked",
        description: "Your appointment has been successfully booked!",
      });
      
      // Reset form
      setSelectedService('');
      setSelectedDate('');
      setSelectedTimeSlot('');
      
      onBookingComplete();
    }
  };

  const selectedServiceData = services.find(service => service.id === selectedService);
  const availableDates = getNextAvailableDates();
  const availableTimeSlots = getAvailableTimeSlotsForDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book New Appointment
        </CardTitle>
        <CardDescription>
          Select a service, date, and time for your appointment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Service Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Service</label>
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a service" />
            </SelectTrigger>
            <SelectContent>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  <div className="flex flex-col">
                    <span>{service.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {service.duration_minutes} minutes
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedServiceData && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">{selectedServiceData.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{selectedServiceData.duration_minutes} minutes</span>
              </div>
            </div>
          )}
        </div>

        {/* Date Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Select Date</label>
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a date" />
            </SelectTrigger>
            <SelectContent>
              {availableDates.map((date) => (
                <SelectItem key={date.value} value={date.value}>
                  {date.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time Slot Selection */}
        {selectedDate && selectedService && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Time</label>
            {availableTimeSlots.length === 0 ? (
              <div className="p-4 bg-muted rounded-md text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2" />
                <p>No available time slots for this date</p>
                <p className="text-sm">Please select a different date or check business hours</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableTimeSlots.map((slot) => {
                  const serviceDuration = selectedServiceData?.duration_minutes || 30;
                  
                  // Calculate service end time for display
                  const [startHour, startMin] = slot.start_time.split(':').map(Number);
                  const startMinutes = startHour * 60 + startMin;
                  const endMinutes = startMinutes + serviceDuration;
                  const endHour = Math.floor(endMinutes / 60);
                  const endMin = endMinutes % 60;
                  const serviceEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;
                  
                  return (
                    <Button
                      key={slot.id}
                      variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedTimeSlot(slot.id)}
                      className="justify-center text-xs p-2"
                    >
                      <div className="flex flex-col">
                        <span>{slot.start_time.slice(0, 5)} - {serviceEndTime}</span>
                        <span className="text-xs opacity-75">({serviceDuration} min)</span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Booking Summary */}
        {selectedService && selectedDate && selectedTimeSlot && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-md">
            <h4 className="font-medium mb-2">Booking Summary</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Service:</strong> {selectedServiceData?.name}</p>
              <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
              <p><strong>Time:</strong> {availableTimeSlots.find(slot => slot.id === selectedTimeSlot)?.start_time.slice(0, 5)}</p>
              <p><strong>Duration:</strong> {selectedServiceData?.duration_minutes} minutes</p>
            </div>
          </div>
        )}

        {/* Book Button */}
        <Button 
          onClick={handleBookAppointment}
          disabled={!selectedService || !selectedDate || !selectedTimeSlot || loading}
          className="w-full"
        >
          {loading ? "Booking..." : "Book Appointment"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BookAppointment;