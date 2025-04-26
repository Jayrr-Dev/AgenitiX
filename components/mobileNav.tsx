import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button";
import Link from "next/link";
import { Clock, Menu, User, Calendar } from "lucide-react";  
import React from "react";

export function MobileNav({userRole, session}: { userRole: string | null, session: any}) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="link" 
            className="px-0 text-2xl md:hidden hover:border-b-2 t data-[state=open]:border-b-2 data-[state=open]:border-[#f6733c] data-[state=open]:text-[#f6733c]"
            onClick={(e) => {
              e.currentTarget.classList.add('border-b-2', 'border-[#f6733c]', 'text-[#f6733c]');
              setTimeout(() => {
                e.currentTarget.classList.remove('border-b-2', 'border-[#f6733c]', 'text-[#f6733c]');
              }, 300);
            }}
          >
            <Menu className="h-10 w-10" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </DropdownMenuTrigger>

        {/* If user is not logged in, show the navigation menu */}
        {userRole == null && (
        <DropdownMenuContent align="end" className="w-[85vw] px-8 text-xl">
          <DropdownMenuItem asChild>
            <Link href="/" className="flex items-center w-full">
              {/* <Image src="/logo.png" alt="logo" width={24} height={24} className="h-5 w-auto mr-2" /> */}
              <span className="font-medium">Home</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/about" className="w-full">
              About Us
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/expertise" className="w-full">
              Expertise
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/projects" className="w-full">
              Projects
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/contact" className="w-full">
              Contact
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/careers" className="w-full">
              Careers
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
        )}

        {/* If user is logged in, show the navigation menu */}
        {userRole !== null && (
        <DropdownMenuContent align="end" className="w-[85vw] px-8 text-xl grid grid-cols-1 gap-4">
          <DropdownMenuItem asChild>
            <Link href="./employee_dashboard" legacyBehavior passHref>
            <button className="flex items-center gap-2 py-2 border-b-2 border-solid border-[#f6733c] hover:bg-[#f6733c] hover:text-white rounded-md">
              <User className="h-5 w-5" />
              <span className="font-medium">Employee Dashboard</span>
            </button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="./timesheet" legacyBehavior passHref>
              <button className="flex items-center gap-2 py-2 border-b-2 border-solid border-[#f6733c] hover:bg-[#f6733c] hover:text-white rounded-md">
                <Clock className="h-5 w-5" />
                <span className="font-medium">Timesheet</span>
              </button>
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>  
            <Link href="./vacations" legacyBehavior passHref>
              <button className="flex items-center gap-2 py-2 border-b-2 border-solid border-[#f6733c] hover:bg-[#f6733c] hover:text-white rounded-md">
                <Calendar className="h-5 w-5" />
                <span className="font-medium">Vacations</span>
              </button>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
          </DropdownMenuItem>
        </DropdownMenuContent>
        )}
      </DropdownMenu>
    )
  }
  