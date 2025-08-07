import type {
  typeFAQ,
  typeFeatureBoxesBento,
  typeFeatureBoxesIconed,
  typeFeatureBoxesPlain,
  typeLogo,
  typeMarqueeImages,
  typeTestimonialsSlides,
  typeTestimonialsTicker,
} from "./types";

export const faq: typeFAQ[] = [
  {
    question: "What makes AgenitiX different from other automation platforms?",
    answer:
      "AgenitiX combines the power of AI with visual workflow building, making complex automation accessible without coding. Our platform offers enterprise-grade reliability with startup simplicity, plus built-in AI capabilities for intelligent decision-making.",
  },
  {
    question: "How quickly can I see results from implementing automation?",
    answer:
      "Most customers see immediate time savings within the first week. Complex workflows typically show ROI within 30 days, with many reporting 70-80% reduction in manual tasks and significant cost savings.",
  },
  {
    question: "Do I need technical skills to use AgenitiX?",
    answer:
      "No coding required! Our visual workflow builder is designed for business users. If you can create a flowchart, you can build powerful automations. We also provide templates, training, and support to get you started quickly.",
  },
  {
    question: "What systems can AgenitiX integrate with?",
    answer:
      "AgenitiX integrates with 1000+ applications including CRMs (Salesforce, HubSpot), email platforms (Gmail, Outlook), databases (PostgreSQL, MySQL), cloud services (AWS, Azure), and any system with an API through our universal connectors.",
  },
  {
    question: "How secure is my data with AgenitiX?",
    answer:
      "Your data security is our top priority. We're SOC2, HIPAA, and GDPR compliant with end-to-end encryption, zero-trust architecture, and regular security audits. Your data never leaves our secure infrastructure without your explicit permission.",
  },
];

export const featureBoxesBento: typeFeatureBoxesBento[] = [
  {
    title: "Visual workflow builder",
    description:
      "Design complex automation workflows with our intuitive drag-and-drop interface. No coding required, just connect nodes and build powerful AI-driven processes.",
    className:
      "col-span-1 lg:col-span-1 border-b lg:border-b lg:border-r dark:border-neutral-800",
    skeleton: "SkeletonOne",
  },
  {
    title: "AI-powered automation",
    description:
      "Leverage advanced AI capabilities to handle complex business logic, data processing, and intelligent decision-making in your workflows.",
    skeleton: "SkeletonTwo",
    className:
      "col-span-1 lg:col-span-1 border-b lg:border-b dark:border-neutral-800",
  },
  {
    title: "Enterprise integrations",
    description:
      "Connect seamlessly with over 1000+ business applications including CRMs, email platforms, databases, and custom APIs through our extensive integration library.",
    className: "col-span-1 lg:col-span-1 lg:border-r dark:border-neutral-800",
    skeleton: "SkeletonThree",
  },
  {
    title: "Deploy instantly",
    description:
      "Launch your automation workflows in production with one click. Our cloud infrastructure automatically scales to handle any workload, ensuring 99.9% uptime.",
    className: "col-span-1 lg:col-span-1",
    skeleton: "SkeletonFour",
  },
];

export const featureBoxesIconed: typeFeatureBoxesIconed[] = [
  {
    title: "Built for business leaders",
    description:
      "Designed for decision-makers, operations teams, and growth-focused organizations who need automation without technical complexity.",
    icon: "IconTerminal2",
    order_index: 1,
  },
  {
    title: "No-code simplicity",
    description:
      "Build sophisticated workflows with our visual interface. Powerful enough for enterprises, simple enough for any team member to use.",
    icon: "IconEaseInOut",
    order_index: 2,
  },
  {
    title: "Transparent pricing",
    description:
      "Scale with confidence using our usage-based pricing model. No hidden fees, no vendor lock-in, start free and pay as you grow.",
    icon: "IconCurrencyDollar",
    order_index: 3,
  },
  {
    title: "Enterprise reliability",
    description:
      "Bank-grade security with 99.9% uptime SLA. Your critical business processes run reliably on our battle-tested infrastructure.",
    icon: "IconCloud",
    order_index: 4,
  },
  {
    title: "Team collaboration",
    description:
      "Share workflows, manage permissions, and collaborate seamlessly with role-based access controls and team workspaces.",
    icon: "IconRouteAltLeft",
    order_index: 5,
  },
  {
    title: "Expert support",
    description:
      "Get help when you need it with our dedicated customer success team and comprehensive automation consulting services.",
    icon: "IconHelp",
    order_index: 6,
  },
  {
    title: "ROI guarantee",
    description:
      "See measurable results within 30 days or we'll work with you to optimize your workflows until you achieve your automation goals.",
    icon: "IconAdjustmentsBolt",
    order_index: 7,
  },
  {
    title: "Future-proof platform",
    description:
      "Stay ahead with continuous AI innovation, regular feature updates, and seamless migration paths as your business evolves.",
    icon: "IconHeart",
    order_index: 8,
  },
];

