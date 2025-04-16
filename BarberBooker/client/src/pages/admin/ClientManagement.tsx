import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, ClientDetail } from "@/types";

interface UserWithClientDetail extends User {
  clientDetail?: ClientDetail;
}

const ClientManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [coffeePreferences, setCoffeePreferences] = useState<Record<number, string>>({});
  const [deleteUserId, setDeleteUserId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const clientsPerPage = 10;

  // Fetch all clients
  const { data: clients, isLoading, error } = useQuery<UserWithClientDetail[]>({
    queryKey: ["/api/admin/clients"],
    queryFn: async () => {
      const res = await fetch("/api/admin/clients", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch clients");
      return res.json();
    },
  });

  // Update client details mutation
  const updateClientDetail = useMutation({
    mutationFn: async ({ userId, coffeePreference }: { userId: number; coffeePreference: string }) => {
      return apiRequest("PUT", `/api/client-details/${userId}`, { coffeePreference });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      toast({
        title: "Dettagli cliente aggiornati",
        description: "I dettagli del cliente sono stati aggiornati con successo.",
      });
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare i dettagli del cliente. Riprova più tardi.",
        variant: "destructive",
      });
    },
  });

  // Delete client mutation
  const deleteClient = useMutation({
    mutationFn: async (userId: number) => {
      return apiRequest("DELETE", `/api/users/${userId}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/clients"] });
      toast({
        title: "Cliente eliminato",
        description: "Il cliente è stato eliminato con successo.",
      });
      setDeleteUserId(null);
    },
    onError: () => {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il cliente. Riprova più tardi.",
        variant: "destructive",
      });
      setDeleteUserId(null);
    },
  });

  const handleCoffeePreferenceChange = (userId: number, value: string) => {
    setCoffeePreferences({
      ...coffeePreferences,
      [userId]: value,
    });
  };

  const handleSaveCoffeePreference = (userId: number) => {
    const preference = coffeePreferences[userId];
    if (preference !== undefined) {
      updateClientDetail.mutate({
        userId,
        coffeePreference: preference,
      });
    }
  };

  const handleDeleteClient = (userId: number) => {
    setDeleteUserId(userId);
  };

  const confirmDelete = () => {
    if (deleteUserId) {
      deleteClient.mutate(deleteUserId);
    }
  };

  const cancelDelete = () => {
    setDeleteUserId(null);
  };

  // Filter clients based on search query
  const filteredClients = clients?.filter((client) => {
    const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
    const username = client.username.toLowerCase();
    const phone = client.phone.toLowerCase();
    const query = searchQuery.toLowerCase();

    return (
      fullName.includes(query) ||
      username.includes(query) ||
      phone.includes(query)
    );
  });

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients?.slice(indexOfFirstClient, indexOfLastClient);
  const totalPages = filteredClients ? Math.ceil(filteredClients.length / clientsPerPage) : 0;

  // Get initials for avatar
  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <Sidebar activeItem="clients" />
        
        {/* Main Content */}
        <div className="flex-1">
          {/* Client List */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h2 className="font-heading text-xl font-bold">Gestione Clienti</h2>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-initial">
                    <Input
                      type="text"
                      placeholder="Cerca cliente..."
                      className="w-full pl-10 pr-4"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                  </div>
                  <Button variant="outline" size="icon">
                    <i className="fas fa-filter"></i>
                  </Button>
                </div>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full"></div>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-4">
                  Errore nel caricamento dei clienti
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-max">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="p-3 text-left font-medium text-slate-700">Cliente</th>
                          <th className="p-3 text-left font-medium text-slate-700">Contatto</th>
                          <th className="p-3 text-left font-medium text-slate-700">Ultimo taglio</th>
                          <th className="p-3 text-left font-medium text-slate-700">Appuntamenti</th>
                          <th className="p-3 text-left font-medium text-slate-700">Caffè</th>
                          <th className="p-3 text-left font-medium text-slate-700">Azioni</th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentClients?.map((client) => (
                          <tr key={client.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="p-3">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm mr-3">
                                  <span>{getInitials(client.firstName, client.lastName)}</span>
                                </div>
                                <div>
                                  <h3 className="font-medium">{client.firstName} {client.lastName}</h3>
                                  <p className="text-sm text-slate-600">@{client.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-3 text-slate-700">{client.phone}</td>
                            <td className="p-3 text-slate-700">
                              {client.clientDetail?.lastHaircut ? (
                                <>
                                  {client.clientDetail.lastAppointmentDate && (
                                    <>{new Date(client.clientDetail.lastAppointmentDate).toLocaleDateString("it-IT")}</>
                                  )}
                                  <br/>
                                  <span className="text-xs text-slate-500">{client.clientDetail.lastHaircut}</span>
                                </>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="p-3 text-slate-700">
                              <span className="text-accent font-medium">{client.clientDetail?.appointmentCount || 0}</span>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Input 
                                  type="text" 
                                  value={
                                    coffeePreferences[client.id] !== undefined 
                                      ? coffeePreferences[client.id] 
                                      : client.clientDetail?.coffeePreference || ""
                                  }
                                  onChange={(e) => handleCoffeePreferenceChange(client.id, e.target.value)} 
                                  className="px-2 py-1 text-sm w-24 h-8"
                                />
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-accent"
                                  onClick={() => handleSaveCoffeePreference(client.id)}
                                >
                                  <i className="fas fa-check text-xs"></i>
                                </Button>
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="text-blue-500 hover:text-blue-700 h-8 w-8">
                                  <i className="fas fa-user-edit"></i>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-slate-500 hover:text-slate-700 h-8 w-8">
                                  <i className="fas fa-history"></i>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="text-red-500 hover:text-red-700 h-8 w-8"
                                  onClick={() => handleDeleteClient(client.id)}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {filteredClients?.length === 0 && (
                    <div className="text-center py-8 text-slate-500">
                      <i className="fas fa-users text-4xl mb-2"></i>
                      <p>Nessun cliente trovato</p>
                    </div>
                  )}
                  
                  {totalPages > 0 && (
                    <div className="mt-6 flex justify-between items-center">
                      <div className="text-sm text-slate-600">
                        Mostrando {indexOfFirstClient + 1}-{Math.min(indexOfLastClient, filteredClients?.length || 0)} di {filteredClients?.length} clienti
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <i className="fas fa-chevron-left"></i>
                        </Button>
                        
                        {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => {
                          const pageNum = currentPage <= 2 
                            ? index + 1 
                            : currentPage >= totalPages - 1 
                              ? totalPages - 2 + index 
                              : currentPage - 1 + index;
                          
                          return pageNum <= totalPages && (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              className={currentPage === pageNum ? "bg-accent text-white" : ""}
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                        
                        <Button 
                          variant="outline" 
                          size="icon" 
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <i className="fas fa-chevron-right"></i>
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteUserId !== null} onOpenChange={() => deleteUserId && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo cliente? Questa azione eliminerà tutti i dati dell'utente e non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">Elimina</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ClientManagement;
