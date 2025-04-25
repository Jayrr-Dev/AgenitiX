import ExpertiseCard from "./ExpertiseCard";

const expertiseList = [
  {
    title: "Distribution System Design",
    image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxOYBeFyTrUKjXRFQmr2gbGzTMIYp85xVShBZ3",
    description:
      "Comprehensive design of electrical distribution networks for urban, suburban, and rural environments with focus on reliability and efficiency.",
    features: [
      "Pole Loading Analysis",
      "Anchor Remediation",
      "Pole Setting & Framing",
      "Guyed Structure Design",
      "Conductor Sizing",
    ],
  },
  {
    title: "Residential Development Support",
    image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxVt9JRr4rnATlt4ysGoIZKBgzxcabm8uLE7fS",
    description:
      "Coordination of backbone feeders, pad-mount transformers, and street lighting for new subdivisions. Provides lot-by-lot service plans and accurate cost estimates for developer agreements.",
    features: [
      "Municipal Facility Servicing",
      "Permitting Support",
      "Limit of Approach (LOA)",
      "Primary Power Service",
    ],
  },
  {
    title: "Utility Power Systems",
    image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxdirPkpfON1zSt0wf9VUjLYZ5x3WQarImTMFq",
    description:
      "Encompass the engineering, analysis, and operation of the equipment and circuits that generate, transform, distribute, and protect electrical energy from the substation all the way to the customer service point",
    features: [
      "Transformer Installation Design",
      "Service Lateral Design",
      "Single-Phase Distribution",
      "Three-Phase Distribution",
    ],
  },
];

export default function CoreExpertise() {
  return (
    <div className="mb-20">
      <h2 className="text-3xl font-semibold mb-8">Core Expertise Areas</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {expertiseList.map((item) => (
          <ExpertiseCard key={item.title} {...item} />
        ))}
      </div>
    </div>
  );
}