var wuntils = require('sdk/window/utils');
var ss = require('simple-storage');
var tabs = require("tabs");

if(typeof ss.storage.searchengines == 'undefined')
	ss.storage.searchengines = [];

ss.storage.searchengines['stackoverflow'] = "http://stackoverflow.com/search?q={0}";

if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

var tabtosearch = {
	isSearching : false,
	searchSite : ""
};

function bestMatch(str)
{
	var engs = ss.storage.searchengines;
	var match = "";
	var matchingLen = 0;

	for(var eng in engs)
	{	
		if(engs.hasOwnProperty(eng))
		{
			var i = 0;
			for(i = 0; i < eng.length && str[i] == eng[i]; i++);

			if(i > matchingLen)
			{
				match = eng;
				matchingLen = i;
			}	
		}
	}

	return match;
}


var document = wuntils.getMostRecentBrowserWindow().document;
var urlBar = document.getElementById("urlbar");

urlBar.addEventListener('keydown', function(e){
		if( e.keyCode == '9' ){
			tabtosearch.searchSite = bestMatch(urlBar.value);
			if(tabtosearch.searchSite.length > 0)
			{
				urlBar.value = "Search " + tabtosearch.searchSite + ": ";
				e.preventDefault();
				tabtosearch.isSearching = true;
			}
		}
		else if(e.keyCode == '13' && tabtosearch.isSearching) {
			e.preventDefault();
			var searchTerm = urlBar.value.substring(urlBar.value.indexOf(":") + 2);
			var searchSite = ss.storage.searchengines[tabtosearch.searchSite];
			tabs.open(searchSite.format(searchTerm));
		}
	}, true);
