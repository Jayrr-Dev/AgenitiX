import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { PlusIcon } from "lucide-react";
import { useTheme } from "next-themes";
import type { typeFAQ } from "../types";

export default function FAQ({ faq }: { faq: typeFAQ[] }) {
  // Get current theme
  const { theme } = useTheme();
  const isDarkTheme = theme === "dark";

  return (
    <div className="relative py-16 lg:py-24">
      {/* Background with subtle pattern */}
      <div
        className={`absolute inset-0 bg-gradient-to-b ${isDarkTheme ? "from-gray-900/50 to-gray-900" : "from-gray-50/50 to-white"}`}
      />

      <div className="relative mx-auto max-w-4xl px-6">
        {/* Enhanced header section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/10 px-4 py-2 mb-6 border border-purple-500/20">
            <div className="h-2 w-2 rounded-full bg-purple-400" />
            <span
              className={`font-medium text-sm tracking-wider uppercase ${isDarkTheme ? "text-purple-400" : "text-purple-600"}`}
            >
              FAQ
            </span>
          </div>

          <h2
            className={`font-bold text-3xl lg:text-4xl xl:text-5xl mb-4 tracking-tight ${isDarkTheme ? "text-white" : "text-gray-900"}`}
          >
            Frequently Asked Questions
          </h2>

          <p
            className={`text-lg max-w-2xl mx-auto leading-relaxed ${isDarkTheme ? "text-white" : "text-gray-600"}`}
          >
            Everything you need to know about AgenitiX automation platform.
            Can't find what you're looking for? Contact our team.
          </p>
        </div>

        {/* Enhanced accordion */}
        <Accordion
          type="single"
          collapsible={true}
          className="space-y-4"
          defaultValue="question-0"
        >
          {faq.map(({ question, answer }, index) => (
            <AccordionItem
              key={question}
              value={`question-${index}`}
              className="group rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-6 py-2 transition-all duration-300 hover:shadow-lg hover:border-purple-200 dark:hover:border-purple-700/50"
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger
                  className={cn(
                    "flex flex-1 items-center justify-between py-6 font-semibold tracking-tight transition-all",
                    "text-start text-lg text-gray-900 dark:text-white",
                    "hover:text-purple-600 dark:hover:text-purple-400",
                    "[&[data-state=open]>svg]:rotate-45 [&[data-state=open]]:text-purple-600 dark:[&[data-state=open]]:text-purple-400"
                  )}
                >
                  {question}
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 transition-all duration-300 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30">
                    <PlusIcon className="h-4 w-4 text-gray-600 dark:text-gray-300 transition-all duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                  </div>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionContent className="text-gray-600 dark:text-gray-300 leading-relaxed pb-6">
                {answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* CTA section */}
        <div className="mt-16 text-center">
          <div className="rounded-2xl bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200/50 dark:border-purple-700/50 p-8">
            <h3
              className={`font-bold text-xl mb-3 ${isDarkTheme ? "text-white" : "text-gray-900"}`}
            >
              Still have questions?
            </h3>
            <p
              className={`mb-6 ${isDarkTheme ? "text-white" : "text-gray-600"}`}
            >
              Our team is here to help you get the most out of AgenitiX
              automation.
            </p>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold text-white transition-all duration-300 hover:bg-purple-700 hover:scale-105 shadow-lg hover:shadow-xl"
              onClick={() =>
                (window.location.href = "mailto:support@agenitix.com")
              }
            >
              Contact Support
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
