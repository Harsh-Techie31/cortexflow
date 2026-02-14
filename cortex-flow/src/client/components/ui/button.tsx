import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils'; // Only import if alias is set up correctly, otherwise relative path

// I need to install class-variance-authority for this pattern which is standard shadcn-ui style
// but to start simple without extra deps if not needed, I will use simple props first.
// However, the user asked for Clean, Minimal, Well structured.
// Using CVA is cleaner for component variants.
// I will stick to simple props for now to avoid installing another package unless I decide to add it.
// Actually, CVA is great. Let me check if I installed it. I didn't.
// I'll stick to a simple implementation for now to avoid "over engineering".

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {

        const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50";

        const variants = {
            primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm",
            secondary: "bg-white text-gray-900 border border-gray-200 hover:bg-gray-50",
            outline: "border border-gray-300 bg-transparent hover:bg-gray-100 text-gray-700",
            ghost: "hover:bg-gray-100 text-gray-700",
        };

        const sizes = {
            sm: "h-8 px-3 text-xs",
            md: "h-10 px-4 py-2 text-sm",
            lg: "h-12 px-8 text-base",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";
