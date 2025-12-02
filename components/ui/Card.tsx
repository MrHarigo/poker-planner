import { HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "felt";
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "bg-bg-card border border-border-subtle",
      elevated: "bg-bg-card border border-border-accent shadow-xl shadow-black/20",
      felt: "pattern-felt border border-poker-green-light/30",
    };

    return (
      <div
        ref={ref}
        className={`rounded-xl p-6 ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

