import Image from "next/image";

interface TeamMember {
	name: string;
	role: string;
	image: string;
	bio: string;
}

const teamMembers: TeamMember[] = [
	{
		name: "John Smith",
		role: "CEO & Founder",
		image: "/team/placeholder.jpg",
		bio: "20+ years of experience in utility infrastructure",
	},
	{
		name: "Dan Busilian",
		role: "Chief Technology Officer",
		image: "/team/placeholder.jpg",
		bio: "Expert in smart grid technologies and renewable integration",
	},
	{
		name: "Michael Chen",
		role: "Lead Engineer",
		image: "/team/placeholder.jpg",
		bio: "Specializes in utility automation and control systems",
	},
];

export default function Teams() {
	return (
		<section className="bg-white py-24">
			<div className="container mx-auto px-4">
				<div className="mx-auto mb-16 max-w-3xl text-center">
					<h2 className="mb-4 font-bold text-4xl">Our Team</h2>
					<p className="text-gray-600">Meet the experts behind Utilitek's innovative solutions</p>
				</div>
				<div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
					{teamMembers.map((member) => (
						<div
							key={member.name}
							className="overflow-hidden rounded-lg bg-white shadow-lg transition-transform hover:scale-105"
						>
							<div className="relative h-64 w-full">
								<Image src={member.image} alt={member.name} fill={true} className="object-cover" />
							</div>
							<div className="p-6">
								<h3 className="mb-2 font-bold text-xl">{member.name}</h3>
								<p className="mb-3 text-blue-600">{member.role}</p>
								<p className="text-gray-600">{member.bio}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
