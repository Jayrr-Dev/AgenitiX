// app/(main-pages)/projects/[projectId]/ClientProjectPage.tsx
"use client";

import { Button } from "@/components/ui/button";
import { useProjectShowcase } from "@/features/projects/hooks/useProjectShowcase";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = {
	projectId: string;
};

export default function ClientProjectPage() {
	return <div className="container mx-auto px-4 py-12"></div>;
}
