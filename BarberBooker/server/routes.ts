import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertUserSchema,
  insertAppointmentSchema,
  updateUserSchema,
  updateAppointmentSchema,
  updateClientDetailSchema,
  users,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";
import { ZodError, z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Create a custom schema that includes firebaseUid and isAdmin fields
const googleUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication APIs
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      const user = await storage.createUser(validatedData);
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      // Create empty client detail
      await storage.createClientDetail({
        userId: user.id,
        coffeePreference: "",
        lastHaircut: "",
        appointmentCount: 0,
        notes: ""
      });
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to register user" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid username or password" });
      }
      
      // Don't return password in response
      const { password: _, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to log in" });
    }
  });
  
  // Google authentication endpoint
  app.post("/api/auth/google-login", async (req: Request, res: Response) => {
    try {
      const { firebaseUid, email, displayName, photoURL } = req.body;
      
      if (!firebaseUid) {
        return res.status(400).json({ message: "Firebase user ID is required" });
      }
      
      // Check if user exists by Firebase UID
      let user = await storage.getUserByFirebaseUid(firebaseUid);
      
      if (!user) {
        // Create new user if one doesn't exist
        const names = displayName ? displayName.split(' ') : ['', ''];
        const firstName = names[0] || '';
        const lastName = names.length > 1 ? names.slice(1).join(' ') : '';
        
        // Email will be used as username if available
        const username = email || `user_${Date.now()}`;
        
        const userData = googleUserSchema.parse({
          username,
          password: '', // Empty password for Google-authenticated users
          firstName,
          lastName,
          phone: '',
          isAdmin: false,
          firebaseUid,
        });
        
        const newUser = await storage.createUser(userData);
        
        // Create empty client detail
        await storage.createClientDetail({
          userId: newUser.id,
          coffeePreference: '',
          lastHaircut: '',
          appointmentCount: 0,
          notes: ''
        });
        
        user = newUser;
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to authenticate with Google" });
    }
  });

  app.get("/api/auth/me", async (req: Request, res: Response) => {
    // Check if we have a Firebase UID in the header
    const firebaseUid = req.headers['firebase-uid'] as string;
    
    try {
      let user;
      
      if (firebaseUid) {
        // Try to find user by Firebase UID
        user = await storage.getUserByFirebaseUid(firebaseUid);
      } else if (req.headers['user-id'] || req.query.userId) {
        // Fallback to user ID if provided
        const userId = req.headers['user-id'] || req.query.userId;
        user = await storage.getUser(Number(userId));
      }
      
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = user;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // User APIs
  app.put("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const validatedData = updateUserSchema.parse(req.body);
      
      if (validatedData.username) {
        const existingUser = await storage.getUserByUsername(validatedData.username);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Username already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't return password in response
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.status(200).json(userWithoutPassword);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const success = await storage.deleteUser(userId);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Service APIs
  app.get("/api/services", async (_req: Request, res: Response) => {
    try {
      const services = await storage.getServices();
      res.status(200).json(services);
    } catch (error) {
      res.status(500).json({ message: "Failed to get services" });
    }
  });

  app.get("/api/services/:id", async (req: Request, res: Response) => {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await storage.getService(serviceId);
      
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      res.status(200).json(service);
    } catch (error) {
      res.status(500).json({ message: "Failed to get service" });
    }
  });

  // Appointment APIs
  app.get("/api/appointments", async (req: Request, res: Response) => {
    try {
      // Filter by user ID if provided
      const userId = req.query.userId;
      
      // Filter by date if provided
      const dateStr = req.query.date as string;
      
      if (userId) {
        const appointments = await storage.getUserAppointments(Number(userId));
        return res.status(200).json(appointments);
      } else if (dateStr) {
        const date = new Date(dateStr);
        const appointments = await storage.getAppointmentsByDate(date);
        return res.status(200).json(appointments);
      } else {
        const appointments = await storage.getAppointments();
        return res.status(200).json(appointments);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const appointment = await storage.getAppointment(appointmentId);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to get appointment" });
    }
  });

  app.post("/api/appointments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      
      // Check if service exists
      const service = await storage.getService(validatedData.serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Validate appointment time
      const appointmentDate = new Date(validatedData.appointmentDate);
      const hours = appointmentDate.getHours();
      const minutes = appointmentDate.getMinutes();
      
      // Check if appointment is within business hours (9:00 - 19:30)
      if (hours < 9 || (hours === 19 && minutes > 30) || hours > 19) {
        return res.status(400).json({ message: "Appointment must be between 9:00 and 19:30" });
      }
      
      // Check if appointment is at a valid 10-minute interval
      if (minutes % 10 !== 0) {
        return res.status(400).json({ message: "Appointment must be scheduled at 10-minute intervals" });
      }
      
      // Check for conflicts with existing appointments
      const existingAppointments = await storage.getAppointmentsByDate(appointmentDate);
      const appointmentEndTime = new Date(appointmentDate.getTime() + service.durationMinutes * 60 * 1000);
      
      // Get all services for existing appointments first
      const existingServicesMap = new Map();
      for (const appointment of existingAppointments) {
        const service = await storage.getService(appointment.serviceId);
        if (service) {
          existingServicesMap.set(appointment.id, service);
        }
      }
      
      const hasConflict = existingAppointments.some(existingAppointment => {
        const existingService = existingServicesMap.get(existingAppointment.id);
        if (!existingService) return false;
        
        const existingStartTime = new Date(existingAppointment.appointmentDate);
        const existingEndTime = new Date(existingStartTime.getTime() + existingService.durationMinutes * 60 * 1000);
        
        // Check if there's an overlap
        return (
          (appointmentDate < existingEndTime && appointmentEndTime > existingStartTime) ||
          (existingStartTime < appointmentEndTime && existingEndTime > appointmentDate)
        );
      });
      
      if (hasConflict) {
        return res.status(409).json({ message: "This time slot is already booked" });
      }
      
      const appointment = await storage.createAppointment(validatedData);
      
      // Update client's last haircut info
      await storage.updateClientDetail(user.id, {
        lastHaircut: service.name
      });
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const validatedData = updateAppointmentSchema.parse(req.body);
      
      const appointment = await storage.getAppointment(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      // If updating status to "completed", handle notification logic
      if (validatedData.status === "completed") {
        // Set notification flag (in real implementation, this would trigger WhatsApp notification)
        validatedData.notificationSent = true;
      }
      
      const updatedAppointment = await storage.updateAppointment(appointmentId, validatedData);
      
      res.status(200).json(updatedAppointment);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req: Request, res: Response) => {
    try {
      const appointmentId = parseInt(req.params.id);
      const success = await storage.deleteAppointment(appointmentId);
      
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Client Detail APIs
  app.get("/api/client-details/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const clientDetail = await storage.getClientDetail(userId);
      
      if (!clientDetail) {
        return res.status(404).json({ message: "Client detail not found" });
      }
      
      res.status(200).json(clientDetail);
    } catch (error) {
      res.status(500).json({ message: "Failed to get client detail" });
    }
  });

  app.put("/api/client-details/:userId", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const validatedData = updateClientDetailSchema.parse(req.body);
      
      // Check if user exists
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedClientDetail = await storage.updateClientDetail(userId, validatedData);
      
      res.status(200).json(updatedClientDetail);
    } catch (error) {
      if (error.name === "ZodError") {
        return res.status(400).json({ message: fromZodError(error).message });
      }
      res.status(500).json({ message: "Failed to update client detail" });
    }
  });

  // Utility API for checking available time slots
  app.get("/api/available-slots", async (req: Request, res: Response) => {
    try {
      const dateStr = req.query.date as string;
      const serviceIdStr = req.query.serviceId as string;
      
      if (!dateStr || !serviceIdStr) {
        return res.status(400).json({ message: "Date and serviceId are required" });
      }
      
      const date = new Date(dateStr);
      const serviceId = parseInt(serviceIdStr);
      
      // Check if service exists
      const service = await storage.getService(serviceId);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      
      // Get existing appointments for the day
      const existingAppointments = await storage.getAppointmentsByDate(date);
      
      // Get all services for existing appointments first
      const servicesMap = new Map();
      for (const appointment of existingAppointments) {
        const appointmentService = await storage.getService(appointment.serviceId);
        if (appointmentService) {
          servicesMap.set(appointment.id, appointmentService);
        }
      }
      
      // Generate all possible time slots for the day (9:00 - 19:30, every 10 minutes)
      const slots = [];
      const startHour = 9;
      const endHour = 19;
      const endMinute = 30;
      
      // Create appointment time ranges for conflict checking
      const appointmentRanges = existingAppointments.map(appointment => {
        const existingService = servicesMap.get(appointment.id);
        if (!existingService) return null;
        
        const existingStartTime = new Date(appointment.appointmentDate);
        const existingEndTime = new Date(existingStartTime.getTime() + existingService.durationMinutes * 60 * 1000);
        
        return { start: existingStartTime, end: existingEndTime };
      }).filter(range => range !== null);
      
      for (let hour = startHour; hour <= endHour; hour++) {
        let maxMinute = hour === endHour ? endMinute : 50;
        
        for (let minute = 0; minute <= maxMinute; minute += 10) {
          const slotTime = new Date(date);
          slotTime.setHours(hour, minute, 0, 0);
          
          // Skip if slot is in the past
          if (slotTime < new Date()) continue;
          
          const slotEndTime = new Date(slotTime.getTime() + service.durationMinutes * 60 * 1000);
          
          // Skip if the service would end after business hours
          if (slotEndTime.getHours() > endHour || 
              (slotEndTime.getHours() === endHour && slotEndTime.getMinutes() > endMinute)) {
            continue;
          }
          
          // Check if slot conflicts with existing appointments
          const hasConflict = appointmentRanges.some(range => {
            if (!range) return false;
            
            // Check if there's an overlap
            return (
              (slotTime < range.end && slotEndTime > range.start) ||
              (range.start < slotEndTime && range.end > slotTime)
            );
          });
          
          if (!hasConflict) {
            slots.push(slotTime.toISOString());
          }
        }
      }
      
      res.status(200).json({ availableSlots: slots });
    } catch (error) {
      res.status(500).json({ message: "Failed to get available slots" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
