declare module "grapesjs" {
	const gjs: any;
	export default gjs;
}

declare module "grapesjs/dist/css/grapes.min.css" {
	const css: any;
	export default css;
}

declare module "grapesjs-preset-newsletter" {
	const plugin: any;
	export default plugin;
}

declare module "grapesjs-mjml" {
	const plugin: any;
	export default plugin;
}

declare module "mjml-browser" {
	export default function mjml2html(input: string): { html: string };
}
