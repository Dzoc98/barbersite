import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
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
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "Il nome deve contenere almeno 2 caratteri",
  }),
  lastName: z.string().min(2, {
    message: "Il cognome deve contenere almeno 2 caratteri",
  }),
  phone: z.string().min(6, {
    message: "Inserisci un numero di telefono valido",
  }),
  username: z.string().min(3, {
    message: "Il nome utente deve contenere almeno 3 caratteri",
  }),
  password: z.string().min(6, {
    message: "La password deve contenere almeno 6 caratteri",
  }),
  confirmPassword: z.string().min(6, {
    message: "Conferma la tua password",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Le password non coincidono",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const Register = () => {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      username: "",
      password: "",
      confirmPassword: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await register({
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        username: data.username,
        password: data.password,
      });
      
      toast({
        title: "Registrazione completata",
        description: "Il tuo account è stato creato con successo!",
      });
      
      navigate("/");
    } catch (error) {
      toast({
        title: "Errore di registrazione",
        description: error.message || "Si è verificato un errore durante la registrazione.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="font-heading text-3xl font-bold text-center mb-8">Registrati</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Il tuo nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cognome *</FormLabel>
                      <FormControl>
                        <Input placeholder="Il tuo cognome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numero di telefono *</FormLabel>
                    <FormControl>
                      <Input placeholder="+39 XXX XXXXXXX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username *</FormLabel>
                    <FormControl>
                      <Input placeholder="Scegli un nome utente" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Crea una password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conferma Password *</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Conferma la password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent-dark font-accent"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>REGISTRAZIONE...</span>
                  </div>
                ) : (
                  "REGISTRATI"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">
              Hai già un account? <Link href="/login" className="text-accent hover:underline">Accedi</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
