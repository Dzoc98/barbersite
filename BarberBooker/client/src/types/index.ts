// User types
export interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  phone: string;
  isAdmin: boolean;
  firebaseUid?: string | null;
  createdAt: string;
}

export interface UserRegistration {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// Service types
export interface Service {
  id: number;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number; // price in cents
}

// Appointment types
export interface Appointment {
  id: number;
  userId: number;
  serviceId: number;
  appointmentDate: string;
  status: 'pending' | 'completed' | 'cancelled';
  notificationSent: boolean;
  createdAt: string;
  // Extended properties
  serviceName?: string;
  serviceDuration?: number;
  servicePrice?: number;
  userName?: string;
  userUsername?: string;
  userPhone?: string;
}

export interface AppointmentCreation {
  userId: number;
  serviceId: number;
  appointmentDate: string;
}

// Client detail types
export interface ClientDetail {
  id: number;
  userId: number;
  coffeePreference: string | null;
  lastHaircut: string | null;
  appointmentCount: number;
  notes: string | null;
  lastAppointmentDate?: string;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  error?: string;
}
