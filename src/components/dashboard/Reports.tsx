import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Download, FileText, BarChart3, TrendingUp, Users, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Staff {
  id: string;
  first_name: string;
  last_name: string;
  role: 'doctor' | 'nurse' | 'admin';
}

interface ReportData {
  appointments: any[];
  serviceStats: any[];
  monthlyStats: any[];
  noShowRates: any[];
}

interface ReportsProps {
  staff: Staff;
  onBack: () => void;
}

const Reports: React.FC<ReportsProps> = ({ staff, onBack }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<ReportData>({
    appointments: [],
    serviceStats: [],
    monthlyStats: [],
    noShowRates: []
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [selectedMonth]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch appointments for the selected month
      const monthStart = format(startOfMonth(selectedMonth), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(selectedMonth), 'yyyy-MM-dd');

      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select(`
          *,
          services:service_id (name, description),
          patients:patient_id (first_name, last_name, phone, patient_number),
          staff:staff_id (first_name, last_name, role)
        `)
        .gte('appointment_date', monthStart)
        .lte('appointment_date', monthEnd)
        .order('appointment_date', { ascending: true });

      if (appointmentsError) throw appointmentsError;

      // Calculate service statistics
      const serviceStats = appointments?.reduce((acc: any[], appointment) => {
        const serviceName = appointment.services?.name || 'Unknown Service';
        const existing = acc.find(s => s.service === serviceName);
        
        if (existing) {
          existing.total += 1;
          if (appointment.status === 'completed') existing.completed += 1;
          if (appointment.status === 'no_show') existing.no_shows += 1;
          if (appointment.status === 'cancelled') existing.cancelled += 1;
        } else {
          acc.push({
            service: serviceName,
            total: 1,
            completed: appointment.status === 'completed' ? 1 : 0,
            no_shows: appointment.status === 'no_show' ? 1 : 0,
            cancelled: appointment.status === 'cancelled' ? 1 : 0
          });
        }
        return acc;
      }, []) || [];

      // Calculate monthly statistics
      const monthlyStats = [
        {
          metric: 'Total Appointments',
          value: appointments?.length || 0,
          icon: Calendar
        },
        {
          metric: 'Completed',
          value: appointments?.filter(a => a.status === 'completed').length || 0,
          icon: Users
        },
        {
          metric: 'No Shows',
          value: appointments?.filter(a => a.status === 'no_show').length || 0,
          icon: Clock
        },
        {
          metric: 'Cancelled',
          value: appointments?.filter(a => a.status === 'cancelled').length || 0,
          icon: TrendingUp
        }
      ];

      // Calculate no-show rates by service
      const noShowRates = serviceStats.map(stat => ({
        service: stat.service,
        total: stat.total,
        no_shows: stat.no_shows,
        rate: stat.total > 0 ? ((stat.no_shows / stat.total) * 100).toFixed(1) : '0.0'
      }));

      setReportData({
        appointments: appointments || [],
        serviceStats,
        monthlyStats,
        noShowRates
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: "Error",
        description: "Failed to load report data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportDailyList = () => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dailyAppointments = reportData.appointments.filter(
      apt => apt.appointment_date === dateStr
    );

    const csvContent = [
      ['Time', 'Patient', 'Service', 'Staff', 'Status', 'Phone', 'Notes'].join(','),
      ...dailyAppointments.map(apt => [
        `${apt.start_time}-${apt.end_time}`,
        `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`,
        apt.services?.name || '',
        `${apt.staff?.first_name || ''} ${apt.staff?.last_name || ''}`,
        apt.status,
        apt.patients?.phone || '',
        `"${apt.notes || ''}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daily-appointments-${dateStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Daily list exported successfully",
    });
  };

  const exportMonthlyReport = () => {
    const monthStr = format(selectedMonth, 'yyyy-MM');
    
    const csvContent = [
      ['Service', 'Total Appointments', 'Completed', 'No Shows', 'Cancelled', 'No Show Rate (%)'].join(','),
      ...reportData.serviceStats.map(stat => [
        stat.service,
        stat.total,
        stat.completed,
        stat.no_shows,
        stat.cancelled,
        stat.total > 0 ? ((stat.no_shows / stat.total) * 100).toFixed(1) : '0.0'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `monthly-report-${monthStr}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Monthly report exported successfully",
    });
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

  const dailyAppointments = reportData.appointments.filter(
    apt => apt.appointment_date === format(selectedDate, 'yyyy-MM-dd')
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="outline" onClick={onBack} className="mb-4">
            ← Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Generate and export appointment reports and statistics
          </p>
        </div>
      </div>

      {/* Month Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Report Period</CardTitle>
          <CardDescription>Select the month for which you want to generate reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedMonth, "MMMM yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedMonth}
                onSelect={(date) => date && setSelectedMonth(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </CardContent>
      </Card>

      {/* Reports Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="daily">Daily Lists</TabsTrigger>
          <TabsTrigger value="services">Service Usage</TabsTrigger>
          <TabsTrigger value="no-shows">No-Show Rates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {reportData.monthlyStats.map((stat, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.metric}</CardTitle>
                  <stat.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
              <CardDescription>
                Overview for {format(selectedMonth, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button onClick={exportMonthlyReport} className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Monthly Report (CSV)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Appointment Lists</CardTitle>
              <CardDescription>
                Select a date to view and export daily appointments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Button onClick={exportDailyList}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Daily List
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Staff</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyAppointments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No appointments for this date
                        </TableCell>
                      </TableRow>
                    ) : (
                      dailyAppointments.map((appointment) => (
                        <TableRow key={appointment.id}>
                          <TableCell className="font-medium">
                            {appointment.start_time} - {appointment.end_time}
                          </TableCell>
                          <TableCell>
                            {appointment.patients?.first_name} {appointment.patients?.last_name}
                          </TableCell>
                          <TableCell>{appointment.services?.name}</TableCell>
                          <TableCell>
                            {appointment.staff?.first_name} {appointment.staff?.last_name}
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(appointment.status)}>
                              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Usage Statistics</CardTitle>
              <CardDescription>
                Monthly breakdown by service type for {format(selectedMonth, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead>No Shows</TableHead>
                      <TableHead>Cancelled</TableHead>
                      <TableHead>Completion Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.serviceStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.service}</TableCell>
                        <TableCell>{stat.total}</TableCell>
                        <TableCell>{stat.completed}</TableCell>
                        <TableCell>{stat.no_shows}</TableCell>
                        <TableCell>{stat.cancelled}</TableCell>
                        <TableCell>
                          {stat.total > 0 ? `${((stat.completed / stat.total) * 100).toFixed(1)}%` : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="no-shows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>No-Show Rates</CardTitle>
              <CardDescription>
                No-show analysis by service for {format(selectedMonth, "MMMM yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Total Appointments</TableHead>
                      <TableHead>No Shows</TableHead>
                      <TableHead>No Show Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.noShowRates.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.service}</TableCell>
                        <TableCell>{stat.total}</TableCell>
                        <TableCell>{stat.no_shows}</TableCell>
                        <TableCell>
                          <Badge variant={parseFloat(stat.rate) > 15 ? 'destructive' : 'secondary'}>
                            {stat.rate}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Reports;