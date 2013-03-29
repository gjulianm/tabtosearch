var wuntils = require('sdk/window/utils');
var ss = require('simple-storage');
var tabs = require("tabs");
var awesomebar = require("./awesomebar");

function registerToAwesomebar(name, url) {
	awesomebar.add({
		keyword: name,
		onSearch: function(searchTerms, suggest) {
			suggest({
				title: "Search " + searchTerms + " in " + name,
				description: "",
				url: url.format(searchTerms)
			});
		}
	});
}

function saveAndRegister(name, url) {
	ss.storage.searchengines[name] = url;
	registerToAwesomebar(name, url);
}

if (typeof ss.storage.searchengines == 'undefined') {
	console.log('init');
	ss.storage.searchengines = {};
	ss.storage.searchengines['stackoverflow.com'] = "http://stackoverflow.com/search?q={0}";
	ss.storage.searchengines['google.com'] = "http://www.google.es/search?q={0}";
	ss.storage.searchengines['news.ycombinator.com'] = "https://www.hnsearch.com/search#request/all&q={0}";
}

for (var eng in ss.storage.searchengines) {
	if (ss.storage.searchengines.hasOwnProperty(eng)) {
		registerToAwesomebar(eng, ss.storage.searchengines[eng]);
	}
}

function getQueryParams(qs) {

	var params = {}, tokens,
	re = /[?&]?([^=]+)=([^&]*)/g;

	while (tokens = re.exec(qs)) {
		params[tokens[1]] = tokens[2];
	}

	return params;
}

if (!String.prototype.format) {
	String.prototype.format = function() {
		var args = arguments;
		return this.replace(/{(\d+)}/g, function(match, number) {
			return typeof args[number] != 'undefined' ? args[number] : match;
		});
	};
}

if (!Array.prototype.last) {
	Array.prototype.last = function() {
		return this[this.length - 1];
	}
}

tabs.on("ready", function(tab) {
	var params = getQueryParams(tab.url.split('?')[1]);
	var possibleSearchParams = ['q', 's', 'search'];

	if (tab.url.match(/http[s]?:\/\/(www\.|)google\.[a-z]*\/url.*/) == null) return; // Explicitly exclude Google URL redirects.

	for (var i = 0; i < possibleSearchParams.length; i++) {
		var param = possibleSearchParams[i];

		if (typeof params[param] != 'undefined') {
			// well... Should probably come later to this.
			var formattedSearchUrl = tab.url.replace(param + '=' + params[param], param + '={0}');

			if (formattedSearchUrl.indexOf(param + '={0}') == -1) continue; // Replacing didn't go well and we don't want to end up with a non-working URL.

			// and to this too.
			var site = formattedSearchUrl.split('/')[2];
			if (site.indexOf('www.') == 0) site = site.substring(4);

			console.log(site + " matched with " + formattedSearchUrl);
			registerToAwesomebar(site, formattedSearchUrl);

			console.log(JSON.stringify(ss.storage.searchengines));
			break;
		}
	}
});

function bestMatch(str) {
	var engs = ss.storage.searchengines;
	var match = "";
	var matchingLen = 0;

	for (var eng in engs) {
		if (engs.hasOwnProperty(eng)) {
			var i = 0;
			for (i = 0; i < eng.length && str[i] == eng[i]; i++);

			if (i > matchingLen) {
				match = eng;
				matchingLen = i;
			}
		}
	}

	return match;
}

var tabtosearch = {
	isSearching: false,
	searchSite: "",
	termTriggered: ""
};

var document = wuntils.getMostRecentBrowserWindow().document;
var urlBar = document.getElementById("urlbar");

urlBar.addEventListener('keydown', function(e) {
	if (e.keyCode == '9') {
		tabtosearch.searchSite = bestMatch(urlBar.value);
		if (tabtosearch.searchSite.length > 0) {
			urlBar.value = tabtosearch.searchSite + ' ';
			e.preventDefault();
		}
	}
}, true);
