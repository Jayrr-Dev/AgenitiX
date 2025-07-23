"use client";
import Turnstile from "@/components/turnstile";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { ChangeEvent, FormEvent, use, useState } from "react";

export default function CareerApplicationPage({ params }: { params: Promise<{ apply: string }> }) {
	return <div className="container mx-auto px-4 py-12"></div>;
}
