/* components/footer.tsx */
"use client";
import { LogomarkLight } from "@/branding/logomark-svg";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { CookiePolicy } from "@/features/cookies";
import Link from "next/link";
export default function Footer() {
	return (
		<footer className="w-full border-border border-t bg-background">
			<div className="container mx-auto px-6 py-12">
				{/* GRID */}
				<div className="grid grid-cols-1 gap-8 md:grid-cols-4">
					{/* Brand & blurb */}
					<div className="space-y-4">
						<div className="flex items-center pt-2">
							<LogomarkLight className="mr-2 h-8 w-8" />
							<span className="font-brand text-brand text-xl">Agenitix</span>
						</div>

						<p className="font-serif text-mutedFg text-sm">
							Agenitix builds agentic-AI tooling for developers who need production-grade autonomy
							out of the box.
						</p>
					</div>

					{/* Quick links */}
					<div className="space-y-4">
						<h3 className="font-semibold font-ui text-foreground text-lg">Quick Links</h3>
						<ul className="space-y-2 font-ui text-sm">
							{[
								{ href: "/about", label: "About" },
								{ href: "/expertise", label: "Expertise" },
								{ href: "/projects", label: "Projects" },
								{ href: "/careers", label: "Careers" },
								{ href: "/contact", label: "Contact" },
							].map((l) => (
								<li key={l.href}>
									<Link
										href={l.href}
										className="text-mutedFg transition-colors hover:text-secondary"
										legacyBehavior={true}
									>
										{l.label}
									</Link>
								</li>
							))}
						</ul>
					</div>

					{/* Contact */}
					<div className="space-y-4">
						<h3 className="font-semibold font-ui text-foreground text-lg">Contact</h3>
						<ul className="space-y-2 font-ui text-mutedFg text-sm">
							<li className="flex items-center gap-2">
								{/* mail icon */}
								<svg
									className="h-4 w-4 text-secondary"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2
                    2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
									/>
								</svg>
								<span>hello@agenitix.ai</span>
							</li>
							<li className="flex items-center gap-2">
								{/* clock icon */}
								<svg
									className="h-4 w-4 text-secondary"
									fill="none"
									stroke="currentColor"
									strokeWidth={2}
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>Mon – Fri 8 AM – 5 PM MST</span>
							</li>
						</ul>
					</div>

					{/* Social + theme toggle */}
					<div className="space-y-4">
						<h3 className="font-semibold font-ui text-foreground text-lg">Connect</h3>
						<div className="mb-4 flex items-center space-x-4">
							{[
								{ href: "#", icon: "facebook" },
								{ href: "#", icon: "instagram" },
								{
									href: "https://www.linkedin.com/company/agenitix",
									icon: "linkedin",
								},
							].map((s) => (
								<a
									key={s.icon}
									href={s.href}
									className="text-mutedFg transition-colors hover:text-secondary"
								>
									<svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
										{/* — Replace with real icons or lucide-react — */}
										<circle cx="12" cy="12" r="10" />
									</svg>
								</a>
							))}
							<ThemeSwitcher />
						</div>
					</div>
				</div>

				{/* bottom bar */}
				<div className="mt-8 flex flex-col items-center justify-between gap-6 border-border border-t pt-8 font-ui text-mutedFg text-sm md:flex-row">
					<p>© {new Date().getFullYear()} Agenitix. All rights reserved.</p>

					<div className="flex flex-wrap items-center gap-6">
						<Link href="/privacy" className="transition-colors hover:text-secondary">
							Privacy
						</Link>
						<Link href="/terms" className="transition-colors hover:text-secondary">
							Terms
						</Link>
						<CookiePolicy />
						<Link href="/sitemap" className="transition-colors hover:text-secondary">
							Sitemap
						</Link>
					</div>
				</div>
			</div>
		</footer>
	);
}