export const featureBoxesPlain: typeFeatureBoxesPlain[] = [
  {
    title: "Enterprise security & compliance",
    description:
      "HIPAA, SOC2, and GDPR compliant platform with end-to-end encryption, ensuring your sensitive business data remains protected at all times.",
  },
  {
    title: "AI-powered decision making",
    description:
      "Let artificial intelligence handle complex business logic, data analysis, and routing decisions, reducing manual work and eliminating human error.",
  },
  {
    title: "Real-time analytics dashboard",
    description:
      "Monitor workflow performance, track automation ROI, and identify optimization opportunities with comprehensive analytics and custom reporting.",
  },
  {
    title: "Multi-channel automation",
    description:
      "Automate across email, SMS, web forms, databases, APIs, and more with unified workflows that connect all your business systems.",
  },
  {
    title: "Smart error handling",
    description:
      "Built-in retry logic, fallback mechanisms, and intelligent error recovery ensure your critical processes never fail silently.",
  },
  {
    title: "Version control & rollback",
    description:
      "Track workflow changes, collaborate with your team, and instantly rollback to previous versions with Git-like version control.",
  },
  {
    title: "Custom workflow templates",
    description:
      "Start quickly with pre-built templates for common business processes, or create custom templates to standardize across your organization.",
  },
  {
    title: "API-first architecture",
    description:
      "Integrate with any system using our REST APIs, webhooks, and SDKs. Build custom integrations and extend platform capabilities.",
  },
];

/**
 * LOGOS
 * Array of logo objects for the marketing logo ticker
 */
