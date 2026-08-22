import Link from "next/link";
import type { ReactNode, ButtonHTMLAttributes } from "react";

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`container-page ${className}`}>{children}</div>;
}

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};
const buttonVariants = {
  primary: "bg-brand text-white hover:bg-brand-dark",
  secondary: "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-gray-700 hover:bg-gray-100",
  dark: "bg-gray-900 text-white hover:bg-gray-800",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
}

export function Button({ variant = "primary", size = "md", className = "", ...props }: ButtonProps) {
  return (
    <button className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`} {...props} />
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className = "",
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${buttonBase} ${buttonSizes[size]} ${buttonVariants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}>{children}</div>;
}

const badgeColors: Record<string, string> = {
  gray: "bg-gray-100 text-gray-700",
  green: "bg-green-100 text-green-700",
  red: "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-800",
  blue: "bg-blue-100 text-blue-700",
  purple: "bg-purple-100 text-purple-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export function Badge({ color = "gray", children }: { color?: keyof typeof badgeColors; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${badgeColors[color]}`}>
      {children}
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${props.className ?? ""}`}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${props.className ?? ""}`}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 ${props.className ?? ""}`}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-sm text-red-600">{children}</p>;
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-4">
      <p className="text-lg font-semibold text-gray-900">{title}</p>
      {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ variant = "info", children }: { variant?: "info" | "success" | "warning" | "error"; children: ReactNode }) {
  const styles = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-green-50 text-green-800 border-green-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    error: "bg-red-50 text-red-800 border-red-200",
  };
  return <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>{children}</div>;
}

export function SectionHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description?: string }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="text-sm font-semibold text-brand uppercase tracking-wide mb-2">{eyebrow}</p>}
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
      {description && <p className="mt-2 text-gray-600 max-w-2xl">{description}</p>}
    </div>
  );
}
