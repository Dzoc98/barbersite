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
import { LockKeyhole } from "lucide-react";

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Il nome utente deve contenere almeno 3 caratteri",
  }),
  password: z.string().min(6, {
    message: "La password deve contenere almeno 6 caratteri",
  }),
});

type FormData = z.infer<typeof formSchema>;

const AdminLogin = () => {
  const { signInAdmin } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });
  
  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      await signInAdmin(data.username, data.password);
      navigate("/");
    } catch (error) {
      toast({
        title: "Errore di accesso",
        description: error.message || "Credenziali amministratore non valide.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <div className="flex justify-center mb-6">
        <div className="bg-primary rounded-full p-4">
          <LockKeyhole className="w-8 h-8 text-white" />
        </div>
      </div>
      <h1 className="font-heading text-3xl font-bold text-center mb-8">Area Amministratore</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username Admin</FormLabel>
                    <FormControl>
                      <Input placeholder="Admin username" {...field} />
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
                    <FormLabel>Password Admin</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Admin password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary-dark font-accent"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                    <span>ACCESSO...</span>
                  </div>
                ) : (
                  "ACCEDI COME ADMIN"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="mt-4 text-center">
            <Link href="/login" className="text-sm text-slate-600 hover:text-accent">
              <i className="fas fa-arrow-left mr-2"></i> Torna all'login utente
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
