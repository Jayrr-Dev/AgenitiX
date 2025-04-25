// components/ProjectCategories.tsx
'use client';
import PowerLine from '../../svg/powerline';
import UrbanInfra from '../../svg/urban-infra';
import Safety from '../../svg/safety';
import Electric from '../../svg/electric';

export default function ProjectCategories() {
  return (
    <div className="mb-20">
      <h2 className="text-3xl font-semibold mb-8">Our Expertise</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[{
          title: 'Distribution Systems',
          description: 'Design and optimization of electrical distribution networks for urban and rural areas.',
          iconClass: 'text-blue-600 dark:text-blue-400',
          bgClass: 'bg-blue-100 dark:bg-blue-900',
          svg: <PowerLine />
        }, {
          title: 'Power Systems Expertise',
          description: 'Design and optimize power systems for a wide range of applications, from small residential systems to large industrial complexes.',
          iconClass: 'text-green-600 dark:text-green-400',
          bgClass: 'bg-green-100 dark:bg-green-900',
          svg: <Electric />
        }, {
          title: 'Urban Infrastructure',
          description: 'Design and implementation of smart city solutions, including street lighting, traffic control, and public safety systems.',
          iconClass: 'text-amber-600 dark:text-amber-400',
          bgClass: 'bg-amber-100 dark:bg-amber-900',
          svg: <UrbanInfra />
        }, {
          title: 'Safety, Standards & Compliance',
          description: 'Ensure all projects are built to the highest safety standards and comply with local regulations. Such as CSA, IEEE, and NFPA standards.',
          iconClass: 'text-purple-600 dark:text-purple-400',
          bgClass: 'bg-purple-100 dark:bg-purple-900',
          svg: <Safety />
        }].map((item, idx) => (
          <div key={idx} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg text-center">
            <div className={`w-16 h-16 ${item.bgClass} rounded-full flex items-center justify-center mx-auto mb-4`}>
              {item.svg}
            </div>
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}