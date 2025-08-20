import { pgTable, text, serial, integer, boolean, uuid, timestamp, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// Services table
export const services = pgTable("services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  duration_minutes: integer("duration_minutes").notNull().default(30),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Staff table
export const staff = pgTable("staff", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id").notNull().unique(),
  staff_number: text("staff_number").unique(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Patients table
export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: uuid("user_id"),
  patient_number: text("patient_number").unique(),
  first_name: text("first_name").notNull(),
  last_name: text("last_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  date_of_birth: date("date_of_birth"),
  address: text("address"),
  emergency_contact_name: text("emergency_contact_name"),
  emergency_contact_phone: text("emergency_contact_phone"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Time slots table
export const time_slots = pgTable("time_slots", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  day_of_week: integer("day_of_week").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patient_id: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  service_id: uuid("service_id").notNull().references(() => services.id, { onDelete: "restrict" }),
  staff_id: uuid("staff_id").references(() => staff.id, { onDelete: "set null" }),
  doctor_id: uuid("doctor_id"),
  appointment_date: date("appointment_date").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  status: text("status").notNull().default("pending"),
  booking_type: text("booking_type").notNull().default("online"),
  notes: text("notes"),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  appointment_id: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  channel: text("channel").notNull(),
  recipient: text("recipient").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("queued"),
  sent_at: timestamp("sent_at", { withTimezone: true }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Staff schedules table
export const staff_schedules = pgTable("staff_schedules", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  staff_id: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  day_of_week: integer("day_of_week").notNull(),
  start_time: time("start_time").notNull(),
  end_time: time("end_time").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Staff services junction table
export const staff_services = pgTable("staff_services", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  staff_id: uuid("staff_id").notNull().references(() => staff.id, { onDelete: "cascade" }),
  service_id: uuid("service_id").notNull().references(() => services.id, { onDelete: "cascade" }),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Staff availability table
export const staff_availability = pgTable("staff_availability", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  staff_id: uuid("staff_id").notNull(),
  availability_date: date("availability_date").notNull(),
  is_available: boolean("is_available").notNull().default(true),
  created_at: timestamp("created_at", { withTimezone: true }).notNull().default(sql`now()`),
  updated_at: timestamp("updated_at", { withTimezone: true }).notNull().default(sql`now()`),
});

// Legacy users table (keeping for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Export types for the new tables
export type Service = typeof services.$inferSelect;
export type InsertService = typeof services.$inferInsert;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = typeof patients.$inferInsert;

export type TimeSlot = typeof time_slots.$inferSelect;
export type InsertTimeSlot = typeof time_slots.$inferInsert;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = typeof appointments.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
