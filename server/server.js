'use strict';

require('dotenv').load();

const path = require('path');
const express = require('express'); require('express-csv');
const exphbs  = require('express-handlebars');
const events = require('events');
const cookieParser = require('cookie-parser');
const moment = require('moment');

const PORT = process.env.PORT || 3102;
const DELAY_TIME = 1000;

const app = express();

app.engine('handlebars', exphbs({defaultLayout: false}));
app.set('view engine', 'handlebars');
app.set('etag', false);

app.use(cookieParser());

app.use((req, res, next) => {
	res.set('Cache-control', 'max-age=30, private');
	res.set('Timing-Allow-Origin', '*');
	res.removeHeader('x-powered-by');
	next();
});

// Serve the static part of the demo
app.use(express.static('public', { etag:false, lastModified:false }));

// Serve the main test page
app.get('/', (req, res) => {
	const testid = Date.now() + Math.round(Math.random()*10000000);
	res.set('Fastly-Test-ID', testid);
	res.set('Link', '</test/'+testid+'/preload?ct=image%2Fgif>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/preload?ct=image%2Fgif&c=0>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/preload?ct=image%2Fgif&v=Accept-Encoding>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/preload?ct=image%2Fgif&v=Accept-Encoding&c=0>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/preload?ct=image%2Fgif&v=Accept>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/preload?ct=image%2Fgif&v=Foo-Header>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/preload?ct=image%2Fgif&v=Accept%2C%20Accept-Encoding>; rel=preload; as=image; nopush, ' +
		'</test/'+testid+'/push?ct=image%2Fgif>; rel=preload; x-http2-push-only, ' +
		'</test/'+testid+'/push?ct=image%2Fgif&c=0>; rel=preload; x-http2-push-only, ' +
		'</test/'+testid+'/push?ct=image%2Fgif&v=Accept-Encoding&c=0>; rel=preload; x-http2-push-only, ' +
		'</test/'+testid+'/push?ct=image%2Fgif&v=Foo-Header&c=0>; rel=preload; x-http2-push-only'
	);
	// Tell the browser that we support H2
	res.cookie('h2', 1, { maxAge: 5000, path: '/' });
	res.render('index', {id: testid});
});

// Special cases for 304s
app.get("/test/:id/304-special", (req, res) => {
	res.set('Cache-control', 'must-revalidate, max-age=0, private');
	res.set('Content-type', 'text/plain');
	if (req.headers['if-modified-since']) {
		res.set('Vary', 'Accept, Foo-Header');
		res.set('Last-Modified', req.headers['if-modified-since']);
		setTimeout(() => {
			res.status(304);
			res.end();
		}, DELAY_TIME/2);
	} else {
		res.set('Last-Modified', moment.utc().format('ddd, D MMM YYYY H:mm:ss [GMT]'));
		res.set('Vary', 'Accept');
		setTimeout(() => {
			res.status(200);
			res.end('304 special ' + req.params.id + ' ' + Date.now());
		}, DELAY_TIME);
	}
});

// Generic endpoint for most tests
app.get("/test/:id/:name", (req, res) => {
	setTimeout(() => {
		if ('v' in req.query) {
			res.set('Vary', req.query.v);
		}
		if ('c' in req.query && req.query.c === '0') {
			res.set('Cache-Control', 'private, no-cache');
		}
		const ct = ('ct' in req.query) ? req.query.ct : 'text/plain'
		res.set('Content-type', ct);
		if (decodeURIComponent(ct) == 'image/gif') {
			res.end('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==');
		} else {
			res.end(req.params.name + ' ' + req.params.id + ' ' + Date.now());
		}
	}, DELAY_TIME);
});

app.get("/util/set-cookie", (req, res) => {
	res.set('Cache-control', 'max-age=0; private');
	res.cookie(req.query.name, req.query.val, { maxAge: 60000, httpOnly: true });
	res.end('OK');
});



// Return a 404 if no routes match
app.use((req, res, next) => {
  res.set('Cache-Control', 'max-age=0; private');
  res.status(404).end('Not found');
});

app.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
