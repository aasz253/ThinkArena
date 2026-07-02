import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";
import { Brain, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";

const schema = z.object({
  username: z.string().min(3, "Min 3 characters").max(50),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Min 6 characters"),
  confirmPassword: z.string(),
  role: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { role: "student" } });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await registerUser(data.username, data.email, data.password, data.role);
      toast.success("Account created! Please log in.");
      navigate("/login");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Brain className="w-12 h-12 text-primary-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-2">Join ThinkArena today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Username" placeholder="Choose a username" error={errors.username?.message} {...register("username")} />
          <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register("email")} />
          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              error={errors.password?.message}
              {...register("password")}
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-9 text-gray-400 hover:text-gray-600">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <Input label="Confirm Password" type="password" placeholder="Confirm your password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">I am a</label>
            <select {...register("role")} className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-primary-500 outline-none">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <Button type="submit" loading={loading} className="w-full">
            Create Account
          </Button>
        </form>

        <p className="text-center mt-6 text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary-500 hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
