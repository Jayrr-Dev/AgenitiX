// components/ProjectTestimonials.tsx
'use client';

export default function ProjectTestimonials() {
  return (
    <div className="mb-20">
      <h2 className="text-3xl font-semibold mb-8">Client Testimonials</h2>
      <div className="grid md:grid-cols-2 gap-8">
        {[{
          name: 'Dan Busilian',
          title: 'Project Manager, Alberta Energy',
          quote: 'Utilitek Solutions delivered our distribution upgrade project on time and under budget. Their expertise in electrical distribution systems is unmatched, and their team was responsive throughout the entire process.'
        }, {
          name: 'Michael Chen',
          title: 'Director of Operations, Calgary Municipal',
          quote: 'We\'ve worked with Utilitek on multiple substation projects, and they consistently exceed our expectations. Their innovative approach to solving complex engineering challenges has saved us both time and resources.'
        }].map((testimonial, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mr-4"></div>
              <div>
                <h3 className="font-semibold">{testimonial.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{testimonial.title}</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300 italic">"{testimonial.quote}"</p>
          </div>
        ))}
      </div>
    </div>
  );
}