export const logos: typeLogo[] = [
  {
    name: "website-component-images-shitthatiknit.webp",
    key: "EORhWwIHc4gytssuBWiLlRschKQv5IeoAF41WmCzTj7GZUXE",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gytssuBWiLlRschKQv5IeoAF41WmCzTj7GZUXE",
    size: 3240,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-shopify.webp",
    key: "EORhWwIHc4gyUp0tsE6F8yXYueB3Wh6qCdgoQGtSmvE4i0Ol",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyUp0tsE6F8yXYueB3Wh6qCdgoQGtSmvE4i0Ol",
    size: 4934,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-madebymary.webp",
    key: "EORhWwIHc4gymv5j3OEuBMdLGxIojUmh1vbe5DOYqysEk8tw",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gymv5j3OEuBMdLGxIojUmh1vbe5DOYqysEk8tw",
    size: 2608,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-juniper.webp",
    key: "EORhWwIHc4gydJv8VEBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gydJv8VEBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    size: 1590,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-ramotion.webp",
    key: "EORhWwIHc4gyds7PGhBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyds7PGhBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    size: 1734,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-inpost.webp",
    key: "EORhWwIHc4gyH58L3mN7N4UkvDziRpT3BxWoA1rZjt90wbeE",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyH58L3mN7N4UkvDziRpT3BxWoA1rZjt90wbeE",
    size: 3868,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-fedex.webp",
    key: "EORhWwIHc4gy2FUxODM6VaRfclr9EJsbQqhAKi2wLgUCzpxk",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy2FUxODM6VaRfclr9EJsbQqhAKi2wLgUCzpxk",
    size: 3806,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-existgreen.webp",
    key: "EORhWwIHc4gyDYOgVhtMucJXVHPGAnvdeZ6bop2jyCIiDx7g",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyDYOgVhtMucJXVHPGAnvdeZ6bop2jyCIiDx7g",
    size: 1422,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-intuit.webp",
    key: "EORhWwIHc4gyKuROKtdMOypjis8ChVKlLPvU93kW5uFo1cRA",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyKuROKtdMOypjis8ChVKlLPvU93kW5uFo1cRA",
    size: 3032,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-moonstruck.webp",
    key: "EORhWwIHc4gyCDp1k6U4ea5RlzPBHvOUT7ydpV6njYcuMmiw",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyCDp1k6U4ea5RlzPBHvOUT7ydpV6njYcuMmiw",
    size: 3700,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-morningtide.webp",
    key: "EORhWwIHc4gyTZ8qWTHfx6EnDrMdLVkYS3lz1Z7UebNTopB4",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyTZ8qWTHfx6EnDrMdLVkYS3lz1Z7UebNTopB4",
    size: 3652,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-opera.webp",
    key: "EORhWwIHc4gyKhCnZOdMOypjis8ChVKlLPvU93kW5uFo1cRA",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyKhCnZOdMOypjis8ChVKlLPvU93kW5uFo1cRA",
    size: 4336,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-base.webp",
    key: "EORhWwIHc4gypBHDyi3KufhT4L2c5iHObMjYnNp9KyxoZXRP",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gypBHDyi3KufhT4L2c5iHObMjYnNp9KyxoZXRP",
    size: 1964,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-whites.webp",
    key: "EORhWwIHc4gy3dHZr8VpG2P9iDeUKc1SVQsxBIfFg4znpZ8a",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy3dHZr8VpG2P9iDeUKc1SVQsxBIfFg4znpZ8a",
    size: 4964,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-druthers.webp",
    key: "EORhWwIHc4gy1262ufaPOj0w2vc5WzsXeJUgRYpaE89fmDnr",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy1262ufaPOj0w2vc5WzsXeJUgRYpaE89fmDnr",
    size: 1402,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-literati.webp",
    key: "EORhWwIHc4gyvZy2VMRwQmfsiAOb0r2BCudKTGk8ga5q6cxM",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyvZy2VMRwQmfsiAOb0r2BCudKTGk8ga5q6cxM",
    size: 1890,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-bolt.webp",
    key: "EORhWwIHc4gypCtbIRKufhT4L2c5iHObMjYnNp9KyxoZXRPk",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gypCtbIRKufhT4L2c5iHObMjYnNp9KyxoZXRPk",
    size: 3124,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-jasper.webp",
    key: "EORhWwIHc4gyR66Yf1NEVBIxwvUK5fCci1472ygqapJu6HXk",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyR66Yf1NEVBIxwvUK5fCci1472ygqapJu6HXk",
    size: 2472,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-clickup.webp",
    key: "EORhWwIHc4gyCYCQ8nU4ea5RlzPBHvOUT7ydpV6njYcuMmiw",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyCYCQ8nU4ea5RlzPBHvOUT7ydpV6njYcuMmiw",
    size: 4362,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-square.webp",
    key: "EORhWwIHc4gyv5U8xwRwQmfsiAOb0r2BCudKTGk8ga5q6cxM",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyv5U8xwRwQmfsiAOb0r2BCudKTGk8ga5q6cxM",
    size: 3312,
    uploadedAt: "2025-04-29T13:16:55.000Z",
    width: 180,
    height: 60,
  },
  {
    name: "website-component-images-agenitiX.webp",
    key: "EORhWwIHc4gy98vCVQXnvd0FBAOChWPpUI7LwlytcoN5fm4Q",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy98vCVQXnvd0FBAOChWPpUI7LwlytcoN5fm4Q",
    size: 3174,
    uploadedAt: "2025-04-29T13:16:54.000Z",
    width: 180,
    height: 60,
  },
];

