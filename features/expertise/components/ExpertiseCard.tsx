import Image from "next/image";

interface ExpertiseCardProps {
	title: string;
	image: string;
	description: string;
	features: string[];
}

export default function ExpertiseCard({ title, image, description, features }: ExpertiseCardProps) {
	return (
		<div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md">
			<div className="relative h-56">
				<Image src={image} alt={title} fill className="object-cover" />
			</div>
			<div className="p-6">
				<h3 className="text-xl font-semibold mb-3">{title}</h3>
				<p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
				<ul className="mb-4 space-y-2">
					{features.map((feature) => (
						<li key={feature} className="flex items-center">
							<svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
									clipRule="evenodd"
								/>
							</svg>
							<span className="text-gray-700 dark:text-gray-300">{feature}</span>
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
