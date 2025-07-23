export type ProjectTagsLinks = {
	project_id: string;
	tag_id: string;
};

export type ProjectTagsLinksRecord = ProjectTagsLinks; // Raw table match

export type Tags = {
	tag_id: string;
	tag: string;
};

export type TagsRecord = {
	tag_id: string;
	tag: string;
};

export type RelatedProject = {
	project_id: string;
	title: string;
	tags: Tags[];
	imageUrl: string;
};

export type ProjectShowcase = {
	project_id: string;
	title: string;
	description: string;
	imageUrl: string;
	year: string;
	details: string;
	contactInfo: string;
	outcomes: string[];
	imageCarousel?: string[];
	tags: Tags[];
	relatedProjects: RelatedProject[];
	projectLink: string;
};

export type ProjectShowcaseRecord = {
	project_id: string;
	title: string;
	description: string;
	image_url: string;
	year: string;
	details: string;
	contact_info: string;
	outcomes?: string[];
	image_carousel?: string[];
	project_link: string;
};
