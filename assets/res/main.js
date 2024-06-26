// RequireJS configuration
/*global requirejs */
requirejs.config({
	waitSeconds: 0,
        /*
	packages: [
		{
			name: 'css',
			location: 'bower-libs/require-css',
			main: 'css'
		},
		{
			name: 'less',
			location: 'bower-libs/require-less',
			main: 'less'
		}
	],
         */
	paths: {
		jquery: '/system/assets/jquery/jquery-3.x.min.js?bf92ee3f1c',
		underscore: 'bower-libs/underscore/underscore',
		crel: 'bower-libs/crel/crel',
		mousetrap: 'bower-libs/mousetrap/mousetrap',
		'mousetrap-record': 'bower-libs/mousetrap/plugins/record/mousetrap-record',
		toMarkdown: 'bower-libs/to-markdown/src/to-markdown',
		text: 'bower-libs/requirejs-text/text',
		mathjax: '../res/bower-libs/MathJax/MathJax.js?config=TeX-AMS_SVG',		
		modal: 'bower-libs/bootstrap/js/modal',
		requirejs: 'bower-libs/requirejs/require',
		'google-code-prettify': 'bower-libs/google-code-prettify/src/prettify',
		highlightjs: 'libs/highlight/highlight.pack',
		'jquery-waitforimages': 'bower-libs/waitForImages/src/jquery.waitforimages',
		//css_browser_selector: 'bower-libs/css_browser_selector/css_browser_selector',
		'pagedown-extra': 'bower-libs/pagedown-extra/node-pagedown-extra',
		pagedownExtra: 'bower-libs/pagedown-extra/Markdown.Extra',
		pagedown: 'libs/Markdown.Editor',
		//'require-css': 'bower-libs/require-css/css',
		xregexp: 'bower-libs/xregexp/xregexp-all',
		//css: 'bower-libs/require-css/css',
		//'css-builder': 'bower-libs/require-css/css-builder',
		normalize: 'bower-libs/require-css/normalize',
		prism: 'bower-libs/prism/prism',
		'prism-core': 'bower-libs/prism/components/prism-core',
		rangy: 'bower-libs/rangy/rangy-core',
		'rangy-cssclassapplier': 'bower-libs/rangy/rangy-cssclassapplier',
		diff_match_patch: 'bower-libs/google-diff-match-patch-js/diff_match_patch',
		diff_match_patch_uncompressed: 'bower-libs/google-diff-match-patch-js/diff_match_patch_uncompressed',
		hammerjs: 'bower-libs/hammerjs/hammer',
		Diagram: 'bower-libs/js-sequence-diagrams/src/sequence-diagram',
		'diagram-grammar': 'bower-libs/js-sequence-diagrams/build/diagram-grammar',
		raphael: 'bower-libs/raphael/raphael',
		'flow-chart': 'bower-libs/flowchart/release/flowchart.amd-1.3.4.min',
		flowchart: 'bower-libs/flowchart/release/flowchart-1.3.4.min',
		'to-markdown': 'bower-libs/to-markdown/src/to-markdown',
		waitForImages: 'bower-libs/waitForImages/dist/jquery.waitforimages',
		MathJax: 'bower-libs/MathJax/MathJax',		
		//alertify: 'bower-libs/alertify.js/lib/alertify'
	},
	shim: {
		underscore: {
			exports: '_'
		},		
		mathjax: [
			'libs/mathjax_init'
		],
		diff_match_patch_uncompressed: {
			exports: 'diff_match_patch'
		},
		rangy: {
                    exports: 'rangy'
		},
		'rangy-cssclassapplier': [
			'rangy'
		],
		mousetrap: {
			exports: 'Mousetrap'
		},
		'yaml-js': {
			exports: 'YAML'
		},
		'prism-core': {
			exports: 'Prism'
		},
		'bower-libs/prism/components/prism-markup': [
			'prism-core'
		],
		'libs/prism-latex': [
			'prism-core'
		],
		'libs/prism-markdown': [
			'bower-libs/prism/components/prism-markup',
			'libs/prism-latex'
		],
		'bootstrap-record': [
			'mousetrap'
		],
		toMarkdown: {
			deps: [
				'jquery'
			],
			exports: 'toMarkdown'
		},
		highlightjs: {
			exports: 'hljs'
		},	
		bootstrap: [
			'jquery'
		],
		'jquery-waitforimages': [
			'jquery'
		],
		pagedown: [
			'libs/Markdown.Converter'
		],
		pagedownExtra: [
			'libs/Markdown.Converter'
		],
		'flow-chart': [
			'raphael'
		],
		'diagram-grammar': [
			'underscore'
		],
		Diagram: [
			'raphael',
			'diagram-grammar'
		]
	}
});

// Check browser compatibility
try {
	var test = 'seLocalStorageCheck';
	localStorage.setItem(test, test);
	localStorage.removeItem(test);
	var obj = {};
	Object.defineProperty(obj, 'prop', {
		get: function() {
		},
		set: function() {
		}
	});
}
catch(e) {
	alert('Your browser is not supported, sorry!');
	throw e;
}

// Viewer mode is deduced from the body class
window.viewerMode = /(^| )viewer($| )/.test(document.body.className);

// Keep the theme in a global variable
window.theme = localStorage.themeV4 || 'default';
window.pagedownEditor = null;
window.activeContent = 1;//1 = body; 2 = intro; 3= summary
/*
var themeModule = "less!themes/" + window.theme;
if(window.baseDir.indexOf('-min') !== -1) {
	themeModule = "css!themes/" + window.theme;
}
*/
// RequireJS entry point. By requiring synchronizer, publisher, sharing and
// media-importer, we are actually loading all the modules
require([
	"jquery",
	"rangy",
	"core",
	"eventMgr",
	"fileMgr",
	//"css",
	"rangy-cssclassapplier"
	//themeModule
], function($, rangy, core, eventMgr) {

	if(window.noStart) {
		return;
	}

	$(function() {
		rangy.init();

		// Here, all the modules are loaded and the DOM is ready
		core.onReady();

		// If browser has detected a new application cache.
		if(window.applicationCache) {
			window.applicationCache.addEventListener('updateready', function() {
				if(window.applicationCache.status === window.applicationCache.UPDATEREADY) {
					window.applicationCache.swapCache();
					eventMgr.onMessage('New version available!\nJust refresh the page to upgrade.');
				}
			}, false);
		}
	});

});
