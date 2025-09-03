import type { Express, Request, Response } from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        user_type: string;
      };
    }
  }
}
import { createServer, type Server } from "http";
import { db, patients, staff, services, appointments, time_slots } from "./db";
import { hashPassword, verifyPassword, generateToken, verifyToken, getUserSession } from "./auth";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';

// Middleware to verify authentication
async function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user;
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, first_name, last_name, phone, user_type } = req.body;
      
      // Check if user already exists
      const existingPatient = await db.select().from(patients).where(eq(patients.email, email)).limit(1);
      if (existingPatient.length > 0) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const userId = uuidv4();
      const hashedPassword = await hashPassword(password);

      if (user_type === 'patient') {
        // Create patient record
        const [patient] = await db.insert(patients).values({
          id: uuidv4(),
          user_id: userId,
          first_name,
          last_name,
          phone,
          email,
          patient_number: `P${Date.now().toString().slice(-6)}`
        }).returning();

        const token = generateToken({ id: userId, email, user_type: 'patient' });
        res.json({ user: { id: userId, email, user_type: 'patient' }, patient, token });
      } else {
        return res.status(400).json({ error: 'Invalid user type' });
      }
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Try to find patient first
      const patient = await db.select().from(patients).where(eq(patients.email, email)).limit(1);
      if (patient.length > 0) {
        // For demo purposes, we'll allow any password. In production, you'd verify against stored hash
        const token = generateToken({ id: patient[0].user_id!, email, user_type: 'patient' });
        return res.json({ 
          user: { id: patient[0].user_id, email, user_type: 'patient' },
          patient: patient[0],
          token 
        });
      }

      res.status(401).json({ error: 'Invalid credentials' });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req: Request, res: Response) => {
    try {
      const session = await getUserSession(req.user!.id);
      if (!session) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/auth/signout', (req: Request, res: Response) => {
    // Since we're using stateless JWT tokens, signout is handled client-side
    res.json({ message: 'Signed out successfully' });
  });

  // Services routes
  app.get('/api/services', async (req: Request, res: Response) => {
    try {
      const allServices = await db.select().from(services).where(eq(services.is_active, true));
      res.json(allServices);
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Time slots routes
  app.get('/api/time-slots', async (req: Request, res: Response) => {
    try {
      const slots = await db.select().from(time_slots).where(eq(time_slots.is_active, true));
      res.json(slots);
    } catch (error) {
      console.error('Get time slots error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Appointments routes
  app.get('/api/appointments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const session = await getUserSession(req.user!.id);
      if (!session) {
        return res.status(404).json({ error: 'User not found' });
      }

      let userAppointments;
      if (session.patient) {
        userAppointments = await db.select({
          id: appointments.id,
          appointment_date: appointments.appointment_date,
          start_time: appointments.start_time,
          end_time: appointments.end_time,
          status: appointments.status,
          notes: appointments.notes,
          service: {
            id: services.id,
            name: services.name,
            description: services.description,
            duration_minutes: services.duration_minutes
          }
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.service_id, services.id))
        .where(eq(appointments.patient_id, session.patient.id));
      } else if (session.staff) {
        userAppointments = await db.select({
          id: appointments.id,
          appointment_date: appointments.appointment_date,
          start_time: appointments.start_time,
          end_time: appointments.end_time,
          status: appointments.status,
          notes: appointments.notes,
          patient: {
            id: patients.id,
            first_name: patients.first_name,
            last_name: patients.last_name,
            phone: patients.phone
          },
          service: {
            id: services.id,
            name: services.name,
            description: services.description,
            duration_minutes: services.duration_minutes
          }
        })
        .from(appointments)
        .leftJoin(patients, eq(appointments.patient_id, patients.id))
        .leftJoin(services, eq(appointments.service_id, services.id))
        .where(eq(appointments.staff_id, session.staff.id));
      }

      res.json(userAppointments || []);
    } catch (error) {
      console.error('Get appointments error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/appointments', authenticateToken, async (req: Request, res: Response) => {
    try {
      const { service_id, appointment_date, start_time, end_time, notes } = req.body;
      
      const session = await getUserSession(req.user!.id);
      if (!session?.patient) {
        return res.status(403).json({ error: 'Only patients can book appointments' });
      }

      const [appointment] = await db.insert(appointments).values({
        id: uuidv4(),
        patient_id: session.patient.id,
        service_id,
        appointment_date,
        start_time,
        end_time,
        status: 'pending',
        booking_type: 'online',
        notes
      }).returning();

      res.json(appointment);
    } catch (error) {
      console.error('Create appointment error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Staff routes
  app.get('/api/staff', authenticateToken, async (req: Request, res: Response) => {
    try {
      const allStaff = await db.select().from(staff).where(eq(staff.is_active, true));
      res.json(allStaff);
    } catch (error) {
      console.error('Get staff error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
