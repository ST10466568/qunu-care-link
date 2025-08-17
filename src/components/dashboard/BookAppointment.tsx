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

interface BookAppointmentProps {
  patientId: string;
  onBookingComplete: () => void;
}

const BookAppointment = ({ patientId, onBookingComplete }: BookAppointmentProps) => {
  const [services, setServices] = useState<Service[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  useEffect(() => {
    fetchServices();
    fetchTimeSlots();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load services",
        variant: "destructive",
      });
    } else {
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
    if (!selectedDate) return [];
    
    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    return timeSlots.filter(slot => slot.day_of_week === dayOfWeek);
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
        {selectedDate && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Time</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {availableTimeSlots.map((slot) => (
                <Button
                  key={slot.id}
                  variant={selectedTimeSlot === slot.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedTimeSlot(slot.id)}
                  className="justify-center"
                >
                  {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                </Button>
              ))}
            </div>
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