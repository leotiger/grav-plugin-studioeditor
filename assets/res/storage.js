// Setup an empty localStorage or upgrade an existing one
define([
    "underscore"
], function(_) {

    function retrieveIndexArray(storeIndex) {
        try {
            return _.compact(localStorage[storeIndex].split(";"));
        }
        catch(e) {
            localStorage[storeIndex] = ";";
            return [];
        }
    }

    var fileIndexList = retrieveIndexArray("file.list");
    var currentFileIndex, settings;

    // localStorage versioning
    var version = localStorage.version;

    if(version === undefined) {
		/*
        // Not used anymore
        localStorage.removeItem("sync.queue");
        localStorage.removeItem("sync.current");
        localStorage.removeItem("file.counter");

        _.each(fileIndexList, function(fileIndex) {
            localStorage[fileIndex + ".publish"] = ";";
            var syncIndexList = retrieveIndexArray(fileIndex + ".sync");
            _.each(syncIndexList, function(syncIndex) {
                localStorage[syncIndex + ".contentCRC"] = "0";
                // We store title CRC only for Google Drive synchronization
                if(localStorage[syncIndex + ".etag"] !== undefined) {
                    localStorage[syncIndex + ".titleCRC"] = "0";
                }
            });
        });
		*/
        version = "v1";
    }

    if(version == "v1") {
        version = "v2";
    }

    if(version == "v2") {
        version = "v3";
    }

    if(version == "v3") {
        version = "v4";
    }

    if(version == "v4") {
        version = "v5";
    }

    if(version == "v5") {
        version = "v6";
    }

    if(version == "v6") {
        version = "v7";
    }

    if(version == "v7" || version == "v8" || version == "v9") {
        version = "v10";
    }

    if(version == "v10") {
        version = "v11";
    }

    if(version == "v11") {
        version = "v12";
    }

    if(version == "v12" || version == "v13") {
        version = "v14";
    }

    if(version == "v14") {
        version = "v15";
    }

    if(version == "v15") {
        version = "v16";
    }

    if(version == "v16" || version == "v17") {
        version = "v18";
    }

	if(version == 'v18') {
		version = "v19";
	}

	if(version == 'v19') {
		version = "v20";
	}

	if(version == 'v20') {
		version = "v21";
	}

    if(version == "v21") {
        version = "v22";
    }

	if(version == "v22") {
		version = "v23";
	}
	
	localStorage.version = version;
    return localStorage;
});
