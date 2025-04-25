import Image from "next/image";

const standards = [
    {
      title: "IEEE Standards",
      details: "IEEE 1547, IEEE C37.20, IEEE 519",
      image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxSCU4X27h0jeaV8R3woxgAG7Lr6ib5TOkcHXC",
      link: "https://www.ieee.org/",
    },
    {
      title: "Canadian Electrical Code",
      details: "CSA C22.1, CSA C22.2, CSA C22.3",
      image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOox2QljWrhI5vdYi6q1rEpygWQ4G3zfKUxeusR7",
      link: "https://www.csagroup.org/?srsltid=AfmBOoq_LNoKSAhD9AHtgXecoLDAQPKSQR3MTnXiO6vvTsPU7dOZXP0A",
    },
    {
      title: "Provincial Regulations",
      details: "Alberta STANDATA, AEUC Compliance",
      image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxbVysRtPstGYA7lkRKqD6adoVNwM0n9XTUvFO",
      image2: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxsfrYvH2kfWxNiBvT45GapKuh2oUMdO71EPJL",
      link: "https://www.alberta.ca/building-standata",
    },
  ];
  
  export default function IndustryStandards() {
    return (
      <div className="mb-20">
        <h2 className="text-3xl font-semibold mb-8">Industry Standards & Compliance</h2>
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md">
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Our engineering solutions adhere to the highest industry standards and regulatory requirements, including:
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {standards.map((standard) => (
              <div key={standard.title} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div className="flex items-center flex-col justify-center">
                <h3 className="font-semibold mb-2">{standard.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{standard.details}</p>
                </div>
                <div className="flex items-center justify-center">
                <a href={standard.link} target="_blank" rel="noopener noreferrer">  
                <Image src={standard.image} alt={standard.title} width={100} height={100} />
                </a>
                {standard.image2 && (
                <a href={standard.link} target="_blank" rel="noopener noreferrer">  
                <Image src={standard.image2} alt={standard.title} width={100} height={100} />
                </a>
                )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  