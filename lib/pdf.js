"use strict";
var spawn = require('child_process').spawn;
var path = require('path');
var fs = require('fs');
var uuid = require('node-uuid');
var format = require('util').format;
var request = require('request');

var pdfExecutable = 'phantomjs';
if (process.platform === 'win32') {
	pdfExecutable = 'phantomjs.exe';
}
if (process.platform !== 'darwin') {
	pdfExecutable = path.resolve(path.join('bin', pdfExecutable));
}

var FORMATS = ['A3', 'A4', 'A5', 'Legal', 'Letter', 'Tabloid'];
var ORIENTATIONS = ['portrait', 'landscape'];
var marginRegExp = /^((\d)|(\d\.\d))+(in|cm|mm)$/;
var zoomRegExp = /^\d(\.\d{1,3})?$/;

var TMP_PATH = ROOT + '/public/pdf_tmp/';
var RASTERIZE_PATH = path.join(__dirname, '/rasterize.js');

exports.html2pdf = function(req, res, next) {
	if(req.query.url){
		return exports.createPDF(req, res, next);
	}
	var id = uuid.v4();
	var s = fs.createWriteStream(TMP_PATH + id + '.html');
	req.on('data', function(chunk) {
		s.write(chunk);
	});
	req.on('end', function() {
		s.end();
		req.query.id = id;
		exports.createPDF(req, res, next);
	});
}

exports.createPDF = function(req, res, next) {
	var url, tmpPdfName;
	var id = req.query.id;
	if (id) {
		url = req.protocol + '://' + req.headers.host + '/pdf_tmp/' + id + '.html';
		tmpPdfName = id;
	} else {
		url = req.query.url;
		if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) {
			url = 'http://' + url;
		}
		tmpPdfName = uuid.v4();
	}

	if (!url) {
		return next();
	}

	var tmpPDF_path = TMP_PATH + tmpPdfName + '.pdf';

	var paperFormat = req.query.format || 'A4';
	if (FORMATS.indexOf(paperFormat) === -1) {
		var msg = format('Invalid format, the following are supported: %s', FORMATS.join(', '));
		return next({status:400, message:msg});
	}
	var orientation = req.query.orientation || 'portrait';
	if (ORIENTATIONS.indexOf(orientation) === -1) {
		var msg = format('Invalid orientation, the following are supported: %s', ORIENTATIONS.join(', '));
		return next({status:400, message:msg});
	}
	var margin = req.query.margin || '1cm';
	if (!marginRegExp.test(margin)) {
		var msg = format('Invalid margin, the following formats are supported: 0cm, 1cm, 2cm, 1in, 13mm');
		return next({status:400, message:msg});
	}
	var zoom = req.query.zoom || '1';
	if (!zoomRegExp.test(zoom)) {
		var msg = format('Invalid zoom, the following kind of formats are supported: 1, 0.5, 9.25, 0.105')
		return next({status:400, message:msg});
	}

	var options = [
		'--web-security=no',
		'--ssl-protocol=any',
		RASTERIZE_PATH,
		url,
		tmpPDF_path,
		paperFormat,
		orientation,
		margin,
		zoom
	];
	var pdfProcess = spawn(pdfExecutable, options);
	var out_log = '';
	pdfProcess.stdout.on('data', function(data) {
		out_log + data;
	});
	pdfProcess.stderr.on('data', function(data) {
		out_log + data;
	});

	pdfProcess.on('close', function(code) {

		if (code !== 0) {
			next({
				staus: 500,
				message: out_log
			});
		} else {

			if(id){
				fs.unlink(TMP_PATH + id + '.html');
			}

			res.json({
				staus: 200,
				data: tmpPdfName
			});
		}
	});
}

exports.isDownloadPDF = function(req, res, next) {
	if (req.query.download === 'true') {
		var filename = req.query.filename || req.params.id;
		res.setHeader('Content-disposition', 'attachment;filename=' + filename + '.pdf');
	}
	next();
}