"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Clock, Mail } from "lucide-react";
import Link from "next/link";

interface RateLimitWarningProps {
	email: string;
	onDismiss: () => void;
}

export const RateLimitWarning = ({ email, onDismiss }: RateLimitWarningProps) => {
	return (
        <Alert variant="destructive" className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
				<div className="space-y-3">
					<div>
						<strong>Too many login attempts</strong>
						<p className="mt-1 text-sm">
							For security reasons, we've temporarily limited login attempts for{" "}
							<strong>{email}</strong>.
						</p>
					</div>

					<div className="space-y-1 text-sm">
						<p>
							• You can try again in <strong>1 hour</strong>
						</p>
						<p>• Check your email for any pending magic links</p>
						<p>• Make sure you're using the correct email address</p>
					</div>

					<div className="flex gap-2 pt-2">
						<Button
							size="sm"
							variant="outline"
							onClick={onDismiss}
							className="border-orange-300 text-orange-700 hover:bg-orange-100"
						>
							Try Different Email
						</Button>
						<Link href="mailto:support@agenitix.com" legacyBehavior>
							<Button
								size="sm"
								variant="outline"
								className="border-orange-300 text-orange-700 hover:bg-orange-100"
							>
								<Mail className="mr-2 h-4 w-4" />
								Contact Support
							</Button>
						</Link>
					</div>
				</div>
			</AlertDescription>
        </Alert>
    );
};
