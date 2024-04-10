define([], function() {
	var constants = {};
	constants.VERSION = "4.3.14";
	constants.MAIN_URL = "https://carlos.cal-talaia.cat/user/plugins/studioeditor/assets";	
	constants.DEFAULT_FILE_TITLE = "Title";
	constants.EDITOR_DEFAULT_PADDING = 15;
	constants.CHECK_ONLINE_PERIOD = 120000;
	constants.AJAX_TIMEOUT = 30000;
	constants.ASYNC_TASK_DEFAULT_TIMEOUT = 60000;
	constants.ASYNC_TASK_LONG_TIMEOUT = 180000;
	constants.USER_IDLE_THRESHOLD = 300000;
	constants.IMPORT_FILE_MAX_CONTENT_SIZE = 100000;
	constants.IMPORT_IMG_MAX_CONTENT_SIZE = 10000000;
	constants.WELCOME_DOCUMENT_TITLE = "Hello!";
	constants.TEMPORARY_FILE_INDEX = "file.tempIndex";

	// Site dependent
	//constants.BASE_URL = "http://localhost/";
	constants.BASE_URL = "https://carlos.cal-talaia.cat/";

	constants.THEME_LIST = {
		"blue": "Blue",
		"default": "Default",
		"gray": "Gray",
		"night": "Night",
		"school": "School",
		"solarized-light": "Solarized Light",
		"solarized-dark": "Solarized Dark"
	};

	return constants;
});
