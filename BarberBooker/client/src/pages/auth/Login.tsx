import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FcGoogle } from 'react-icons/fc';

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
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Il nome utente deve contenere almeno 3 caratteri",
  }),
  password: z.string().min(6, {
    message: "La password deve contenere almeno 6 caratteri",
  }),
});

type FormData = z.infer<typeof formSchema>;

const Login = () => {
  const { signIn, signInWithGoogle } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
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
      await signIn(data.username, data.password);
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Errore di accesso",
        description: error?.message || "Credenziali non valide. Controlla nome utente e password.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Errore di accesso con Google",
        description: error?.message || "Si è verificato un errore durante l'accesso con Google. Riprova più tardi.",
        variant: "destructive",
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-md">
      <h1 className="font-heading text-3xl font-bold text-center mb-8">Accedi</h1>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Il tuo nome utente" {...field} />
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
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="La tua password" {...field} />
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
                    <span>ACCESSO...</span>
                  </div>
                ) : (
                  "ACCEDI"
                )}
              </Button>
            </form>
          </Form>
          
          <div className="my-6 relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Oppure</span>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            type="button"
          >
            {isGoogleLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
                <span>ACCESSO GOOGLE...</span>
              </div>
            ) : (
              <>
                <FcGoogle className="h-5 w-5" />
                <span>Accedi con Google</span>
              </>
            )}
          </Button>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600">
              Non hai un account? <Link href="/register" className="text-accent hover:underline">Registrati</Link>
            </p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-200 text-center">
            <Link href="/admin-login" className="text-sm text-slate-600 hover:text-accent">
              Accesso Admin
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
