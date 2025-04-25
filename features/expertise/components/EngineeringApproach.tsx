const phases = [
    { step: 1, title: "Assessment", desc: "Thorough analysis of requirements and existing infrastructure" },
    { step: 2, title: "Design", desc: "Innovative solutions tailored to specific project requirements" },
    { step: 3, title: "Implementation", desc: "Precise execution with quality control and safety standards" },
    { step: 4, title: "Validation", desc: "Comprehensive testing and verification of system performance" },
  ];
  
  export default function EngineeringApproach() {
    return (
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Our Engineering Approach</h2>
        <div className="grid md:grid-cols-4 gap-6">
          {phases.map((phase) => (
            <div key={phase.step} className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-blue-600 dark:text-blue-400 font-bold text-xl">{phase.step}</span>
              </div>
              <h3 className="font-semibold mb-2">{phase.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{phase.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  