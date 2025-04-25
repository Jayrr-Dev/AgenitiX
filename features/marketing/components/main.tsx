"use client"
import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Award, Users, BarChart, Linkedin } from "lucide-react";
// import ProjectGallery from "@/features/projects/components/ProjectGallery";

import { useQuery } from "@tanstack/react-query";
import ProjectFeatured from "@/features/projects/components/ProjectFeatured";
import CurrentOpenings from "@/features/careers/components/currentOpenings";
import { createClient } from "@/utils/supabase/client";

export default function Main() {
  const supabase = createClient();
  const servicesRef = useRef(null);
  const statsRef = useRef(null);
  const projectsRef = useRef(null);
  const teamRef = useRef(null);
  
  const servicesInView = useInView(servicesRef, { once: true, amount: 0.3 });
  const statsInView = useInView(statsRef, { once: true, amount: 0.3 });
  const projectsInView = useInView(projectsRef, { once: true, amount: 0.3 });
  const teamInView = useInView(teamRef, { once: true, amount: 0.3 });
   
  const getTags = async () => {
    const { data, error } = await supabase.from("tags").select("tag, definitions");
    if (error) throw error;
    return data;
  };  

  // create table public.tags (
  //   tag_id uuid not null default gen_random_uuid (),
  //   tag text not null,
  //   category text null,
  //   definitions text null,
  //   constraint categories_pkey primary key (tag_id),
  //   constraint categories_name_key unique (tag)
  // ) TABLESPACE pg_default;


  type Tag = {  
    tag: string;
    definitions: string;
  };

  const targetTag = [
    "Utility Design",
    "Residential Development Support",
    "Protection & Control",
    "Infrastructure Upgrade",
    "Three-Phase Distribution",
    "Transformer Installation Design"
  ];
  const { data: tags, isLoading: tagsLoading } = useQuery<Tag[]>({
    queryKey: ["tags"],
    queryFn: () => getTags(),
  }); 

  const filteredTags = tags?.filter((tag) => targetTag.includes(tag.tag));

  return (
    <div className="w-full">
      {/* Services Section */}
      <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Expertise</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Delivering innovative electrical engineering solutions with precision and reliability for over 25 years.
            </p>
          </div>
          
          <motion.div 
            ref={servicesRef}
            initial={{ opacity: 0, y: 50 }}
            animate={servicesInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[
              {
                title: filteredTags?.[0]?.tag,
                description: filteredTags?.[0]?.definitions,
                icon: <Zap className="h-10 w-10 text-primary" />
              },
              {
                title: filteredTags?.[1]?.tag,
                description: filteredTags?.[1]?.definitions,
                icon: <Shield className="h-10 w-10 text-primary" />
              },
              {
                title: filteredTags?.[2]?.tag,
                description: filteredTags?.[2]?.definitions,
                icon: <Award className="h-10 w-10 text-primary" />
              },
              {
                title: filteredTags?.[3]?.tag,
                description: filteredTags?.[3]?.definitions,
                icon: <BarChart className="h-10 w-10 text-primary" />
              },
              {
                title: filteredTags?.[4]?.tag,
                description: filteredTags?.[4]?.definitions,
                icon: <Users className="h-10 w-10 text-primary" />
              },
              {
                title: filteredTags?.[5]?.tag,
                description: filteredTags?.[5]?.definitions,
                icon: <Zap className="h-10 w-10 text-primary" />
              }
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={servicesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-t-4 border-t-primary">
                  <CardHeader>
                    <div className="mb-2">{service.icon}</div>
                    <CardTitle>{service.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{service.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Link href="/expertise" className="text-primary hover:underline inline-flex items-center">
                      Learn more <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <motion.div 
            ref={statsRef}
            initial={{ opacity: 0 }}
            animate={statsInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.7 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            {[
              { value: "25+", label: "Years Experience" },
              { value: "500+", label: "Projects Completed" },
              { value: "98%", label: "Client Satisfaction" },
              { value: "50+", label: "Current Projects" }
            ].map((stat, index) => (
              <motion.div 
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={statsInView ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="p-6 rounded-lg bg-card"
              >
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      {/* todo: add team section */}
      {/* <section className="py-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Leadership Team</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Meet the experienced professionals who lead our company with vision and expertise.
            </p>
          </div>
          
          <motion.div 
            ref={teamRef}
            initial={{ opacity: 0, y: 50 }}
            animate={teamInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              {
                name: "Dan Busilian",
                title: "Chief Executive Officer",
                bio: "With over 20 years of experience in electrical engineering and business leadership.",
                image: "https://placehold.co/314x256.png"
              },
              {
                name: "Michael Chen",
                title: "Chief Technical Officer",
                bio: "Expert in power systems with a background in renewable energy integration.",
                image: "https://placehold.co/314x256.png"
              },
              {
                name: "Priya Patel",
                title: "Director of Operations",
                bio: "Specializes in optimizing project delivery and operational excellence.",
                image: "https://placehold.co/314x256.png"
              },
              {
                name: "Robert Wilson",
                title: "Director of Engineering",
                bio: "Leads our technical teams with expertise in substation and distribution systems.",
                image: "https://placehold.co/314x256.png"
              }
            ].map((member, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={teamInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden h-full hover:shadow-lg transition-shadow duration-300">
                  <div className="relative h-64 overflow-hidden">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{member.name}</CardTitle>
                    <CardDescription className="text-primary font-medium">{member.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{member.bio}</p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-primary">
                      <Linkedin className="h-5 w-5" />
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-10 text-center">
            <Link href="/about">
              <Button variant="outline" className="gap-2">
                Meet Our Full Team <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section> */}

      {/* Featured Projects */}
      <section className="pt-16">
        <div className="container">
        <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our portfolio of successful electrical engineering projects across various industries.
            </p> 
        </div>
        <ProjectFeatured />
        </div>
        {/* <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Projects</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore our portfolio of successful electrical engineering projects across various industries.
            </p>
          </div>
          
          <motion.div 
            ref={projectsRef}
            initial={{ opacity: 0, y: 50 }}
            animate={projectsInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                id: "1",
                title: "Edmonton Substation",
                description: "High-voltage substation design and implementation for Edmonton's growing industrial sector.",
                image: "https://placehold.co/422x192.png",
                link: "/projects/edmonton-substation"
              },
              {
                id: "2",
                title: "Calgary Distribution",
                description: "Modernization of power distribution network for Calgary's downtown commercial district.",
                image: "https://placehold.co/422x192.png",
                link: "/projects/calgary-distribution"
              },
              {
                id: "3",
                title: "Fort McMurray Microgrid",
                description: "Innovative microgrid solution with renewable integration for remote industrial operations.",
                image: "https://placehold.co/422x192.png",
                link: "/projects/fort-mcmurray-microgrid"
              }
            ].map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={projectsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group"
              >
                <Card className="overflow-hidden h-full hover:shadow-xl transition-all duration-300">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={project.image}
                      alt={project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle>{project.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{project.description}</CardDescription>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/projects/${project.id}`}>
                      <Button variant="outline" className="group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        View Project <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-12 text-center">
            <Link href="/projects">
              <Button size="lg" className="gap-2">
                View All Projects <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div> */}
      </section>
      
      {/* Careers Section */}
      <section className="pb-16 bg-gradient-to-b from-background to-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Careers</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto"> Join our team of experienced professionals and contribute to the success of our projects. </p>
          </div>
        <CurrentOpenings />
        </div>
      </section>
      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Energize Your Next Project?</h2>
            <p className="mb-8 text-primary-foreground/90">
              Our team of expert electrical engineers is ready to bring your vision to life with innovative solutions tailored to your specific needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button variant="secondary" size="lg">Contact Us Today</Button>
              </Link>
              <Link href="/expertise">
                <Button variant="outline" size="lg" className="bg-transparent border-white text-white hover:bg-white hover:text-primary">
                  Explore Our Services
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
