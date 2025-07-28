"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

export default function CookiePolicy() {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild={true}>
				<Button variant="link" className="h-auto p-0 text-muted-foreground text-sm underline">
					Cookie Policy
				</Button>
			</DialogTrigger>
			<DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="text-2xl">Cookie Policy</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 text-sm">
					<p>Last updated: March 18, 2025</p>

					<h3 className="font-medium text-lg">What are cookies?</h3>
					<p>
						Cookies are small text files that are stored on your browser or device by websites,
						apps, online media, and advertisements. They are used to remember your preferences, to
						understand how you interact with our website, and in some cases, to serve you tailored
						advertisements.
					</p>

					<h3 className="font-medium text-lg">How we use cookies</h3>
					<p>We use cookies for several purposes, including:</p>
					<ul className="list-disc space-y-2 pl-5">
						<li>
							<strong>Essential cookies:</strong> These are necessary for the website to function
							and cannot be switched off. They are usually only set in response to actions made by
							you which amount to a request for services, such as setting your privacy preferences,
							logging in, or filling in forms.
						</li>
						<li>
							<strong>Performance cookies:</strong> These allow us to count visits and traffic
							sources so we can measure and improve the performance of our site. They help us know
							which pages are the most and least popular and see how visitors move around the site.
						</li>
						<li>
							<strong>Functionality cookies:</strong> These enable the website to provide enhanced
							functionality and personalization. They may be set by us or by third-party providers
							whose services we have added to our pages.
						</li>
						<li>
							<strong>Targeting cookies:</strong> These may be set through our site by our
							advertising partners. They may be used by those companies to build a profile of your
							interests and show you relevant advertisements on other sites.
						</li>
					</ul>

					<h3 className="font-medium text-lg">Managing cookies</h3>
					<p>
						Most web browsers allow you to manage your cookie preferences. You can set your browser
						to refuse cookies, or to alert you when cookies are being sent. The Help portion of the
						toolbar on most browsers will tell you how to prevent your browser from accepting new
						cookies, how to have the browser notify you when you receive a new cookie, or how to
						disable cookies altogether.
					</p>

					<h3 className="font-medium text-lg">Changes to this policy</h3>
					<p>
						We may update this Cookie Policy from time to time. When we do, we will revise the "last
						updated" date at the top of the policy. We encourage you to check this page periodically
						to stay informed about our use of cookies.
					</p>

					<h3 className="font-medium text-lg">Contact us</h3>
					<p>If you have any questions about this Cookie Policy, please contact us at:</p>
					<p>
						Email: privacy@utilitek.ca
						<br />
						Phone: (780) 555-0123
					</p>
				</div>
			</DialogContent>
		</Dialog>
	);
}
