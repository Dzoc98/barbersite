import { pgTable, text, serial, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  firebaseUid: text("firebase_uid"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Services table
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  durationMinutes: integer("duration_minutes").notNull(),
  price: integer("price").notNull(), // price in cents
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  appointmentDate: timestamp("appointment_date").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, cancelled
  notificationSent: boolean("notification_sent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Client details table (for admin use)
export const clientDetails = pgTable("client_details", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  coffeePreference: text("coffee_preference"),
  lastHaircut: text("last_haircut"),
  appointmentCount: integer("appointment_count").default(0),
  notes: text("notes"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  isAdmin: true,
  firebaseUid: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  notificationSent: true,
});

export const insertClientDetailSchema = createInsertSchema(clientDetails).omit({
  id: true,
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateServiceSchema = insertServiceSchema.partial();
export const updateAppointmentSchema = createInsertSchema(appointments)
  .omit({ id: true, createdAt: true, userId: true })
  .partial();
export const updateClientDetailSchema = insertClientDetailSchema.partial().omit({ userId: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof updateAppointmentSchema>;

export type ClientDetail = typeof clientDetails.$inferSelect;
export type InsertClientDetail = z.infer<typeof insertClientDetailSchema>;
export type UpdateClientDetail = z.infer<typeof updateClientDetailSchema>;

// Extended types
export type UserWithAppointments = User & {
  appointments: Appointment[];
};

export type UserWithDetails = User & {
  clientDetail?: ClientDetail;
};
