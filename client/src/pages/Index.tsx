import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Calendar, Users, Clock, MapPin, Phone } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-foreground">Hopewell Community Clinic</h1>
              <p className="text-sm text-muted-foreground">Qunu Village, Eastern Cape</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Book Appointment
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-background to-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Quality Healthcare for Our Community
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Book appointments online, manage your healthcare, and receive quality medical care 
            at Hopewell Community Clinic in Qunu Village.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
              <Calendar className="h-5 w-5 mr-2" />
              Book Appointment Now
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
              <Users className="h-5 w-5 mr-2" />
              Patient Portal
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Our Services</h3>
            <p className="text-xl text-muted-foreground">
              Comprehensive healthcare services for the entire family
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>General Consultation</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive medical examinations and health assessments for all ages.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Maternity Care</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Prenatal and postnatal care for expecting and new mothers.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Child Immunization</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Essential vaccinations and immunizations for children of all ages.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <span>Chronic Illness Management</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Ongoing care for diabetes, hypertension, and other chronic conditions.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span>Family Planning</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Comprehensive family planning consultation and contraceptive services.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <span>Minor Emergency Care</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Treatment for minor injuries, cuts, burns, and urgent medical needs.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Info Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">Why Choose Online Booking?</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Save Time</h4>
                    <p className="text-muted-foreground">No more waiting in long queues. Book your appointment online anytime.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Choose Your Slot</h4>
                    <p className="text-muted-foreground">Select the date and time that works best for your schedule.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Heart className="h-6 w-6 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Get Reminders</h4>
                    <p className="text-muted-foreground">Receive SMS and email reminders so you never miss an appointment.</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Address</p>
                    <p className="text-muted-foreground">Hopewell Community Clinic<br />Qunu Village, near Mthatha<br />Eastern Cape, South Africa</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Operating Hours</p>
                    <p className="text-muted-foreground">Monday - Friday: 08:00 - 16:00<br />Weekend: Closed</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Emergency Contact</p>
                    <p className="text-muted-foreground">For emergencies, please call 10177</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Book Your Appointment?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join hundreds of community members who trust Hopewell Clinic for their healthcare needs.
          </p>
          <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
            Get Started Today
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Heart className="h-6 w-6 text-primary" />
            <span className="font-semibold">Hopewell Community Clinic</span>
          </div>
          <p className="text-muted-foreground">
            Serving the Qunu community with quality healthcare since 2020
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
