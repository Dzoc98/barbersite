import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow, format } from "date-fns";
import { it } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
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

const UserDashboard = () => {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<number | null>(null);
  
  const {
    data: appointments,
    isLoading,
    error,
    deleteAppointment,
    isDeleting,
  } = useAppointments(user?.id);
  
  const handleBookNow = () => {
    navigate("/book");
  };
  
  const handleDeleteAppointment = (appointmentId: number) => {
    setDeleteAppointmentId(appointmentId);
  };
  
  const confirmDelete = async () => {
    if (deleteAppointmentId) {
      try {
        await deleteAppointment(deleteAppointmentId);
        toast({
          title: "Prenotazione cancellata",
          description: "La tua prenotazione è stata cancellata con successo.",
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile cancellare la prenotazione. Riprova più tardi.",
          variant: "destructive",
        });
      } finally {
        setDeleteAppointmentId(null);
      }
    }
  };
  
  const cancelDelete = () => {
    setDeleteAppointmentId(null);
  };
  
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };
  
  const upcomingAppointments = appointments?.filter(
    app => new Date(app.appointmentDate) > new Date()
  ).sort((a, b) => 
    new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
  );
  
  const lastAppointment = appointments
    ?.filter(app => new Date(app.appointmentDate) < new Date() && app.status === 'completed')
    .sort((a, b) => 
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    )[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-8">
        {/* Left Column */}
        <div className="w-full sm:w-2/3">
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-heading text-2xl font-bold">Prenota un appuntamento</h2>
                <Button 
                  onClick={handleBookNow}
                  className="bg-accent hover:bg-accent-dark font-accent"
                >
                  PRENOTA ORA
                </Button>
              </div>
              <p className="text-slate-600 mb-4">
                Scegli data e orario per il tuo prossimo appuntamento. I nostri esperti barber sono pronti a prendersi cura del tuo stile.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center p-3 bg-slate-100 rounded-lg">
                  <i className="fas fa-clock text-primary mr-2"></i>
                  <span>Orari: 9:00 - 19:30</span>
                </div>
                <div className="flex items-center p-3 bg-slate-100 rounded-lg">
                  <i className="fas fa-calendar-check text-primary mr-2"></i>
                  <span>Prenotazione facile e veloce</span>
                </div>
                <div className="flex items-center p-3 bg-slate-100 rounded-lg">
                  <i className="fas fa-bell text-primary mr-2"></i>
                  <span>Promemoria WhatsApp</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* User's Upcoming Appointments */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-heading text-xl font-bold mb-4">I tuoi prossimi appuntamenti</h2>
              
              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              )}
              
              {error && (
                <div className="text-red-500 text-center py-4">
                  Errore nel caricamento degli appuntamenti
                </div>
              )}
              
              {!isLoading && !error && upcomingAppointments?.length === 0 && (
                <div className="border border-dashed border-slate-300 rounded-lg p-6 text-center">
                  <i className="far fa-calendar-alt text-slate-400 text-4xl mb-2"></i>
                  <p className="text-slate-600">Non hai appuntamenti in programma</p>
                  <Button 
                    onClick={handleBookNow}
                    className="mt-3 bg-accent hover:bg-accent-dark font-accent"
                  >
                    PRENOTA ORA
                  </Button>
                </div>
              )}
              
              {!isLoading && !error && upcomingAppointments?.map((appointment) => (
                <div key={appointment.id} className="border-l-4 border-accent p-4 bg-slate-50 rounded-r-lg mb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">
                        {appointment.serviceName}
                      </h3>
                      <p className="text-slate-600 text-sm">
                        <i className="far fa-calendar mr-1"></i> {format(new Date(appointment.appointmentDate), "d MMMM yyyy", { locale: it })}
                        <span className="mx-2">•</span>
                        <i className="far fa-clock mr-1"></i> {format(new Date(appointment.appointmentDate), "HH:mm")}
                      </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteAppointment(appointment.id)}
                      disabled={isDeleting}
                    >
                      <i className="fas fa-times mr-1"></i> Cancella
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - User Profile */}
        <div className="w-full sm:w-1/3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-xl">
                  <span>{user ? getInitials(user.firstName, user.lastName) : ""}</span>
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold">
                    {user?.firstName} {user?.lastName}
                  </h2>
                  <p className="text-slate-600 text-sm">@{user?.username}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-sm uppercase text-slate-500 mb-2">Informazioni di contatto</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-phone text-slate-400"></i>
                    <span>{user?.phone}</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold text-sm uppercase text-slate-500 mb-2">Statistiche</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="border border-slate-200 rounded p-3 text-center">
                    <span className="block text-2xl font-bold text-primary">
                      {appointments?.length || 0}
                    </span>
                    <span className="text-sm text-slate-600">Appuntamenti</span>
                  </div>
                  <div className="border border-slate-200 rounded p-3 text-center">
                    <span className="block text-2xl font-bold text-primary">
                      {lastAppointment ? format(new Date(lastAppointment.appointmentDate), "dd/MM") : "-"}
                    </span>
                    <span className="text-sm text-slate-600">Ultimo taglio</span>
                  </div>
                </div>
              </div>
              
              <div className="border-t border-slate-200 pt-4">
                <Link href="/profile" className="flex items-center gap-2 text-slate-600 hover:text-accent py-2 transition-colors">
                  <i className="fas fa-user-edit"></i>
                  <span>Modifica profilo</span>
                </Link>
                <Link href="/profile" className="flex items-center gap-2 text-slate-600 hover:text-accent py-2 transition-colors">
                  <i className="fas fa-key"></i>
                  <span>Cambia password</span>
                </Link>
                <button className="w-full flex items-center gap-2 text-red-500 hover:text-red-700 py-2 transition-colors">
                  <i className="fas fa-trash-alt"></i>
                  <span>Elimina account</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteAppointmentId !== null} onOpenChange={() => deleteAppointmentId && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma cancellazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler cancellare questa prenotazione? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Conferma</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserDashboard;
