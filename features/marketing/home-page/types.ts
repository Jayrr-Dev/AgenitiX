export type typeFAQ = {
	question: string;
	answer: string;
};

export type typeFeatureBoxesBento = {
	title: string;
	description: string;
	className: string;
	skeleton: string;
};

export type typeFeatureBoxesIconed = {
	title: string;
	description: string;
	icon: string;
	order_index: number;
};

export type typeFeatureBoxesPlain = {
	title: string;
	description: string;
};

export type typeLogo = {
	name: string;
	key: string;
	customId: string | null;
	url: string;
	size: number;
	uploadedAt: string;
	width: number;
	height: number;
};

export type typeTestimonialsTicker = {
	name: string;
	key: string;
	customId: string | null;
	url: string;
	size: number;
	uploadedAt: string;
	review: string;
	"profile-name": string;
	"profile-designation": string;
	location: string;
};

export type typeTestimonialsSlides = {
	quote: string;
	name: string;
	designation: string;
	src: string;
};

export type typeMarqueeImages = {
	name: string;
	key: string;
	customId: string | null;
	url: string;
	size: number;
	uploadedAt: string;
};

export type typeSlides = {
	type: "component" | "image" | "video";
	src: "";
	component: React.ReactNode;
	heading: string;
	title: React.ReactNode;
	message: string;
	ctaText: string;
	ctaLink: string;
};
