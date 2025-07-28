if (!self.define) {
	let e,
		s = {};
	const a = (a, i) => (
		(a = new URL(a + ".js", i).href),
		s[a] ||
			new Promise((s) => {
				if ("document" in self) {
					const e = document.createElement("script");
					(e.src = a), (e.onload = s), document.head.appendChild(e);
				} else (e = a), importScripts(a), s();
			}).then(() => {
				const e = s[a];
				if (!e) throw new Error(`Module ${a} didn’t register its module`);
				return e;
			})
	);
	self.define = (i, n) => {
		const r = e || ("document" in self ? document.currentScript.src : "") || location.href;
		if (s[r]) return;
		const c = {};
		const t = (e) => a(e, r),
			o = { module: { uri: r }, exports: c, require: t };
		s[r] = Promise.all(i.map((e) => o[e] || t(e))).then((e) => (n(...e), c));
	};
}
define(["./workbox-e9849328"], (e) => {
	importScripts(),
		self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{ url: "/_next/app-build-manifest.json", revision: "77d0305e8a5419869bcc9259f6fb7045" },
				{ url: "/_next/build-manifest.json", revision: "0306cf715d4addf9050638283a0b8646" },
				{
					url: "/_next/react-loadable-manifest.json",
					revision: "63be68fc53a88463c8538388b9d2f7d8",
				},
				{
					url: "/_next/server/app/(auth-pages)/forgot-password/page_client-reference-manifest.js",
					revision: "fcd632efe1c6cfb1b9eb3686c553ca22",
				},
				{
					url: "/_next/server/app/(auth-pages)/sign-in/page_client-reference-manifest.js",
					revision: "417b92659aaa2cd56b0879e655c4bda3",
				},
				{
					url: "/_next/server/app/(auth-pages)/sign-up/page_client-reference-manifest.js",
					revision: "722e661498e0acf93f034732352d46f5",
				},
				{
					url: "/_next/server/app/(legal-pages)/privacy/page_client-reference-manifest.js",
					revision: "a6742badfef043b3f6b2361a83fda54e",
				},
				{
					url: "/_next/server/app/(legal-pages)/terms/page_client-reference-manifest.js",
					revision: "f98b99cf0f99c8c05220690262b1bec7",
				},
				{
					url: "/_next/server/app/(user-pages)/dashboard/page_client-reference-manifest.js",
					revision: "579dd2d3b27c2b7e0f9ba804a6f82614",
				},
				{
					url: "/_next/server/app/(user-pages)/explore/page_client-reference-manifest.js",
					revision: "fa8e20f323dba5ddcc6fa35e3edefb10",
				},
				{
					url: "/_next/server/app/(user-pages)/matrix/%5BflowId%5D/page_client-reference-manifest.js",
					revision: "39ec44845575d66d90366527662e4760",
				},
				{
					url: "/_next/server/app/(user-pages)/matrix/page_client-reference-manifest.js",
					revision: "3147188ab6fbfa99170745a85f735fdc",
				},
				{
					url: "/_next/server/app/_not-found/page_client-reference-manifest.js",
					revision: "da1f5521993ce74cfb7c08af1a1872ea",
				},
				{
					url: "/_next/server/app/admin/page_client-reference-manifest.js",
					revision: "68dd40d843e7f436fc28e7cba321a2f8",
				},
				{
					url: "/_next/server/app/api/anubis/challenge/route_client-reference-manifest.js",
					revision: "f71d812e2dc6fc5bd660d180ff336e0f",
				},
				{
					url: "/_next/server/app/api/anubis/optimistic-verify/route_client-reference-manifest.js",
					revision: "0d25cec74fd0b5126c1be3dede3223c1",
				},
				{
					url: "/_next/server/app/api/anubis/status/route_client-reference-manifest.js",
					revision: "73603cbc5d92bc4f1bae2a3751305f55",
				},
				{
					url: "/_next/server/app/api/anubis/threat-intel/route_client-reference-manifest.js",
					revision: "255616e9d83b77b3de690f7a862c0f70",
				},
				{
					url: "/_next/server/app/api/auth/callback/route_client-reference-manifest.js",
					revision: "6dee286e7afd4c29cfda024ac9b03c3e",
				},
				{
					url: "/_next/server/app/api/auth/email/callback/route_client-reference-manifest.js",
					revision: "afe7df55cae963ab5349aedbd3af5efb",
				},
				{
					url: "/_next/server/app/api/auth/email/gmail/callback/route_client-reference-manifest.js",
					revision: "8f4e0906cdeacfd42bb5b2aae3b69a48",
				},
				{
					url: "/_next/server/app/api/auth/email/gmail/route_client-reference-manifest.js",
					revision: "f70021dbd741f03d55d0e49b376c8496",
				},
				{
					url: "/_next/server/app/api/auth/email/outlook/callback/route_client-reference-manifest.js",
					revision: "580096d16958d0cbc8252ffb4f939f9e",
				},
				{
					url: "/_next/server/app/api/auth/email/outlook/route_client-reference-manifest.js",
					revision: "9ceae7f9b59711c1901779f2deb37bc6",
				},
				{
					url: "/_next/server/app/api/auth/email/refresh/route_client-reference-manifest.js",
					revision: "51eede7fbe8a00b5be877c9dc9d856c5",
				},
				{
					url: "/_next/server/app/api/auth/send-magic-link/route_client-reference-manifest.js",
					revision: "aa87b78dff8abddd79b92e2b0ca56477",
				},
				{
					url: "/_next/server/app/api/careers/route_client-reference-manifest.js",
					revision: "03e988ed7345ca3ea0cb856ddf87c11c",
				},
				{
					url: "/_next/server/app/api/contact/route_client-reference-manifest.js",
					revision: "4eb1131ec1fdae05ccdbd02bdf80371a",
				},
				{
					url: "/_next/server/app/api/flags/evaluate/route_client-reference-manifest.js",
					revision: "63cea8982d62a04b46963f01fb975c40",
				},
				{
					url: "/_next/server/app/api/flags/install-app/route_client-reference-manifest.js",
					revision: "869bbc62f3b7967a53557d79012a4e80",
				},
				{
					url: "/_next/server/app/api/schedule/route_client-reference-manifest.js",
					revision: "c11316ab6aa24a35cc821fb647709b7c",
				},
				{
					url: "/_next/server/app/api/server-actions/database/route_client-reference-manifest.js",
					revision: "85b7579a5f774a5e8f2e91b727d12e18",
				},
				{
					url: "/_next/server/app/api/server-actions/network/route_client-reference-manifest.js",
					revision: "f494bae55658505f8564a4b25ae59155",
				},
				{
					url: "/_next/server/app/api/verify-turnstile/route_client-reference-manifest.js",
					revision: "56b9cb2a46637e579d6a0bd858eae536",
				},
				{
					url: "/_next/server/app/auth/verify/page_client-reference-manifest.js",
					revision: "0c32f2f2d4b8e74ab6a673d362e3ea0c",
				},
				{
					url: "/_next/server/app/business-logic/page_client-reference-manifest.js",
					revision: "4eb339e7b943bc675fa9fb88f0e4a167",
				},
				{
					url: "/_next/server/app/offline/page_client-reference-manifest.js",
					revision: "f87d7cebd3606b14ed527e9eb20be6eb",
				},
				{
					url: "/_next/server/app/page_client-reference-manifest.js",
					revision: "506aa0e0a3e289422a83dbb877fe9e05",
				},
				{
					url: "/_next/server/app/sitemap/page_client-reference-manifest.js",
					revision: "f98fea67fb24e51cbad1a7b354e4bb5e",
				},
				{
					url: "/_next/server/middleware-build-manifest.js",
					revision: "7e93afacdefddd6e7a9c75466b928f5e",
				},
				{
					url: "/_next/server/middleware-react-loadable-manifest.js",
					revision: "d13b144dd216f45779027a9905369083",
				},
				{
					url: "/_next/server/next-font-manifest.js",
					revision: "9fce7989bff5d35b01e177447faca50d",
				},
				{
					url: "/_next/server/next-font-manifest.json",
					revision: "d51420cd4aa5d37d6719849cf36d0d6f",
				},
				{
					url: "/_next/static/QiRrOZsdsjBh2GYqogn1o/_buildManifest.js",
					revision: "90a768e931c2dabfe5163ffd0ce2cdc6",
				},
				{
					url: "/_next/static/QiRrOZsdsjBh2GYqogn1o/_ssgManifest.js",
					revision: "b6652df95db52feb4daf4eca35380933",
				},
				{ url: "/_next/static/chunks/1345-615fa501ba609ba6.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/1529.0375d3983026152b.js", revision: "0375d3983026152b" },
				{ url: "/_next/static/chunks/1659-b27880b02cbcefa3.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/257-ea95478885abe53a.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/27163a17.d7609dc088bd655b.js", revision: "d7609dc088bd655b" },
				{ url: "/_next/static/chunks/2894.7337fa758445f794.js", revision: "7337fa758445f794" },
				{ url: "/_next/static/chunks/3102.db2e6c5140082053.js", revision: "db2e6c5140082053" },
				{
					url: "/_next/static/chunks/33b75b42-fea4dab4a133c2c9.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{ url: "/_next/static/chunks/3459-e6098e5b7bb5ce67.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/3577-0d74b3ab75a6f412.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{
					url: "/_next/static/chunks/36904ce4-467760619eebebc2.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/36f8eb77-60b4fcd9528021c6.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{ url: "/_next/static/chunks/3942.3ef9011f2cf961f9.js", revision: "3ef9011f2cf961f9" },
				{
					url: "/_next/static/chunks/3f731c04-d3f90cddd3d0ac4c.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{ url: "/_next/static/chunks/4159.0ce28211040c145b.js", revision: "0ce28211040c145b" },
				{
					url: "/_next/static/chunks/41ab7ce7-dcc4a14601f9adb7.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{ url: "/_next/static/chunks/4370-0dd1cc7b53f9b8a4.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/4800.da0c3880302e4da0.js", revision: "da0c3880302e4da0" },
				{ url: "/_next/static/chunks/4a8527dd.a53a22564acc267b.js", revision: "a53a22564acc267b" },
				{ url: "/_next/static/chunks/5042-92b2d3dbeead6325.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/50a854b4.894459c4a0149488.js", revision: "894459c4a0149488" },
				{ url: "/_next/static/chunks/5314-3c1422f121bfd48c.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/6863-5cda318d038fa459.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/696.10e63601eeab23dc.js", revision: "10e63601eeab23dc" },
				{ url: "/_next/static/chunks/6971-91a607cc65649547.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/7004.482ca15ac3c7dd2d.js", revision: "482ca15ac3c7dd2d" },
				{ url: "/_next/static/chunks/7195-9c2a680573e11e68.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/7395.b9e96fcd2eaca139.js", revision: "b9e96fcd2eaca139" },
				{ url: "/_next/static/chunks/7826.fc9aa16f092565c6.js", revision: "fc9aa16f092565c6" },
				{ url: "/_next/static/chunks/8004.a1299c7a31314436.js", revision: "a1299c7a31314436" },
				{ url: "/_next/static/chunks/8367-73d0a133c8ab089c.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/8711-452ed499fcb1ae0d.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/8825-aff2b9ee41ae1caa.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/9233-ed280d411f873620.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/9274-610a88c6cdc0bf40.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/954-775382cadf705ff2.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{ url: "/_next/static/chunks/9620-20bcfa5b94fb7b05.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{
					url: "/_next/static/chunks/app/(auth-pages)/forgot-password/page-c04997a866f352d7.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(auth-pages)/sign-in/page-78e1ebf11a9c4a31.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(auth-pages)/sign-up/page-8ef53eea47155db2.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(legal-pages)/privacy/page-6c64f38eae253009.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(legal-pages)/terms/page-e789c377c0db8e59.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/dashboard/page-4e22be9aa955d557.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/explore/page-37831ba247405329.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/layout-a0b9055b69b8d458.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/matrix/%5BflowId%5D/page-242b63909ab88280.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/matrix/page-b8ef868ff91f6592.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/_not-found/page-34269f9878407e5b.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/admin/page-38304fcd4921138a.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/challenge/route-f66c998426703ee5.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/optimistic-verify/route-e48aed55e8026d81.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/status/route-d49e3afe9aabb3fb.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/threat-intel/route-cc6ec343b82257b4.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/callback/route-f8d10b0d05ca7a49.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/email/callback/route-72e1823ca7f570d3.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/email/gmail/callback/route-899614d781077dc4.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/email/gmail/route-f10e2b33112a6dcb.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/email/outlook/callback/route-ce4f673f1234fcd9.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/email/outlook/route-7eb4b49d8eb93f4e.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/email/refresh/route-fb2928653ac08136.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/auth/send-magic-link/route-8f968b5be811ddcf.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/careers/route-a10499a6c574ce0c.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/contact/route-d8ad3e318d710212.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/flags/evaluate/route-02e1685923e07191.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/flags/install-app/route-9a695ac491fc5381.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/schedule/route-cc3a078493af9c8e.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/server-actions/database/route-f168c05c25ff04d2.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/server-actions/network/route-3b7dd27d34792469.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/api/verify-turnstile/route-1b468ef1d47119f1.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/auth/verify/page-43c6d4b62fdeb64e.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/business-logic/page-e5856928a05a4aaa.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/layout-0df94d9043775b91.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/loading-60cf83daa1f5df54.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/offline/page-ea8918b5898da6dc.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/page-74387ed9809d5f52.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/app/sitemap/page-9901ab5254b6dbca.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/f9a38c1a-ab44d5df98e186a2.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/framework-49bb92f9a25cc515.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{ url: "/_next/static/chunks/main-247797dccfe1accc.js", revision: "QiRrOZsdsjBh2GYqogn1o" },
				{
					url: "/_next/static/chunks/main-app-cbd6fb325e11a54b.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/pages/_app-2bdea6aeb9556bba.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/pages/_error-6b7b53f3b8796954.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{
					url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
					revision: "846118c33b2c0e922d7b3a7676f81f6f",
				},
				{
					url: "/_next/static/chunks/webpack-ea1d1f4fb7a84fe1.js",
					revision: "QiRrOZsdsjBh2GYqogn1o",
				},
				{ url: "/_next/static/css/87da888ebe318964.css", revision: "87da888ebe318964" },
				{ url: "/_next/static/css/f46747a4e5e31ec4.css", revision: "f46747a4e5e31ec4" },
				{
					url: "/_next/static/media/26a46d62cd723877-s.woff2",
					revision: "befd9c0fdfa3d8a645d5f95717ed6420",
				},
				{
					url: "/_next/static/media/55c55f0601d81cf3-s.woff2",
					revision: "43828e14271c77b87e3ed582dbff9f74",
				},
				{
					url: "/_next/static/media/569ce4b8f30dc480-s.p.woff2",
					revision: "ef6cefb32024deac234e82f932a95cbd",
				},
				{
					url: "/_next/static/media/581909926a08bbc8-s.woff2",
					revision: "f0b86e7c24f455280b8df606b89af891",
				},
				{
					url: "/_next/static/media/8d697b304b401681-s.woff2",
					revision: "cc728f6c0adb04da0dfcb0fc436a8ae5",
				},
				{
					url: "/_next/static/media/8e9860b6e62d6359-s.woff2",
					revision: "01ba6c2a184b8cba08b0d57167664d75",
				},
				{
					url: "/_next/static/media/97e0cb1ae144a2a9-s.woff2",
					revision: "e360c61c5bd8d90639fd4503c829c2dc",
				},
				{
					url: "/_next/static/media/ba015fad6dcf6784-s.woff2",
					revision: "8ea4f719af3312a055caf09f34c89a77",
				},
				{
					url: "/_next/static/media/df0a9ae256c0569c-s.woff2",
					revision: "d54db44de5ccb18886ece2fda72bdfe0",
				},
				{
					url: "/_next/static/media/e4af272ccee01ff0-s.p.woff2",
					revision: "65850a373e258f1c897a2b3d75eb74de",
				},
				{ url: "/feat-hq.png", revision: "11607528839f00b1b1d17af55f4387fe" },
				{ url: "/icon-mark.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-128x128.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-144x144.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-152x152.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-192x192.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-384x384.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-512x512.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-72x72.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/icons/icon-96x96.png", revision: "f74bf756c4d81cee708c4bef8b1ae401" },
				{ url: "/logo-mark.png", revision: "37a1a3bf7b44ce7caebb14d7611e1746" },
				{
					url: "/logomark-dark-light/logomark-dark.png",
					revision: "5f781c5ac3df4202027745d1a8f1aaac",
				},
				{
					url: "/logomark-dark-light/logomark-light.png",
					revision: "ac1573e127e8ae41b8f7160188196f8b",
				},
				{ url: "/manifest.json", revision: "f18ed991a581fa4cbdb0a9ce7970bb03" },
				{ url: "/n8n-demo.webp", revision: "fafabeb3d1f30b29d2808eb55728a6e7" },
				{ url: "/n8n-fullpage.png", revision: "03955da8f7030608e2990400d416da53" },
				{ url: "/robots.txt", revision: "cbe2a170466b44f52c05178e6fa903be" },
			],
			{ ignoreURLParametersMatching: [] }
		),
		e.cleanupOutdatedCaches(),
		e.registerRoute(
			"/",
			new e.NetworkFirst({
				cacheName: "start-url",
				plugins: [
					{
						cacheWillUpdate: async ({ request: e, response: s, event: a, state: i }) =>
							s && "opaqueredirect" === s.type
								? new Response(s.body, { status: 200, statusText: "OK", headers: s.headers })
								: s,
					},
				],
			}),
			"GET"
		),
		e.registerRoute(
			/^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
			new e.CacheFirst({
				cacheName: "google-fonts-webfonts",
				plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 })],
			}),
			"GET"
		),
		e.registerRoute(
			/^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
			new e.StaleWhileRevalidate({
				cacheName: "google-fonts-stylesheets",
				plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
			new e.StaleWhileRevalidate({
				cacheName: "static-font-assets",
				plugins: [new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
			new e.StaleWhileRevalidate({
				cacheName: "static-image-assets",
				plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\/_next\/image\?url=.+$/i,
			new e.StaleWhileRevalidate({
				cacheName: "next-image",
				plugins: [new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:mp3|wav|ogg)$/i,
			new e.CacheFirst({
				cacheName: "static-audio-assets",
				plugins: [
					new e.RangeRequestsPlugin(),
					new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
				],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:mp4)$/i,
			new e.CacheFirst({
				cacheName: "static-video-assets",
				plugins: [
					new e.RangeRequestsPlugin(),
					new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
				],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:js)$/i,
			new e.StaleWhileRevalidate({
				cacheName: "static-js-assets",
				plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:css|less)$/i,
			new e.StaleWhileRevalidate({
				cacheName: "static-style-assets",
				plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\/_next\/data\/.+\/.+\.json$/i,
			new e.StaleWhileRevalidate({
				cacheName: "next-data",
				plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			/\.(?:json|xml|csv)$/i,
			new e.NetworkFirst({
				cacheName: "static-data-assets",
				plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			({ url: e }) => {
				if (!(self.origin === e.origin)) return !1;
				const s = e.pathname;
				return !s.startsWith("/api/auth/") && !!s.startsWith("/api/");
			},
			new e.NetworkFirst({
				cacheName: "apis",
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			({ url: e }) => {
				if (!(self.origin === e.origin)) return !1;
				return !e.pathname.startsWith("/api/");
			},
			new e.NetworkFirst({
				cacheName: "others",
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 })],
			}),
			"GET"
		),
		e.registerRoute(
			({ url: e }) => !(self.origin === e.origin),
			new e.NetworkFirst({
				cacheName: "cross-origin",
				networkTimeoutSeconds: 10,
				plugins: [new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 })],
			}),
			"GET"
		);
});
