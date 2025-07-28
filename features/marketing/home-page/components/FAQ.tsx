import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { PlusIcon } from "lucide-react";
import type { typeFAQ } from "../types";

export default function FAQ({ faq }: { faq: typeFAQ[] }) {
	return (
		<div className="flex min-h-screen items-center justify-center px-6 py-12">
			<div className="w-full max-w-2xl">
				<h2 className="!leading-[1.15] font-bold text-4xl tracking-tight md:text-5xl">
					Frequently Asked Questions
				</h2>
				<p className="mt-1.5 text-lg text-muted-foreground">
					Quick answers to common questions about our products and services.
				</p>

				<Accordion
					type="single"
					collapsible={true}
					className="mt-8 space-y-4"
					defaultValue="question-0"
				>
					{faq.map(({ question, answer }, index) => (
						<AccordionItem
							key={question}
							value={`question-${index}`}
							className="rounded-xl border-none bg-accent px-4 py-1"
						>
							<AccordionPrimitive.Header className="flex">
								<AccordionPrimitive.Trigger
									className={cn(
										"flex flex-1 items-center justify-between py-4 font-semibold tracking-tight transition-all hover:underline [&[data-state=open]>svg]:rotate-45",
										"text-start text-lg"
									)}
								>
									{question}
									<PlusIcon className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200" />
								</AccordionPrimitive.Trigger>
							</AccordionPrimitive.Header>
							<AccordionContent>{answer}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</div>
		</div>
	);
}