export const testimonialsSlides: typeTestimonialsSlides[] = [
  {
    quote:
      "AgenitiX transformed our customer onboarding process completely. What used to take our team 3 hours per customer now runs automatically in 15 minutes. The ROI was immediate and measurable.",
    name: "Sarah Chen",
    designation: "Head of Operations at TechFlow",
    src: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=3560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "We implemented AgenitiX across our entire sales pipeline in just two weeks. The visual workflow builder made it simple for our non-technical team to create sophisticated automations.",
    name: "Michael Rodriguez",
    designation: "CTO at InnovateSphere",
    src: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "The AI-powered decision making in AgenitiX eliminated 80% of our manual data processing. Our team can now focus on strategic work instead of repetitive tasks.",
    name: "Emily Watson",
    designation: "Operations Director at CloudScale",
    src: "https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=3540&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "AgenitiX seamlessly integrated with our existing tech stack. The API connectors and pre-built templates saved us months of development time. Best automation investment we've made.",
    name: "James Kim",
    designation: "Engineering Lead at DataPro",
    src: "https://images.unsplash.com/photo-1636041293178-808a6762ab39?q=80&w=3464&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    quote:
      "From startup to scale-up, AgenitiX grew with us. The platform handles our 10x increased workflow volume without breaking a sweat. Truly enterprise-grade automation.",
    name: "Lisa Thompson",
    designation: "VP of Technology at FutureNet",
    src: "https://images.unsplash.com/photo-1624561172888-ac93c696e10c?q=80&w=2592&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];

/**
 * MARQUEE IMAGES
 * Array of image URLs for the marketing marquee display
 */
export const imagesMarquee: typeMarqueeImages[] = [
  {
    name: "website-3dmarquee-images-UI10.webp",
    key: "EORhWwIHc4gyDIh5vutMucJXVHPGAnvdeZ6bop2jyCIiDx7g",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyDIh5vutMucJXVHPGAnvdeZ6bop2jyCIiDx7g",
    size: 11714,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI13.webp",
    key: "EORhWwIHc4gyH5fdwmD7N4UkvDziRpT3BxWoA1rZjt90wbeE",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyH5fdwmD7N4UkvDziRpT3BxWoA1rZjt90wbeE",
    size: 18606,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI1.webp",
    key: "EORhWwIHc4gyGB9tuq0uc4YR8oQZEx2Dz9JArqb0wjKGv6TP",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyGB9tuq0uc4YR8oQZEx2Dz9JArqb0wjKGv6TP",
    size: 22732,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-diagram4.webp",
    key: "EORhWwIHc4gyPMZH3dgla6DpN2H1Jr9WZqFCVlzBY78inewE",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyPMZH3dgla6DpN2H1Jr9WZqFCVlzBY78inewE",
    size: 5670,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI8.webp",
    key: "EORhWwIHc4gypakItjKufhT4L2c5iHObMjYnNp9KyxoZXRPk",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gypakItjKufhT4L2c5iHObMjYnNp9KyxoZXRPk",
    size: 26992,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI7.webp",
    key: "EORhWwIHc4gyN5BKGMqWAQhwEkv7eIrm6Y54UsFblpTVyLKj",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyN5BKGMqWAQhwEkv7eIrm6Y54UsFblpTVyLKj",
    size: 26878,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-diagram2.webp",
    key: "EORhWwIHc4gyvGbbWBRwQmfsiAOb0r2BCudKTGk8ga5q6cxM",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyvGbbWBRwQmfsiAOb0r2BCudKTGk8ga5q6cxM",
    size: 11732,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-why.webp",
    key: "EORhWwIHc4gyCAw5TIU4ea5RlzPBHvOUT7ydpV6njYcuMmiw",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyCAw5TIU4ea5RlzPBHvOUT7ydpV6njYcuMmiw",
    size: 13664,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-promotion.webp",
    key: "EORhWwIHc4gyRuPh3BNEVBIxwvUK5fCci1472ygqapJu6HXk",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyRuPh3BNEVBIxwvUK5fCci1472ygqapJu6HXk",
    size: 23806,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI2.webp",
    key: "EORhWwIHc4gyxHDBqy40plPXFhxq1ojsY2KVT7ticAEu6mvz",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyxHDBqy40plPXFhxq1ojsY2KVT7ticAEu6mvz",
    size: 11766,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI12.webp",
    key: "EORhWwIHc4gyxeNjJz40plPXFhxq1ojsY2KVT7ticAEu6mvz",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyxeNjJz40plPXFhxq1ojsY2KVT7ticAEu6mvz",
    size: 11710,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-diagram1.webp",
    key: "EORhWwIHc4gylDcC1WC2HKfpMqcECx0SmFrysdTIjOYlVthJ",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gylDcC1WC2HKfpMqcECx0SmFrysdTIjOYlVthJ",
    size: 7610,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-diagram5.webp",
    key: "EORhWwIHc4gyngIHAwoKQPH0X5ltL8A97B1hJdpTUemjG3Mi",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyngIHAwoKQPH0X5ltL8A97B1hJdpTUemjG3Mi",
    size: 8666,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI6.webp",
    key: "EORhWwIHc4gyBgm7pjkJ4OiWC9STILu6zjVxUPpeNHYXRd2Z",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyBgm7pjkJ4OiWC9STILu6zjVxUPpeNHYXRd2Z",
    size: 16620,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI11.webp",
    key: "EORhWwIHc4gyijuMwnZWJtENGUafYMuHF6ilZB7pXbk1PCOj",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyijuMwnZWJtENGUafYMuHF6ilZB7pXbk1PCOj",
    size: 18370,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-diagram3.webp",
    key: "EORhWwIHc4gy1Hs58HaPOj0w2vc5WzsXeJUgRYpaE89fmDnr",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy1Hs58HaPOj0w2vc5WzsXeJUgRYpaE89fmDnr",
    size: 7668,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI9.webp",
    key: "EORhWwIHc4gytgQ92IiLlRschKQv5IeoAF41WmCzTj7GZUXE",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gytgQ92IiLlRschKQv5IeoAF41WmCzTj7GZUXE",
    size: 19760,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI4.webp",
    key: "EORhWwIHc4gyDZNuEnDtMucJXVHPGAnvdeZ6bop2jyCIiDx7",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyDZNuEnDtMucJXVHPGAnvdeZ6bop2jyCIiDx7",
    size: 11218,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-diagram6.webp",
    key: "EORhWwIHc4gy1Yfn1zaPOj0w2vc5WzsXeJUgRYpaE89fmDnr",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy1Yfn1zaPOj0w2vc5WzsXeJUgRYpaE89fmDnr",
    size: 6942,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI3.webp",
    key: "EORhWwIHc4gyG3uuLI0uc4YR8oQZEx2Dz9JArqb0wjKGv6TP",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyG3uuLI0uc4YR8oQZEx2Dz9JArqb0wjKGv6TP",
    size: 22274,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-UI5.webp",
    key: "EORhWwIHc4gykGFvadwcjghOHFYtxLdZq9wiNVrDJ5Xb7Skl",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gykGFvadwcjghOHFYtxLdZq9wiNVrDJ5Xb7Skl",
    size: 18068,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
  {
    name: "website-3dmarquee-images-logodarkbg.webp",
    key: "EORhWwIHc4gy8gbpLePA3FeuKCEH7JWmsjRTrcI4X9Qp6Vtz",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy8gbpLePA3FeuKCEH7JWmsjRTrcI4X9Qp6Vtz",
    size: 4124,
    uploadedAt: "2025-04-28T15:52:12.000Z",
  },
];

/**
 * TESTIMONIALS
 * Collection of quotes and attributions for marketing display
 */
export const testimonials: typeTestimonialsTicker[] = [
  {
    name: "website-image-reviews-MarcDelaney.webp",
    key: "EORhWwIHc4gyJS9RS8c2EKL7ISpG9ATfWb18YyBltjugVCw5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyJS9RS8c2EKL7ISpG9ATfWb18YyBltjugVCw5",
    size: 5092,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "Running a creative agency was overwhelming. Agenitix built automations for onboarding, feedback, and scheduling—freeing me to focus on design work. I still don’t get how n8n works, but I don’t need to. They made everything seamless.",
    "profile-name": "Marc Delaney",
    "profile-designation": "Founder of Lumiside Creative",
    location: "Vancouver, BC",
  },
  {
    name: "website-image-reviews-ChrisWhitman.webp",
    key: "EORhWwIHc4gy2QmCa2M6VaRfclr9EJsbQqhAKi2wLgUCzpxk",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy2QmCa2M6VaRfclr9EJsbQqhAKi2wLgUCzpxk",
    size: 6354,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "Managing sales and inventory used to be chaos. Agenitix built AI workflows that sync everything. Now I get one clean dashboard. No fluff. Their team truly understood our needs—and it shows in the results.",
    "profile-name": "Chris Whitman",
    "profile-designation": "Owner of Northstyle Retail Group",
    location: "Winnipeg, MB",
  },
  {
    name: "website-image-reviews-MichelleFournier.webp",
    key: "EORhWwIHc4gyTzl035Hfx6EnDrMdLVkYS3lz1Z7UebNTopB4",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyTzl035Hfx6EnDrMdLVkYS3lz1Z7UebNTopB4",
    size: 5512,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "AgenitiX transformed our customer support by implementing an AI agent that handles inquiries efficiently. Their team was attentive and delivered a solution that exceeded our expectations.",
    "profile-name": "Michelle Fournier",
    "profile-designation": "Owner of Michelle's Sweets & Treats",
    location: "Toronto, ON",
  },
  {
    name: "website-image-reviews-DwainBrowne.webp",
    key: "EORhWwIHc4gy4orqaiT9m2Sw8oJbKLV6FZsuQhEBv3WkcYOd",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy4orqaiT9m2Sw8oJbKLV6FZsuQhEBv3WkcYOd",
    size: 5220,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "We needed a comprehensive solution for our business operations. AgenitiX delivered with their no-code tools, simplifying our processes and improving productivity. Their dedication is evident.",
    "profile-name": "Dwain Browne",
    "profile-designation": "Founder of SnapSuite.io",
    location: "Toronto, ON",
  },
  {
    name: "website-image-reviews-JonathanTurner.webp",
    key: "EORhWwIHc4gymixX6NEuBMdLGxIojUmh1vbe5DOYqysEk8tw",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gymixX6NEuBMdLGxIojUmh1vbe5DOYqysEk8tw",
    size: 5824,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "Our real estate systems were disconnected. Agenitix integrated CRMs, email, and forms using no-code AI. Follow-up time dropped by 70%. I thought we’d need a dev team—turns out, we didn’t.",
    "profile-name": "Jonathan Turner",
    "profile-designation": "Managing Partner of Ridgeview Realty",
    location: "Calgary, AB",
  },
  {
    name: "website-image-reviews-DanielMorgan.webp",
    key: "EORhWwIHc4gyrZ5xerJWTRqfDgjpYdSBsGPx2UEl65cIMmZN",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyrZ5xerJWTRqfDgjpYdSBsGPx2UEl65cIMmZN",
    size: 4698,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "Our ops team used to chase spreadsheets and status updates. Agenitix automated order tracking, inventory, and reports—no tech learning needed. It’s like hiring a smart, affordable process manager. Best tech partner we’ve had.",
    "profile-name": "Daniel Morgan",
    "profile-designation": "CEO of TrueNorth Logistics Inc.",
    location: "Toronto, ON",
  },
  {
    name: "website-image-reviews-RicardoBargayo.webp",
    key: "EORhWwIHc4gydc5nbdBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gydc5nbdBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    size: 4730,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "We needed a modern website for our vintage clothing store. AgenitiX delivered a sleek, user-friendly site that our customers love. Their professionalism and attention to detail were outstanding.",
    "profile-name": "Ricardo Bargayo",
    "profile-designation": "Founder of Adobo Vintage YYC",
    location: "Calgary, AB",
  },
  {
    name: "website-image-reviews-LiamPatterson.webp",
    key: "EORhWwIHc4gydNjmTIBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gydNjmTIBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    size: 5194,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "I used to juggle tools for each client. Agenitix built flows that handle reports, updates, and content—no code, no extra software. I’ve saved hours and clients noticed. Can’t work without it now.",
    "profile-name": "Liam Patterson",
    "profile-designation": "Freelance Marketing Strategist",
    location: "Halifax, NS",
  },
  {
    name: "website-image-reviews-LisaHordijczuk.webp",
    key: "EORhWwIHc4gydQScfMBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gydQScfMBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    size: 5492,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "Our small business needed an app to manage appointments. AgenitiX developed a straightforward, easy-to-use app that our clients appreciate. Their team was supportive throughout the process.",
    "profile-name": "Lisa Hordijczuk",
    "profile-designation": "Owner of Self Employed Services",
    location: "Toronto, ON",
  },
  {
    name: "website-image-reviews-DerekLowry.webp",
    key: "EORhWwIHc4gyWaU3oXjSbh93sBIK52fieTwcku8j0DnEJqyd",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyWaU3oXjSbh93sBIK52fieTwcku8j0DnEJqyd",
    size: 5460,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "We approached AgenitiX for AI automation in our construction business. They provided solutions that streamlined our operations, leading to increased efficiency. Their expertise is commendable.",
    "profile-name": "Derek Lowry",
    "profile-designation": "Owner of Self Employment Specialists",
    location: "Edmonton, AB",
  },
  {
    name: "website-image-reviews-ChristineIsted.webp",
    key: "EORhWwIHc4gy3lF2NSpG2P9iDeUKc1SVQsxBIfFg4znpZ8at",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy3lF2NSpG2P9iDeUKc1SVQsxBIfFg4znpZ8at",
    size: 4274,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "AgenitiX helped us automate our event booking process, saving us countless hours. Their no-code solutions are intuitive and effective. Highly recommend their services.",
    "profile-name": "Christine Isted",
    "profile-designation": "Events Manager",
    location: "Vancouver, BC",
  },
  {
    name: "website-image-reviews-JoyleneBayley.webp",
    key: "EORhWwIHc4gydLXeRFBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gydLXeRFBKqAFMpwy1sTYaZEP2SrbClvm8j0o5",
    size: 4732,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "AgenitiX revamped our website, making it more responsive and visually appealing. The increase in traffic and customer engagement was noticeable. They truly understand modern web development.",
    "profile-name": "Joylene Bayley",
    "profile-designation": "Business Owner",
    location: "Kamloops, BC",
  },
  {
    name: "website-image-reviews-ShawnGraham.webp",
    key: "EORhWwIHc4gy95drFZnvd0FBAOChWPpUI7LwlytcoN5fm4QE",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gy95drFZnvd0FBAOChWPpUI7LwlytcoN5fm4QE",
    size: 5072,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "From contracts to vendor updates, Agenitix helped us cut hours. Their form-to-dashboard system makes project tracking fast and clear. No fluff—just solid systems that keep work moving without constant oversight.",
    "profile-name": "Shawn Graham",
    "profile-designation": "Co-Founder of Keystone Build Co.",
    location: "Edmonton, AB",
  },
  {
    name: "website-image-reviews-PaulRichards.webp",
    key: "EORhWwIHc4gyrKCY9tJWTRqfDgjpYdSBsGPx2UEl65cIMmZN",
    customId: null,
    url: "https://86apvmagmm.ufs.sh/f/EORhWwIHc4gyrKCY9tJWTRqfDgjpYdSBsGPx2UEl65cIMmZN",
    size: 5750,
    uploadedAt: "2025-04-30T14:44:41.000Z",
    review:
      "We used to juggle bookings and reminders. Agenitix automated everything—website to CRM to calendar. No more front-desk overload. Now I get my evenings back, and clients get faster responses.",
    "profile-name": "Paul Richards",
    "profile-designation": "Owner of Elevate Fitness Studio",
    location: "Regina, SK",
  },
];
