import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";
import { motion } from "framer-motion";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const { register: registerUser } = useAuth();
  const [error, setError] = useState("");
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    try {
      setError("");
      await registerUser(data);
    } catch (err: any) {
      const apiError = err?.data?.error || err?.data?.message;
      setError(apiError || err?.message || "Failed to register. Please try again.");
    }
  };

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="text-center mb-10 lg:hidden">
            <div className="w-16 h-16 bg-primary rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-display font-bold text-foreground">SmartTerrace</h2>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-black/5 border border-border/50">
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-foreground">Create account</h2>
              <p className="text-muted-foreground mt-2">Start managing your farm smartly.</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-sm font-medium">
                  {error}
                </div>
              )}
              
              <Input
                label="Full Name"
                placeholder="John Farmer"
                {...register("name")}
                error={errors.name?.message}
              />

              <Input
                label="Email Address"
                placeholder="you@farm.com"
                type="email"
                {...register("email")}
                error={errors.email?.message}
              />
              
              <Input
                label="Password"
                placeholder="••••••••"
                type="password"
                {...register("password")}
                error={errors.password?.message}
              />

              <Button 
                type="submit" 
                className="w-full mt-2" 
                size="lg"
                isLoading={isSubmitting}
              >
                Create Account
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Image */}
      <div className="hidden lg:flex flex-1 relative bg-primary items-center justify-center overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`}
          alt="Terrace Farm Landscape"
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay scale-x-[-1]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
        <div className="relative z-10 p-12 text-white max-w-xl text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mx-auto mb-8 flex items-center justify-center border border-white/30">
              <Sprout className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-display font-bold mb-4">Grow Smarter.</h1>
            <p className="text-lg text-white/80 text-balance">
              Join thousands of farmers using data to optimize water usage, monitor crop health, and increase yields.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
