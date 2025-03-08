import React from "react";

export interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}

export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children,
  variant = "primary" 
}) => {
  return (
    <button 
      onClick={onClick}
      className={`btn ${variant === "primary" ? "btn-primary" : "btn-secondary"}`}
    >
      {children}
    </button>
  );
};
