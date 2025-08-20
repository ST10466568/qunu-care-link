import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, patients, staff } from "./db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const SALT_ROUNDS = 10;

export interface AuthUser {
  id: string;
  email: string;
  user_type: 'patient' | 'staff';
}

export interface UserSession {
  user: AuthUser;
  patient?: any;
  staff?: any;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthUser | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthUser;
  } catch {
    return null;
  }
}

export async function getUserSession(userId: string): Promise<UserSession | null> {
  try {
    // Try to find as patient first
    const patient = await db.select().from(patients).where(eq(patients.user_id, userId)).limit(1);
    if (patient.length > 0) {
      return {
        user: {
          id: userId,
          email: patient[0].email || '',
          user_type: 'patient'
        },
        patient: patient[0]
      };
    }

    // Try to find as staff
    const staffMember = await db.select().from(staff).where(eq(staff.user_id, userId)).limit(1);
    if (staffMember.length > 0) {
      return {
        user: {
          id: userId,
          email: '',
          user_type: 'staff'
        },
        staff: staffMember[0]
      };
    }

    return null;
  } catch (error) {
    console.error('Error getting user session:', error);
    return null;
  }
}