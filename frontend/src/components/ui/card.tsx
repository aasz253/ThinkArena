import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children: ReactNode;
  hover?: boolean;
}

export function Card({ className, children, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-xl shadow-gray-900/5",
        hover && "hover:shadow-2xl hover:-translate-y-1 transition-all duration-300",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: CardProps) {
  return <div className={cn("p-6 pb-0", className)}>{children}</div>;
}

export function CardContent({ className, children }: CardProps) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({ className, children }: CardProps) {
  return <div className={cn("p-6 pt-0", className)}>{children}</div>;
}
