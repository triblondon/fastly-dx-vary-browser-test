'use strict';

require('dotenv').load();

const path = require('path');
const express = require('express'); require('express-csv');
const events = require('events');
const cookieParser = require('cookie-parser');


const PORT = process.env.PORT || 3102;

const app = express();

app.use(cookieParser());

// Serve the static part of the demo
app.use(express.static('public'));

app.get('/test/format', (req, res) => {
	const data = [[1,2,3],[4,5,6]];
	res.set('Vary', 'Accept');
	res.set('Cache-control', 'max-age=3600');
	res.set('Timing-Allow-Origin', '*');
	if (req.headers.accept === 'text/csv') {
		res.set('Content-type', 'text/csv');
		res.csv(data);
	} else {
		res.set('Content-type', 'application/json');
		res.json(data);
	}
});

app.get('/test/lang', (req, res) => {
	const content = {'en':'Hello world', 'jp':'こんにちは世界'};
	res.set('Vary', 'Accept-Language');
	res.set('Cache-control', 'max-age=3600');
	res.set('Timing-Allow-Origin', '*');
	res.end(content[req.headers['accept-language']]);
});

app.get(/\/test\/cookie2?/, (req, res) => {
	res.set('Vary', 'Cookie');
	res.set('Cache-control', 'max-age=3600');
	res.set('Timing-Allow-Origin', '*');
	res.json(req.cookies);
});

app.get("/test/preloadWithVary", (req, res) => {
	res.set('Vary', 'Accept-Encoding, Accept');
	res.set('Cache-control', 'max-age=3600');
	res.set('Content-type', 'text/css');
	res.set('Timing-Allow-Origin', '*');
	res.end('.foo { color: blue; }');
});
app.get("/test/preload", (req, res) => {
	res.set('Cache-control', 'max-age=3600');
	res.set('Content-type', 'text/css');
	res.set('Timing-Allow-Origin', '*');
	res.end('.foo { color: red; }');
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
