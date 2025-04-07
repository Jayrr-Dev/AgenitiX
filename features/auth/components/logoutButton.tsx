"use client";

import { signOutAction } from "@/app/actions";
import { Button, ButtonProps } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useUserStore } from "@/store/userStore";
interface LogoutButtonProps extends Omit<ButtonProps, "onClick"> {
  showIcon?: boolean;
  text?: string;
}

export default function LogoutButton({
  showIcon = true,
  text = "Sign out",
  variant = "outline",
  size = "default",
  className,
  ...props
}: LogoutButtonProps) {
  return (
      <Button 
        type="button" 
        variant={variant} 
        size={size}
        className={className}
        {...props}
        onClick={() => {
          useUserStore.getState().setUserRole(null);
          signOutAction();
        }}
      >
        {showIcon && <LogOut className="mr-2 h-4 w-4" />}
        {text}
      </Button>
  );
}