'use strict';

require('dotenv').load();

const path = require('path');
const express = require('express'); require('express-csv');
const events = require('events');
const cookieParser = require('cookie-parser');
const moment = require('moment');


const PORT = process.env.PORT || 3102;
const DELAY_TIME = 1000;

const app = express();

app.use(cookieParser());

app.use((req, res, next) => {
	res.set('Cache-control', 'max-age=30, public');
	res.set('Timing-Allow-Origin', '*');
	next();
});

// Serve the static part of the demo
app.use(express.static('public'));

// Special cases for 304s
app.get("/test/304-special", (req, res) => {
	res.set('Cache-control', 'must-revalidate, max-age=0, public');
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
			res.end('304 special ' + Date.now());
		}, DELAY_TIME);
	}
});

app.get("/test/:name", (req, res) => {
	setTimeout(() => {
		if ('v' in req.query) {
			res.set('Vary', req.query.v);
		}
		if ('c' in req.query && req.query.c === '0') {
			res.set('Cache-Control', 'private, no-store');
		}
		res.set('Content-type', 'text/plain');
		res.end(req.params.name + ' ' + Date.now());
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
