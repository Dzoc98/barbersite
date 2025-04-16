import {
  users,
  services,
  appointments,
  clientDetails,
  type User,
  type InsertUser,
  type UpdateUser,
  type Service,
  type InsertService,
  type Appointment,
  type InsertAppointment,
  type UpdateAppointment,
  type ClientDetail,
  type InsertClientDetail,
  type UpdateClientDetail,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByFirebaseUid(uid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: UpdateUser): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  
  // Service methods
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  
  // Appointment methods
  getAppointments(): Promise<Appointment[]>;
  getUserAppointments(userId: number): Promise<Appointment[]>;
  getAppointmentsByDate(date: Date): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, updates: UpdateAppointment): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  
  // Client detail methods
  getClientDetail(userId: number): Promise<ClientDetail | undefined>;
  createClientDetail(detail: InsertClientDetail): Promise<ClientDetail>;
  updateClientDetail(userId: number, updates: UpdateClientDetail): Promise<ClientDetail | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private services: Map<number, Service>;
  private appointments: Map<number, Appointment>;
  private clientDetails: Map<number, ClientDetail>;
  userCurrentId: number;
  serviceCurrentId: number;
  appointmentCurrentId: number;
  clientDetailCurrentId: number;

  constructor() {
    this.users = new Map();
    this.services = new Map();
    this.appointments = new Map();
    this.clientDetails = new Map();
    this.userCurrentId = 1;
    this.serviceCurrentId = 1;
    this.appointmentCurrentId = 1;
    this.clientDetailCurrentId = 1;
    
    // Add default services
    this.initializeDefaultServices();
  }

  private initializeDefaultServices() {
    const defaultServices: InsertService[] = [
      { name: "Barba", description: "Rifinitura e modellamento barba professionale", durationMinutes: 20, price: 1500 },
      { name: "Taglio + Shampoo", description: "Taglio personalizzato con lavaggio", durationMinutes: 30, price: 2500 },
      { name: "Trattamento barba", description: "Trattamento completo per la cura della barba", durationMinutes: 30, price: 2200 },
      { name: "Trattamento anticaduta", description: "Trattamento specifico contro la caduta dei capelli", durationMinutes: 30, price: 3500 },
      { name: "Taglio + Shampoo + Barba", description: "Servizio completo per capelli e barba", durationMinutes: 40, price: 3500 },
      { name: "Taglio + Shampoo + Trattamento barba", description: "Pacchetto premium con trattamento barba intensivo", durationMinutes: 45, price: 4500 },
    ];
    
    defaultServices.forEach(service => this.createService(service));
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByFirebaseUid(uid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === uid,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      firebaseUid: null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: UpdateUser): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  // Service methods
  async getServices(): Promise<Service[]> {
    return Array.from(this.services.values());
  }

  async getService(id: number): Promise<Service | undefined> {
    return this.services.get(id);
  }

  async createService(insertService: InsertService): Promise<Service> {
    const id = this.serviceCurrentId++;
    const service: Service = { ...insertService, id };
    this.services.set(id, service);
    return service;
  }

  // Appointment methods
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getUserAppointments(userId: number): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(
      (appointment) => appointment.userId === userId,
    );
  }

  async getAppointmentsByDate(date: Date): Promise<Appointment[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.appointments.values()).filter(
      (appointment) => {
        const appointmentDate = new Date(appointment.appointmentDate);
        return appointmentDate >= startOfDay && appointmentDate <= endOfDay;
      }
    );
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentCurrentId++;
    const appointment: Appointment = {
      ...insertAppointment,
      id,
      notificationSent: false,
      createdAt: new Date(),
    };
    this.appointments.set(id, appointment);
    
    // Update client appointment count
    const clientDetail = await this.getClientDetail(insertAppointment.userId);
    if (clientDetail) {
      await this.updateClientDetail(
        insertAppointment.userId, 
        { appointmentCount: clientDetail.appointmentCount + 1 }
      );
    }
    
    return appointment;
  }

  async updateAppointment(id: number, updates: UpdateAppointment): Promise<Appointment | undefined> {
    const appointment = this.appointments.get(id);
    if (!appointment) return undefined;
    
    const updatedAppointment = { ...appointment, ...updates };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const appointment = this.appointments.get(id);
    if (!appointment) return false;
    
    // Update client appointment count if needed
    const clientDetail = await this.getClientDetail(appointment.userId);
    if (clientDetail && clientDetail.appointmentCount > 0) {
      await this.updateClientDetail(
        appointment.userId, 
        { appointmentCount: clientDetail.appointmentCount - 1 }
      );
    }
    
    return this.appointments.delete(id);
  }

  // Client detail methods
  async getClientDetail(userId: number): Promise<ClientDetail | undefined> {
    return Array.from(this.clientDetails.values()).find(
      (detail) => detail.userId === userId,
    );
  }

  async createClientDetail(insertDetail: InsertClientDetail): Promise<ClientDetail> {
    const id = this.clientDetailCurrentId++;
    const detail: ClientDetail = { ...insertDetail, id };
    this.clientDetails.set(id, detail);
    return detail;
  }

  async updateClientDetail(userId: number, updates: UpdateClientDetail): Promise<ClientDetail | undefined> {
    const detail = Array.from(this.clientDetails.values()).find(
      (detail) => detail.userId === userId,
    );
    
    if (!detail) {
      // Create a new detail if it doesn't exist
      return this.createClientDetail({ userId, ...updates } as InsertClientDetail);
    }
    
    const updatedDetail = { ...detail, ...updates };
    this.clientDetails.set(detail.id, updatedDetail);
    return updatedDetail;
  }
}

export const storage = new MemStorage();
