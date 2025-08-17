import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import StaffDashboard from '@/components/dashboard/StaffDashboard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { user, patient, staff, signOut } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Please sign in to access the dashboard.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Show loading state if user profile hasn't loaded yet
  if (!patient && !staff) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold">Hopewell Clinic</h1>
            </div>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Setting up your profile...</CardTitle>
              <CardDescription>
                Please wait while we set up your account. If this takes too long, please contact support.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-semibold">Hopewell Clinic</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {patient ? `${patient.first_name} ${patient.last_name}` : `${staff?.first_name} ${staff?.last_name}`}
            </span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {patient && <PatientDashboard patient={patient} />}
        {staff && <StaffDashboard staff={staff} />}
      </main>
    </div>
  );
};

export default Dashboard;