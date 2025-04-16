import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, isToday, parseISO, isAfter } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [actionAppointment, setActionAppointment] = useState<{
    id: number;
    action: 'complete' | 'delete';
  } | null>(null);
  
  const {
    data: appointments,
    isLoading,
    error,
    deleteAppointment,
    updateAppointment,
    isDeleting,
    isUpdating
  } = useAppointments();
  
  const handleCompleteAppointment = (appointmentId: number) => {
    setActionAppointment({ id: appointmentId, action: 'complete' });
  };
  
  const handleDeleteAppointment = (appointmentId: number) => {
    setActionAppointment({ id: appointmentId, action: 'delete' });
  };
  
  const confirmAction = async () => {
    if (!actionAppointment) return;
    
    try {
      if (actionAppointment.action === 'complete') {
        await updateAppointment(actionAppointment.id, { status: 'completed' });
        toast({
          title: "Appuntamento completato",
          description: "L'appuntamento è stato contrassegnato come completato.",
        });
      } else {
        await deleteAppointment(actionAppointment.id);
        toast({
          title: "Appuntamento eliminato",
          description: "L'appuntamento è stato eliminato con successo.",
        });
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: `Impossibile ${actionAppointment.action === 'complete' ? 'completare' : 'eliminare'} l'appuntamento. Riprova più tardi.`,
        variant: "destructive",
      });
    } finally {
      setActionAppointment(null);
    }
  };
  
  const cancelAction = () => {
    setActionAppointment(null);
  };
  
  // Filter today's appointments and sort by time
  const todayAppointments = appointments
    ?.filter(app => isToday(new Date(app.appointmentDate)))
    .sort((a, b) => 
      new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
    );
  
  // Group appointments by day for the week view
  const days = ["LUN", "MAR", "MER", "GIO", "VEN", "SAB", "DOM"];
  const currentWeekDates = [];
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 for Sunday, 1 for Monday, etc.
  
  // Adjust to get Monday as first day
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  
  // Generate array of dates for the week
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    currentWeekDates.push(date);
  }
  
  // Helper for time slots
  const timeSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

  // Check if an appointment is within a time slot
  const getAppointmentsForSlot = (date: Date, timeSlot: string) => {
    if (!appointments) return [];
    
    const [hours, minutes] = timeSlot.split(":").map(Number);
    const slotStart = new Date(date);
    slotStart.setHours(hours, 0, 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(hours + 1, 0, 0, 0);
    
    return appointments.filter(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      return appointmentDate >= slotStart && appointmentDate < slotEnd;
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <Sidebar activeItem="appointments" />
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Today's Appointments */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-xl font-bold">Appuntamenti di oggi</h2>
                <div className="flex items-center">
                  <span className="mr-2 text-sm">{format(new Date(), "d MMMM yyyy", { locale: it })}</span>
                  <Button variant="ghost" size="icon">
                    <i className="fas fa-calendar-alt"></i>
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">
                  Errore nel caricamento degli appuntamenti
                </div>
              ) : todayAppointments?.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <i className="far fa-calendar-check text-4xl mb-2"></i>
                  <p>Non ci sono appuntamenti per oggi</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {todayAppointments?.map((appointment) => (
                    <div 
                      key={appointment.id} 
                      className="flex flex-col sm:flex-row sm:items-center p-4 border border-slate-200 rounded-lg hover:border-accent transition-colors"
                    >
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm mr-3">
                            <span>
                              {appointment.userName?.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium">{appointment.userName}</h3>
                            <p className="text-sm text-slate-600">
                              @{appointment.userUsername} • {appointment.userPhone}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-1 mb-3 sm:mb-0">
                        <div className="text-sm">
                          <div className="font-medium">{appointment.serviceName}</div>
                          <div className="text-slate-600">
                            <i className="far fa-clock mr-1"></i> 
                            {format(new Date(appointment.appointmentDate), "HH:mm")} - 
                            {format(
                              new Date(new Date(appointment.appointmentDate).getTime() + appointment.serviceDuration * 60 * 1000), 
                              "HH:mm"
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-success hover:bg-green-700"
                          onClick={() => handleCompleteAppointment(appointment.id)}
                          disabled={
                            isUpdating || 
                            appointment.status === 'completed' ||
                            !isAfter(new Date(), parseISO(appointment.appointmentDate))
                          }
                        >
                          <i className="fas fa-check mr-1"></i> Completato
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteAppointment(appointment.id)}
                          disabled={isDeleting}
                        >
                          <i className="fas fa-times mr-1"></i> Elimina
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Weekly Calendar Overview */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-6">Panoramica settimanale</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-max">
                  <thead>
                    <tr>
                      <th className="p-3 text-left"></th>
                      {currentWeekDates.map((date, index) => (
                        <th 
                          key={index} 
                          className={`p-3 text-center font-medium ${isToday(date) ? 'bg-accent-light/10' : ''}`}
                        >
                          {days[index]}<br />
                          <span className="text-sm font-normal">
                            {format(date, "d MMM", { locale: it })}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((timeSlot, index) => (
                      <tr key={index}>
                        <td className="p-3 text-slate-500 font-medium">{timeSlot}</td>
                        {currentWeekDates.map((date, dateIndex) => {
                          const slotAppointments = getAppointmentsForSlot(date, timeSlot);
                          return (
                            <td 
                              key={dateIndex} 
                              className={`p-1 text-center ${isToday(date) ? 'bg-accent-light/10' : ''}`}
                            >
                              {slotAppointments.map((app, appIndex) => (
                                <div 
                                  key={appIndex} 
                                  className={`
                                    bg-slate-100 rounded p-1 text-xs mb-1 
                                    ${isToday(date) && app.status !== 'completed' ? 'bg-accent/20 font-medium' : ''}
                                  `}
                                >
                                  {app.userName?.split(' ')[0]}.<br />
                                  {app.serviceName?.split(' ')[0]}
                                </div>
                              ))}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={actionAppointment !== null} onOpenChange={() => actionAppointment && cancelAction()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionAppointment?.action === 'complete' 
                ? "Conferma completamento" 
                : "Conferma eliminazione"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionAppointment?.action === 'complete' 
                ? "Sei sicuro di voler contrassegnare questo appuntamento come completato? Verrà inviata una notifica al cliente." 
                : "Sei sicuro di voler eliminare questo appuntamento? Questa azione non può essere annullata."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelAction}>Annulla</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction} 
              className={actionAppointment?.action === 'complete' ? "bg-success hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}
            >
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminDashboard;
