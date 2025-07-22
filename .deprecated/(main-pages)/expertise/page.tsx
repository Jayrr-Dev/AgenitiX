import CTASection from "@/features/expertise/components/CTASection";
import ClientSuccess from "@/features/expertise/components/ClientSuccess";
import CoreExpertise from "@/features/expertise/components/CoreExpertise";
import EngineeringApproach from "@/features/expertise/components/EngineeringApproach";
import HeroSection from "@/features/expertise/components/HeroSection";
import IndustryStandards from "@/features/expertise/components/IndustryStandards";
import SpecializedServices from "@/features/expertise/components/SpecializedServices";

export default function ExpertisePage() {
	return (
		<div className="container mx-auto px-4 py-12">
			<HeroSection />
			<CoreExpertise />
			<ClientSuccess />
			<SpecializedServices />
			<EngineeringApproach />
			<IndustryStandards />
			<CTASection />
		</div>
	);
}
