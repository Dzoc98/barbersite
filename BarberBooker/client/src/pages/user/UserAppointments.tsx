import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useAppointments } from "@/hooks/useAppointments";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, isBefore, isToday, addDays } from "date-fns";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

const UserAppointments = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deleteAppointmentId, setDeleteAppointmentId] = useState<number | null>(null);
  
  const {
    data: appointments,
    isLoading,
    error,
    deleteAppointment,
    isDeleting,
  } = useAppointments(user?.id);
  
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
  
  // Filter appointments
  const now = new Date();
  const upcomingAppointments = appointments
    ?.filter(app => !isBefore(new Date(app.appointmentDate), now))
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  
  const pastAppointments = appointments
    ?.filter(app => isBefore(new Date(app.appointmentDate), now))
    .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  
  const todayAppointments = appointments
    ?.filter(app => isToday(new Date(app.appointmentDate)))
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());
  
  const isWithin48Hours = (date: Date) => {
    const now = new Date();
    const future = addDays(now, 2);
    return isBefore(date, future);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-3xl font-bold">Le tue prenotazioni</h1>
        <Link href="/book">
          <Button className="bg-accent hover:bg-accent-dark font-accent">
            NUOVA PRENOTAZIONE
          </Button>
        </Link>
      </div>
      
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
      
      {!isLoading && !error && appointments?.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center py-12">
            <div className="text-6xl text-slate-300 mb-4">
              <i className="far fa-calendar-alt"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">Nessuna prenotazione trovata</h3>
            <p className="text-slate-600 mb-6">
              Non hai ancora effettuato nessuna prenotazione.
            </p>
            <Link href="/book">
              <Button className="bg-accent hover:bg-accent-dark font-accent">
                PRENOTA ORA
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
      
      {!isLoading && !error && appointments && appointments.length > 0 && (
        <Tabs defaultValue="upcoming">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="upcoming">In programma</TabsTrigger>
            <TabsTrigger value="today">Oggi</TabsTrigger>
            <TabsTrigger value="past">Passate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming">
            <Card>
              <CardHeader>
                <CardTitle>Prenotazioni in programma</CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingAppointments?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <i className="far fa-calendar-alt text-4xl mb-2"></i>
                    <p>Non hai prenotazioni in programma</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingAppointments?.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4 hover:border-accent transition-colors">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-accent"></div>
                              <h3 className="font-semibold">{appointment.serviceName}</h3>
                            </div>
                            <p className="text-slate-600 mt-1">
                              <i className="far fa-calendar mr-1"></i>
                              {format(new Date(appointment.appointmentDate), "EEEE d MMMM yyyy", { locale: it })}
                              <span className="mx-2">•</span>
                              <i className="far fa-clock mr-1"></i>
                              {format(new Date(appointment.appointmentDate), "HH:mm")}
                            </p>
                            <p className="text-slate-600 text-sm mt-1">
                              <i className="fas fa-hourglass-half mr-1"></i>
                              Durata: {appointment.serviceDuration} minuti
                            </p>
                          </div>
                          
                          <div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeleteAppointment(appointment.id)}
                              disabled={isDeleting || isWithin48Hours(new Date(appointment.appointmentDate))}
                            >
                              <i className="fas fa-times mr-1"></i> 
                              {isWithin48Hours(new Date(appointment.appointmentDate)) 
                                ? "Impossibile cancellare" 
                                : "Cancella"
                              }
                            </Button>
                            {isWithin48Hours(new Date(appointment.appointmentDate)) && (
                              <p className="text-xs text-slate-500 mt-1">
                                La cancellazione è possibile fino a 48 ore prima
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="today">
            <Card>
              <CardHeader>
                <CardTitle>Prenotazioni di oggi</CardTitle>
              </CardHeader>
              <CardContent>
                {todayAppointments?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <i className="far fa-calendar-check text-4xl mb-2"></i>
                    <p>Non hai prenotazioni per oggi</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayAppointments?.map((appointment) => (
                      <div key={appointment.id} className="border-l-4 border-accent p-4 bg-slate-50 rounded-r-lg">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{appointment.serviceName}</h3>
                              {isBefore(new Date(appointment.appointmentDate), now) ? (
                                <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">Completato</span>
                              ) : (
                                <span className="text-xs bg-accent text-white px-2 py-1 rounded-full">In arrivo</span>
                              )}
                            </div>
                            <p className="text-slate-600 mt-1">
                              <i className="far fa-clock mr-1"></i>
                              {format(new Date(appointment.appointmentDate), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="past">
            <Card>
              <CardHeader>
                <CardTitle>Prenotazioni passate</CardTitle>
              </CardHeader>
              <CardContent>
                {pastAppointments?.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <i className="fas fa-history text-4xl mb-2"></i>
                    <p>Non hai prenotazioni passate</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pastAppointments?.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{appointment.serviceName}</h3>
                              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-1 rounded-full">
                                {appointment.status === 'completed' ? 'Completato' : 'Scaduto'}
                              </span>
                            </div>
                            <p className="text-slate-600 mt-1">
                              <i className="far fa-calendar mr-1"></i>
                              {format(new Date(appointment.appointmentDate), "d MMMM yyyy", { locale: it })}
                              <span className="mx-2">•</span>
                              <i className="far fa-clock mr-1"></i>
                              {format(new Date(appointment.appointmentDate), "HH:mm")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

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

export default UserAppointments;
