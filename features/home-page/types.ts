export type typeFAQ = {
    question: string;
    answer: string;
}

export type typeFeatureBoxesBento = {
    title: string;
    description: string;
    className: string;
    skeleton: string;
}

export type typeFeatureBoxesIconed = {
    title: string;
    description: string;
    icon: string;
    order_index: number;
}

export type typeFeatureBoxesPlain = {
    title: string;
    description: string;
}

export type typeLogo = {
    name: string;
    key: string;
    customId: string | null;
    url: string;
    size: number;
    uploadedAt: string;
    width: number;
    height: number;
}

export type typeTestimonials = {
    quote: string;
    name: string;
    designation: string;
    src: string;
}
