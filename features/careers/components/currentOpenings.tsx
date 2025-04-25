import { Button } from "@/components/ui/button" 
import { useQuery } from "@tanstack/react-query";
import { getAllJobOpenings } from "../lib/api/jobOpenings";
import Link from "next/link";
    
export default function CurrentOpenings() {
    const { data: jobOpenings, isLoading, isError } = useQuery({
        queryKey: ['jobOpenings'],
        queryFn: getAllJobOpenings,
      });
    
      if (isLoading) return <div className="p-10 text-center">Loading job openings...</div>;
      if (isError || !jobOpenings) return <div className="p-10 text-center text-red-600">Failed to load job openings.</div>;
    
return (
        <div className="space-y-6">
            {jobOpenings?.map((opening, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                <div>
                <h3 className="text-xl font-semibold mb-2">{opening.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{opening.location} | Full-time</p>
                <p className="text-gray-600 dark:text-gray-400 mb-4">{opening.description}</p>
                </div>
                <Link href={`/careers/${opening.id}`} className="self-start md:self-center mt-4 md:mt-0">
                <Button variant="default">
                    Apply Now
                </Button> 
                </Link>
            </div>
            </div>
        ))}
        </div>
    );
}       
