
const HANDLE_PATTERN = /^\/(test|util)\/sw\-/;
const ADD_HEADER_PATTERN = /^\/test\/sw\-header$/;
const CLEAR_CACHE_PATTERN = /^\/util\/sw\-clear\-cache$/;
const USE_CACHE_PATTERN = /^\/test\/sw\-cache$/;


self.addEventListener('install', event => {
	console.log('[SW] Install');
	event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
	console.log('[SW] Activated');
	return self.clients.claim();
});

self.addEventListener('fetch', event => {
	const url = new URL(event.request.url);
	if (!HANDLE_PATTERN.test(url.pathname)) {
		return undefined;
	}

	const response = (async function() {
		if (ADD_HEADER_PATTERN.test(url.pathname)) {
			console.log('[SW] Adding SW header to ', url);
			const newHeaders = {};
			for (var entry of event.request.headers.entries()) {
				newHeaders[entry[0]] = entry[1];
			}
			newHeaders['SW-Added-Header'] = Date.now() + ' ' + (Math.random()+'').replace('.', '');
			const newRequest = new Request(url, {
				method: event.request.method,
				headers: newHeaders,
				mode: 'same-origin',
				credentials: event.request.credentials,
				redirect: 'manual'
			});
			return fetch(newRequest);

		} else if (USE_CACHE_PATTERN.test(url.pathname)) {
			console.log('[SW] using SW cache for ', url);
			const cache = await caches.open('testCache');
			const cacheMatch = await cache.match(event.request);
			if (cacheMatch) {
				return cacheMatch;
			} else {
				const resp = await fetch(event.request);
				await cache.put(event.request, resp.clone());
				return resp;
			}

		} else if (CLEAR_CACHE_PATTERN.test(url.pathname)) {
			console.log('[SW] Resetting SW cache');
			await caches.delete('testCache');
			return new Response('OK', { "status": 200 , "statusText": "OK" });
		}
	}());

	event.waitUntil(response);
	event.respondWith(response);

});
