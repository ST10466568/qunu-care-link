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
    return !existingAppointments.some(apt => {
      if (apt.appointment_date !== date) return false;
      
      // Check for overlap: appointments overlap if one starts before the other ends
      const aptStart = timeToMinutes(apt.start_time);
      const aptEnd = timeToMinutes(apt.end_time);
      const newStart = timeToMinutes(startTime);
      const newEnd = timeToMinutes(endTime);
      
      // Overlap occurs if: new_start < existing_end AND new_end > existing_start
      return newStart < aptEnd && newEnd > aptStart;
    });
  };

  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
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
    
    // Filter slots where the service can be completed before business hours end and aren't already booked
    return daySlots.filter(slot => {
      const [slotStartHour, slotStartMin] = slot.start_time.split(':').map(Number);
      const slotStartMinutes = slotStartHour * 60 + slotStartMin;
      const serviceEndMinutes = slotStartMinutes + serviceDuration;
      
      // Service must end before or at the end of business hours and slot must be available
      return serviceEndMinutes <= maxMinutesInDay && 
             isTimeSlotAvailable(selectedDate, slot.start_time, slot.end_time);
    });
  };

  const handleBookAppointment = async () => {
    // Comprehensive validation with specific error messages
    if (!selectedService) {
      toast({
        title: "Service Required",
        description: "Please select a service before booking",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Date Required", 
        description: "Please select an appointment date",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTimeSlot) {
      toast({
        title: "Time Required",
        description: "Please select an available time slot",
        variant: "destructive",
      });
      return;
    }

    // Check if selected date is in the past
    const selectedDateObj = new Date(selectedDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDateObj < today) {
      toast({
        title: "Invalid Date",
        description: "Cannot book appointments for past dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const timeSlot = timeSlots.find(slot => slot.id === selectedTimeSlot);
      const selectedServiceData = services.find(service => service.id === selectedService);
      
      if (!timeSlot || !selectedServiceData) {
        throw new Error("Invalid service or time slot selection");
      }

      // Calculate end time based on service duration
      const [startHour, startMin] = timeSlot.start_time.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = startMinutes + selectedServiceData.duration_minutes;
      const endHour = Math.floor(endMinutes / 60);
      const endMin = endMinutes % 60;
      const serviceEndTime = `${endHour.toString().padStart(2, '0')}:${endMin.toString().padStart(2, '0')}`;

      // Double-check availability before booking
      if (!isTimeSlotAvailable(selectedDate, timeSlot.start_time, serviceEndTime)) {
        throw new Error("Time slot is no longer available");
      }

      const { error } = await supabase
        .from('appointments')
        .insert({
          patient_id: patientId,
          service_id: selectedService,
          appointment_date: selectedDate,
          start_time: timeSlot.start_time,
          end_time: serviceEndTime,
          status: 'pending',
          booking_type: 'online'
        });

      if (error) {
        // Provide specific error messages based on error type
        let errorMessage = "Failed to book appointment. Please try again.";
        
        if (error.message?.includes('overlaps')) {
          errorMessage = "This time slot is no longer available due to another booking.";
        } else if (error.message?.includes('permission') || error.message?.includes('policy')) {
          errorMessage = "You don't have permission to book appointments. Please ensure you're logged in.";
        } else if (error.message?.includes('foreign key') || error.message?.includes('invalid')) {
          errorMessage = "Invalid booking details. Please refresh and try again.";
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Appointment Booked Successfully",
        description: `Your ${selectedServiceData.name} appointment is scheduled for ${new Date(selectedDate).toLocaleDateString()} at ${timeSlot.start_time.slice(0, 5)}`,
      });
      
      // Reset form
      setSelectedService('');
      setSelectedDate('');
      setSelectedTimeSlot('');
      
      onBookingComplete();
      
    } catch (error) {
      console.error('Booking error:', error);
      toast({
        title: "Booking Failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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