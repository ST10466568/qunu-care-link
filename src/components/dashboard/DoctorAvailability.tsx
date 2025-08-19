import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Doctor {
  id: string;
  first_name: string;
  last_name: string;
  staff_number: string;
}

interface AvailabilityRecord {
  id: string;
  staff_id: string;
  availability_date: string;
  is_available: boolean;
  doctor_name?: string;
}

interface DoctorAvailabilityProps {
  currentUser: {
    role: string;
    staff_id?: string;
  };
}

const DoctorAvailability: React.FC<DoctorAvailabilityProps> = ({ currentUser }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availabilityRecords, setAvailabilityRecords] = useState<AvailabilityRecord[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isAdmin = currentUser.role === 'admin';
  const isDoctor = currentUser.role === 'doctor';

  useEffect(() => {
    fetchDoctors();
    fetchAvailabilityRecords();
  }, []);

  // Auto-select current doctor if user is a doctor
  useEffect(() => {
    if (isDoctor && currentUser.staff_id && doctors.length > 0) {
      const currentDoctor = doctors.find(doc => doc.id === currentUser.staff_id);
      if (currentDoctor) {
        setSelectedDoctor(currentDoctor.id);
      }
    }
  }, [isDoctor, currentUser.staff_id, doctors]);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, first_name, last_name, staff_number')
        .eq('role', 'doctor')
        .eq('is_active', true)
        .order('first_name, last_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast({
        title: "Error",
        description: "Failed to load doctors",
        variant: "destructive",
      });
    }
  };

  const fetchAvailabilityRecords = async () => {
    try {
      const { data: availabilityData, error } = await supabase
        .from('staff_availability')
        .select('id, staff_id, availability_date, is_available')
        .gte('availability_date', new Date().toISOString().split('T')[0])
        .order('availability_date', { ascending: false });

      if (error) throw error;
      
      // Get staff information for each record
      const recordsWithNames = await Promise.all(
        (availabilityData || []).map(async (record) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('first_name, last_name')
            .eq('id', record.staff_id)
            .single();
          
          return {
            ...record,
            doctor_name: staffData 
              ? `Dr. ${staffData.first_name} ${staffData.last_name}` 
              : 'Unknown Doctor'
          };
        })
      );
      
      setAvailabilityRecords(recordsWithNames);
    } catch (error) {
      console.error('Error fetching availability records:', error);
      toast({
        title: "Error",
        description: "Failed to load availability records",
        variant: "destructive",
      });
    }
  };

  const handleSetAvailability = async () => {
    if (!selectedDoctor || !selectedDate) {
      toast({
        title: "Missing Information",
        description: "Please select a doctor and date",
        variant: "destructive",
      });
      return;
    }

    // Check permissions
    if (isDoctor && selectedDoctor !== currentUser.staff_id) {
      toast({
        title: "Permission Denied",
        description: "You can only manage your own availability",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if record already exists
      const { data: existingRecord } = await supabase
        .from('staff_availability')
        .select('id')
        .eq('staff_id', selectedDoctor)
        .eq('availability_date', selectedDate)
        .maybeSingle();

      if (existingRecord) {
        // Update existing record
        const { error } = await supabase
          .from('staff_availability')
          .update({ is_available: isAvailable })
          .eq('id', existingRecord.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('staff_availability')
          .insert({
            staff_id: selectedDoctor,
            availability_date: selectedDate,
            is_available: isAvailable
          });

        if (error) throw error;
      }

      const doctorName = doctors.find(doc => doc.id === selectedDoctor);
      toast({
        title: "Success",
        description: `Availability updated for Dr. ${doctorName?.first_name} ${doctorName?.last_name} on ${new Date(selectedDate).toLocaleDateString()}`,
      });

      // Refresh records
      fetchAvailabilityRecords();
      
      // Reset form
      setSelectedDate('');
      if (isAdmin) {
        setSelectedDoctor('');
      }
      setIsAvailable(true);
    } catch (error) {
      console.error('Error setting availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNext30Days = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      });
    }
    
    return dates;
  };

  const filteredRecords = availabilityRecords.filter(record => 
    !selectedDoctor || record.staff_id === selectedDoctor
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Manage Doctor Availability
          </CardTitle>
          <CardDescription>
            {isDoctor 
              ? "Set your availability for upcoming dates"
              : "Manage doctor availability for appointments"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Doctor Selection (only for admin) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label>Select Doctor</Label>
              <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((doctor) => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      Dr. {doctor.first_name} {doctor.last_name}
                      {doctor.staff_number && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({doctor.staff_number})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Selection */}
          <div className="space-y-2">
            <Label>Select Date</Label>
            <Select value={selectedDate} onValueChange={setSelectedDate}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a date" />
              </SelectTrigger>
              <SelectContent>
                {getNext30Days().map((date) => (
                  <SelectItem key={date.value} value={date.value}>
                    {date.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Availability Toggle */}
          <div className="flex items-center space-x-4">
            <Label htmlFor="availability">Available for appointments</Label>
            <Switch
              id="availability"
              checked={isAvailable}
              onCheckedChange={setIsAvailable}
            />
            <Badge variant={isAvailable ? "default" : "secondary"}>
              {isAvailable ? "On Duty" : "Off Duty"}
            </Badge>
          </div>

          {/* Set Button */}
          <Button 
            onClick={handleSetAvailability}
            disabled={!selectedDoctor || !selectedDate || loading}
            className="w-full"
          >
            {loading ? "Updating..." : "Set Availability"}
          </Button>
        </CardContent>
      </Card>

      {/* Availability Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Availability
          </CardTitle>
          <CardDescription>
            Current availability settings for the next 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No availability records found</p>
              <p className="text-sm">
                Doctors are available by default unless marked as off duty
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">
                        {new Date(record.availability_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      {isAdmin && (
                        <p className="text-sm text-muted-foreground">
                          {record.doctor_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={record.is_available ? "default" : "secondary"}>
                    {record.is_available ? "On Duty" : "Off Duty"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DoctorAvailability;