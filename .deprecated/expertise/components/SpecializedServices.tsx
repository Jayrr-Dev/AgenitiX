const services = [
	{
		title: "Overhead Utility Design",
		iconColor: "blue",
		description:
			"Engineering of pole-mounted circuits including conductor selection, span lengths, guying, and clearance studies. Drawings and structure lists meet CSA, NESC, and utility standards while minimizing visual impact and right-of-way cost.",
		image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxr7jjXWijlSF2ZPe5GL6bKw31fzAopinryuOm",
	},
	{
		title: "Protection & Control",
		iconColor: "green",
		description:
			"Specification of relays, CTs, PTs, and SCADA interfaces to detect faults and operate breakers within required clearing times. Protects equipment and personnel while maintaining system selectivity and reliability indices.",
		image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOox20jHufhI5vdYi6q1rEpygWQ4G3zfKUxeusR7",
	},
	{
		title: "Utility Design",
		iconColor: "purple",
		description:
			"Multi-disciplinary layout of power, communications, water, and gas infrastructure for new developments or upgrades. Balances space constraints, code clearances, and phasing so each utility can be installed, serviced, and expanded without conflict.",
		image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxdhjq4uON1zSt0wf9VUjLYZ5x3WQarImTMFq2",
	},
	{
		title: "Underground Utility Design",
		iconColor: "amber",
		description:
			"Routing of buried conduits, vaults, and direct-buried cables with adequate separations from other services. Addresses thermal ampacity, trench shoring, and conflict avoidance.",
		image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxSV2w3ca7h0jeaV8R3woxgAG7Lr6ib5TOkcHX",
	},
	{
		title: "Infrastructure Upgrade",
		iconColor: "red",
		description:
			"Assessment and reinforcement of existing utility assets to accommodate higher loads or extend service life. Typical measures include conductor upsizing, pole change-outs, and protective-relay replacement.",
		image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOox70LcVvUtDOoxMhsTAHNYEQPZVi5bz4yKSBUJ",
	},
	{
		title: "Joint Use Engineering",
		iconColor: "blue",
		description:
			"Allocation and verification of space on shared poles for electric, telecom, cable-TV, and lighting attachments. Includes loading analysis, separation requirements, application coordination, and construction notes for each tenant.",
		image: "https://d63wj7axnd.ufs.sh/f/7P3qnKUtDOoxyu3Fx7WbLHEFD2QwtkRixCKP4WB9vnXehsNG",
	},
];

export default function SpecializedServices() {
	return (
		<div className="mb-20">
			<h2 className="text-3xl font-semibold mb-8">Specialized Services</h2>
			<div className="grid md:grid-cols-2 gap-8">
				{services.map((service, idx) => (
					<div key={idx} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
						<div className="flex items-start mb-4">
							<div
								className={`w-[200px] h-[200px] aspect-square  bg-${service.iconColor}-100 dark:bg-${service.iconColor}-900 flex items-center justify-center mr-4`}
							>
								<img
									src={service.image}
									alt={service.title}
									className="w-full h-full object-cover rounded-lg"
								/>
							</div>
							<div>
								<h3 className="text-xl font-semibold mb-2">{service.title}</h3>
								<p className="text-gray-700 dark:text-gray-300">{service.description}</p>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	);
}
