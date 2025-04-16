import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";

// Profile update schema
const profileSchema = z.object({
  firstName: z.string().min(2, {
    message: "Il nome deve contenere almeno 2 caratteri",
  }),
  lastName: z.string().min(2, {
    message: "Il cognome deve contenere almeno 2 caratteri",
  }),
  phone: z.string().min(6, {
    message: "Inserisci un numero di telefono valido",
  }),
});

// Password update schema
const passwordSchema = z.object({
  currentPassword: z.string().min(1, {
    message: "Inserisci la password attuale",
  }),
  newPassword: z.string().min(6, {
    message: "La nuova password deve contenere almeno 6 caratteri",
  }),
  confirmPassword: z.string().min(6, {
    message: "Conferma la tua nuova password",
  }),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

const UserProfile = () => {
  const { user, updateProfile, updatePassword, deleteAccount } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      phone: user?.phone || "",
    },
  });
  
  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setIsLoadingProfile(true);
    try {
      await updateProfile(user.id, data);
      toast({
        title: "Profilo aggiornato",
        description: "Le tue informazioni sono state aggiornate con successo.",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare il profilo. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };
  
  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (!user) return;
    
    setIsLoadingPassword(true);
    try {
      await updatePassword(user.id, data.currentPassword, data.newPassword);
      toast({
        title: "Password aggiornata",
        description: "La tua password è stata aggiornata con successo.",
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile aggiornare la password. Assicurati che la password attuale sia corretta.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPassword(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      await deleteAccount(user.id);
      toast({
        title: "Account eliminato",
        description: "Il tuo account è stato eliminato con successo.",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Errore",
        description: error.message || "Impossibile eliminare l'account. Riprova più tardi.",
        variant: "destructive",
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">Il tuo profilo</h1>
      
      <Tabs defaultValue="profile">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="profile">Informazioni Personali</TabsTrigger>
          <TabsTrigger value="security">Sicurezza</TabsTrigger>
        </TabsList>
        
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Aggiorna il tuo profilo</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cognome</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Numero di telefono</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      className="bg-accent hover:bg-accent-dark"
                      disabled={isLoadingProfile}
                    >
                      {isLoadingProfile ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                          <span>Salvataggio...</span>
                        </div>
                      ) : (
                        "Salva modifiche"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cambia password</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...passwordForm}>
                  <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                    <FormField
                      control={passwordForm.control}
                      name="currentPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password attuale</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nuova password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Conferma nuova password</FormLabel>
                          <FormControl>
                            <Input type="password" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end">
                      <Button 
                        type="submit" 
                        className="bg-accent hover:bg-accent-dark"
                        disabled={isLoadingPassword}
                      >
                        {isLoadingPassword ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            <span>Aggiornamento...</span>
                          </div>
                        ) : (
                          "Aggiorna password"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Elimina account</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Questa azione non può essere annullata. Tutti i tuoi dati e prenotazioni verranno eliminati permanentemente.
                </p>
                
                {!showDeleteConfirm ? (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Elimina il mio account
                  </Button>
                ) : (
                  <div className="border border-red-200 bg-red-50 p-4 rounded-md">
                    <p className="text-red-600 font-semibold mb-4">
                      Sei sicuro di voler eliminare il tuo account?
                    </p>
                    <div className="flex gap-2">
                      <Button 
                        variant="destructive" 
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                            <span>Eliminazione...</span>
                          </div>
                        ) : (
                          "Sì, elimina account"
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserProfile;
