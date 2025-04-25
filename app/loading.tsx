import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";   

export default function Loading() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className={cn("animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary")}></Loader2>
        </div>
    );
}

