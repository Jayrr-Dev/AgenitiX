import Image from 'next/image';

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
    <section className="py-24 bg-white">
      <div className="container px-4 mx-auto">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">Our Team</h2>
          <p className="text-gray-600">
            Meet the experts behind Utilitek's innovative solutions
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg overflow-hidden transition-transform hover:scale-105"
            >
              <div className="relative h-64 w-full">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{member.name}</h3>
                <p className="text-blue-600 mb-3">{member.role}</p>
                <p className="text-gray-600">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
} 