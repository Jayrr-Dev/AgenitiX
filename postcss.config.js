module.exports = {
	plugins: {
		"@tailwindcss/postcss": {},
		...(process.env.NODE_ENV === "production" && {
			cssnano: [
				"cssnano",
				{
					preset: [
						"default",
						{
							mergeRules: false, // we already needed this for the keyframe bug
							minifyGradients: false, // <— turn off the buggy plugin
						},
					],
				},
			],
		}),
	},
};
