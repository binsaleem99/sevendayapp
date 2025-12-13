import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "font-display font-bold uppercase tracking-wider py-4 px-8 transition-all duration-300 text-sm md:text-base active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed rounded-none skew-x-[-10deg]";
  const contentStyles = "inline-block skew-x-[10deg]";
  
  const variants = {
    // Primary: Acid Green -> Hover: White
    primary: "bg-[#CCFF00] text-black hover:bg-white hover:text-black shadow-[4px_4px_0px_rgba(255,255,255,0.2)] hover:shadow-[4px_4px_0px_rgba(204,255,0,0.8)]",
    // Outline: Border Green -> Hover: Fill Green
    outline: "bg-transparent text-[#CCFF00] border-2 border-[#CCFF00] hover:bg-[#CCFF00] hover:text-black",
    ghost: "bg-transparent text-gray-400 hover:text-[#CCFF00]"
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`} 
      {...props}
    >
      <span className={contentStyles}>{children}</span>
    </button>
  );
};