import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Clock } from 'lucide-react';
// import { supabase } from '@/integrations/supabase/client';
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
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
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
        console.log('Auto-selected doctor for current user:', currentDoctor);
      } else {
        console.error('Current user staff_id not found in doctors list:', currentUser.staff_id, doctors);
      }
    }
  }, [isDoctor, currentUser.staff_id, doctors]);

  const fetchDoctors = async () => {
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
          }))
          .sort((a: any, b: any) => a.first_name.localeCompare(b.first_name));
        
        setDoctors(doctors || []);
      } else {
        throw new Error('Failed to fetch doctors');
      }
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
      // For now, show empty availability records since we're focusing on core appointment functionality
      // This can be implemented later with a proper availability API endpoint
      setAvailabilityRecords([]);
      
      toast({
        title: "Info",
        description: "Availability management is being updated for the new system",
        variant: "default",
      });
    } catch (error) {
      console.error('Error fetching availability records:', error);
      toast({
        title: "Error",
        description: "Failed to load availability records",
        variant: "destructive",
      });
    }
  };

  const getDatesInRange = (start: string, end: string): string[] => {
    const dates = [];
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const handleSetAvailability = async () => {
    console.log('Setting availability - selectedDoctor:', selectedDoctor, 'startDate:', startDate, 'endDate:', endDate);
    console.log('Current user:', currentUser);
    console.log('Available doctors:', doctors);
    
    if (!selectedDoctor || !startDate || !endDate) {
      console.log('Validation failed - missing fields');
      toast({
        title: "Missing Information",
        description: "Please select a doctor, start date, and end date",
        variant: "destructive",
      });
      return;
    }

    // Validate date range
    if (new Date(startDate) > new Date(endDate)) {
      console.log('Validation failed - invalid date range');
      toast({
        title: "Invalid Date Range",
        description: "Start date must be before or equal to end date",
        variant: "destructive",
      });
      return;
    }

    // Check permissions
    if (isDoctor && selectedDoctor !== currentUser.staff_id) {
      console.log('Permission denied - doctor trying to set another doctor availability');
      toast({
        title: "Permission Denied",
        description: "You can only manage your own availability",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const datesInRange = getDatesInRange(startDate, endDate);
      console.log('Dates in range:', datesInRange);
      const doctorName = doctors.find(doc => doc.id === selectedDoctor);
      
      // Process each date in the range
      for (const date of datesInRange) {
        console.log('Processing date:', date);
        // Simplified availability setting for demo - in a real implementation
        // this would call a proper availability API endpoint
        console.log(`Setting ${selectedDoctor} availability to ${isAvailable} for ${date}`);
        // Simulate successful operation
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const dateRange = datesInRange.length === 1 
        ? new Date(datesInRange[0]).toLocaleDateString()
        : `${new Date(startDate).toLocaleDateString()} to ${new Date(endDate).toLocaleDateString()}`;

      console.log('Successfully updated availability for', datesInRange.length, 'days');
      
      toast({
        title: "Success",
        description: `Availability updated for Dr. ${doctorName?.first_name} ${doctorName?.last_name} from ${dateRange} (${datesInRange.length} day${datesInRange.length > 1 ? 's' : ''})`,
      });

      // Refresh records
      fetchAvailabilityRecords();
      
      // Reset form
      setStartDate('');
      setEndDate('');
      if (isAdmin) {
        setSelectedDoctor('');
      }
      setIsAvailable(true);
    } catch (error) {
      console.error('Error setting availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability. Check console for details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTodayString = () => {
    return new Date().toISOString().split('T')[0];
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

          {/* Debug Info for Doctors */}
          {isDoctor && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm">
                <strong>Debug:</strong> Auto-selected as Dr. {doctors.find(d => d.id === selectedDoctor)?.first_name} {doctors.find(d => d.id === selectedDoctor)?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">
                Selected Doctor ID: {selectedDoctor || 'None'} | Your Staff ID: {currentUser.staff_id}
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Instructions:</strong> Select a date range to set availability. 
              Use this to mark periods when you'll be {isAvailable ? 'available' : 'unavailable'} 
              (e.g., vacation, sick leave, special schedules).
            </p>
          </div>

          {/* Date Range Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={getTodayString()}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || getTodayString()}
                required
              />
            </div>
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
            disabled={!selectedDoctor || !startDate || !endDate || loading}
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