if (!self.define) {
	let e,
		s = {};
	const n = (n, a) => (
		(n = new URL(n + ".js", a).href),
		s[n] ||
			new Promise((s) => {
				if ("document" in self) {
					const e = document.createElement("script");
					(e.src = n), (e.onload = s), document.head.appendChild(e);
				} else (e = n), importScripts(n), s();
			}).then(() => {
				const e = s[n];
				if (!e) throw new Error(`Module ${n} didn’t register its module`);
				return e;
			})
	);
	self.define = (a, i) => {
		const c = e || ("document" in self ? document.currentScript.src : "") || location.href;
		if (s[c]) return;
		const t = {};
		const r = (e) => n(e, c),
			f = { module: { uri: c }, exports: t, require: r };
		s[c] = Promise.all(a.map((e) => f[e] || r(e))).then((e) => (i(...e), t));
	};
}
define(["./workbox-e9849328"], (e) => {
	importScripts(),
		self.skipWaiting(),
		e.clientsClaim(),
		e.precacheAndRoute(
			[
				{ url: "/_next/app-build-manifest.json", revision: "14bfe7895bb4a3748346b13b4a76f27d" },
				{ url: "/_next/build-manifest.json", revision: "37f75ccb98b3aa0e44261a7e2581e72f" },
				{
					url: "/_next/react-loadable-manifest.json",
					revision: "85ed46792c27309d0bb6645cba39b458",
				},
				{
					url: "/_next/server/app/(auth-pages)/forgot-password/page_client-reference-manifest.js",
					revision: "6d1d207e40f5bed2cb236d4d237deb1d",
				},
				{
					url: "/_next/server/app/(auth-pages)/sign-in/page_client-reference-manifest.js",
					revision: "4d1df3c5bf08b0e48563e4dd5a936ec7",
				},
				{
					url: "/_next/server/app/(auth-pages)/sign-up/page_client-reference-manifest.js",
					revision: "dfd7ae6727d3472d1a82eda332aabad2",
				},
				{
					url: "/_next/server/app/(legal-pages)/privacy/page_client-reference-manifest.js",
					revision: "f1c21832f11f934524ff723503691064",
				},
				{
					url: "/_next/server/app/(legal-pages)/terms/page_client-reference-manifest.js",
					revision: "71b0efb9505233d91e344b2436b6a1d4",
				},
				{
					url: "/_next/server/app/(user-pages)/dashboard/page_client-reference-manifest.js",
					revision: "6baf79227208140f00be8e0b9eaf8c6e",
				},
				{
					url: "/_next/server/app/(user-pages)/matrix/%5BflowId%5D/page_client-reference-manifest.js",
					revision: "c15366ffef5a5b747d16cf2e530198d5",
				},
				{
					url: "/_next/server/app/(user-pages)/matrix/page_client-reference-manifest.js",
					revision: "e47900eef22f091911531b63c128f324",
				},
				{
					url: "/_next/server/app/_not-found/page_client-reference-manifest.js",
					revision: "07e1b58dc92cac347a9e6465cc2ac0b6",
				},
				{
					url: "/_next/server/app/admin/page_client-reference-manifest.js",
					revision: "d48792d7534724cb0431cd29245c6f1a",
				},
				{
					url: "/_next/server/app/api/anubis/challenge/route_client-reference-manifest.js",
					revision: "eeb86aa24bf6b0a9f3a3ccb28c5d08a5",
				},
				{
					url: "/_next/server/app/api/anubis/optimistic-verify/route_client-reference-manifest.js",
					revision: "f6818c4f2c66ac0ecd4f417a291c0a09",
				},
				{
					url: "/_next/server/app/api/anubis/status/route_client-reference-manifest.js",
					revision: "3ca11f7c1322f60fd0f8b54aec189c44",
				},
				{
					url: "/_next/server/app/api/anubis/threat-intel/route_client-reference-manifest.js",
					revision: "94fcd24019574e379b42fe4721b83ab6",
				},
				{
					url: "/_next/server/app/api/auth/callback/route_client-reference-manifest.js",
					revision: "0f29de28b8599f65ad7629f11b0e7622",
				},
				{
					url: "/_next/server/app/api/careers/route_client-reference-manifest.js",
					revision: "ae4141acc804666655c0e3ce0baac892",
				},
				{
					url: "/_next/server/app/api/contact/route_client-reference-manifest.js",
					revision: "2ba1bce2d735dd4c50f5a67352035e66",
				},
				{
					url: "/_next/server/app/api/flows/%5BflowId%5D/route_client-reference-manifest.js",
					revision: "a744ea44b49dade81c275c794b1313db",
				},
				{
					url: "/_next/server/app/api/flows/route_client-reference-manifest.js",
					revision: "3ea1809d3bc456ed6a852644b37000db",
				},
				{
					url: "/_next/server/app/api/schedule/route_client-reference-manifest.js",
					revision: "6d5f5368c02ec0395f559476a58be19b",
				},
				{
					url: "/_next/server/app/api/verify-turnstile/route_client-reference-manifest.js",
					revision: "9e837e023f445d551e2ab7019d49546e",
				},
				{
					url: "/_next/server/app/business-logic/page_client-reference-manifest.js",
					revision: "b7b1700ff2ee2ade001048bf4a666995",
				},
				{
					url: "/_next/server/app/offline/page_client-reference-manifest.js",
					revision: "bef636511c04dfc307eb60b32b035f1b",
				},
				{
					url: "/_next/server/app/page_client-reference-manifest.js",
					revision: "a02fc2b6bda322263c6766113c345d93",
				},
				{
					url: "/_next/server/app/sitemap/page_client-reference-manifest.js",
					revision: "a299123fd93f05967d8a248559f5a17e",
				},
				{
					url: "/_next/server/middleware-build-manifest.js",
					revision: "4909c94fea8695c0ecdb74d0feeca52b",
				},
				{
					url: "/_next/server/middleware-react-loadable-manifest.js",
					revision: "5dfa8397dab19da9b46daff7a4e3966b",
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
					url: "/_next/static/09n_b7SK20lZwkJXM8OeV/_buildManifest.js",
					revision: "1bddfd081e9c097a24deb141bde980d8",
				},
				{
					url: "/_next/static/09n_b7SK20lZwkJXM8OeV/_ssgManifest.js",
					revision: "b6652df95db52feb4daf4eca35380933",
				},
				{ url: "/_next/static/chunks/1529.0375d3983026152b.js", revision: "0375d3983026152b" },
				{ url: "/_next/static/chunks/2451-d01a8cce82dcc547.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/27163a17.d7609dc088bd655b.js", revision: "d7609dc088bd655b" },
				{ url: "/_next/static/chunks/2894.7337fa758445f794.js", revision: "7337fa758445f794" },
				{ url: "/_next/static/chunks/3102.db2e6c5140082053.js", revision: "db2e6c5140082053" },
				{
					url: "/_next/static/chunks/33b75b42-fea4dab4a133c2c9.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{ url: "/_next/static/chunks/3459-d4a9d48ec9eaed15.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{
					url: "/_next/static/chunks/36904ce4-467760619eebebc2.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/36f8eb77-60b4fcd9528021c6.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/3f731c04-d3f90cddd3d0ac4c.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{ url: "/_next/static/chunks/4159.0ce28211040c145b.js", revision: "0ce28211040c145b" },
				{
					url: "/_next/static/chunks/41ab7ce7-ecb7ea41a3a567ab.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{ url: "/_next/static/chunks/4365-bddb6e806116990a.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/4800.da0c3880302e4da0.js", revision: "da0c3880302e4da0" },
				{ url: "/_next/static/chunks/4911-be94aaaf3cb881eb.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/4a8527dd.a53a22564acc267b.js", revision: "a53a22564acc267b" },
				{ url: "/_next/static/chunks/50a854b4.894459c4a0149488.js", revision: "894459c4a0149488" },
				{ url: "/_next/static/chunks/6315-6eebcde7cf1f7250.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/696.10e63601eeab23dc.js", revision: "10e63601eeab23dc" },
				{ url: "/_next/static/chunks/7004.482ca15ac3c7dd2d.js", revision: "482ca15ac3c7dd2d" },
				{ url: "/_next/static/chunks/7164-4f6c16e07d9106ce.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/7253-24a9debb969f09e1.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/7395.b9e96fcd2eaca139.js", revision: "b9e96fcd2eaca139" },
				{ url: "/_next/static/chunks/7826.fc9aa16f092565c6.js", revision: "fc9aa16f092565c6" },
				{ url: "/_next/static/chunks/8004.a1299c7a31314436.js", revision: "a1299c7a31314436" },
				{ url: "/_next/static/chunks/8182-8e19089938457f30.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/9620-e0de56c4c8733820.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/9811-7f735e17bd79ea11.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{ url: "/_next/static/chunks/9968-d012d2a318a1c146.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{
					url: "/_next/static/chunks/app/(auth-pages)/forgot-password/page-cba8c653c971b828.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(auth-pages)/sign-in/page-d48c8e886279271e.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(auth-pages)/sign-up/page-bb61febe820e60c4.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(legal-pages)/privacy/page-b151a6bfa0c6c5e5.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(legal-pages)/terms/page-4ffb25783b6ebd21.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/dashboard/page-3c02a90b0f97ecde.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/matrix/%5BflowId%5D/page-fe69fc99a4dd67b1.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/(user-pages)/matrix/page-27ffbd48b0b6e232.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/_not-found/page-c110f5c982d190b6.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/admin/page-67d3411ed2125015.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/challenge/route-224f3c028fa25129.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/optimistic-verify/route-7bbc594792ce307c.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/status/route-3c662292e82c5d3e.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/anubis/threat-intel/route-e02b9c68b5711130.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/auth/callback/route-4f9b750d67d604ac.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/careers/route-c5604f6fffaa188a.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/contact/route-ea237ecb4e4036d2.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/flows/%5BflowId%5D/route-1b7d617b8133a064.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/flows/route-4ce271119b0020ba.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/schedule/route-d0de14b292d2df59.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/api/verify-turnstile/route-c69e88176a365a83.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/business-logic/page-99b7fb83a0f9f1ac.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/layout-0d680253a165383e.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/loading-fd672cfc423bf9d4.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/offline/page-89c6e14b44e68604.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/page-17f413aeb15c9958.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/app/sitemap/page-8544c8465c77d55d.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/f9a38c1a-52d5d40c5bc6755b.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/framework-49bb92f9a25cc515.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{ url: "/_next/static/chunks/main-247797dccfe1accc.js", revision: "09n_b7SK20lZwkJXM8OeV" },
				{
					url: "/_next/static/chunks/main-app-e7cf464681b634b9.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/pages/_app-2bdea6aeb9556bba.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/pages/_error-6b7b53f3b8796954.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{
					url: "/_next/static/chunks/polyfills-42372ed130431b0a.js",
					revision: "846118c33b2c0e922d7b3a7676f81f6f",
				},
				{
					url: "/_next/static/chunks/webpack-7d948e5f775a4233.js",
					revision: "09n_b7SK20lZwkJXM8OeV",
				},
				{ url: "/_next/static/css/2e3d865eed50fe5e.css", revision: "2e3d865eed50fe5e" },
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
						cacheWillUpdate: async ({ request: e, response: s, event: n, state: a }) =>
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
