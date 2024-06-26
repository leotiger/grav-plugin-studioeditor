/*globals Markdown, requirejs */
define([
	"jquery",
	"underscore",
	"crel",
	"editor",
	"layout",
	"constants",
	"utils",
	"storage",	
	"settings",
	"eventMgr",
	"text!html/bodyEditorModals.html",
	"text!html/tooltipSettingsTemplate.html",
	"text!html/tooltipSettingsPdfOptions.html",
	"storage",	
	'pagedown'
], function($, _, crel, editor, layout, constants, utils, storage, settings, eventMgr, bodyEditorModalsHTML, settingsTemplateTooltipHTML, settingsPdfOptionsTooltipHTML) {

	var core = {};

	// Used for periodic tasks
	var intervalId;

	// Used to detect user activity
	var isUserReal = false;
	var userActive = false;
	var windowUnique = true;
	var userLastActivity = 0;

	function setUserActive() {
		isUserReal = true;
		userActive = true;
		var currentTime = utils.currentTime;
		if(currentTime > userLastActivity + 1000) {
			userLastActivity = currentTime;
			eventMgr.onUserActive();
		}
	}

	function isUserActive() {
		if(utils.currentTime - userLastActivity > constants.USER_IDLE_THRESHOLD) {
			userActive = false;
		}
		return userActive && windowUnique;
	}

	// Used to only have 1 window of the application in the same browser
	var windowId;

	function checkWindowUnique() {
		if(isUserReal === false || windowUnique === false) {
			return;
		}
		if(windowId === undefined) {
			windowId = utils.id();
			storage.frontWindowId = windowId;
		}
		
		var frontWindowId = storage.frontWindowId;
		if(frontWindowId != windowId) {
			windowUnique = false;
			if(intervalId !== undefined) {
				clearInterval(intervalId);
			}
			$(".modal").modal("hide");
			$('.modal-non-unique').modal("show");
			// Attempt to close the window
			window.close();
		}
		
	}

	// Offline management
	var isOffline = false;
	var offlineTime = utils.currentTime;
	core.setOffline = function() {
		offlineTime = utils.currentTime;
		if(isOffline === false) {
			isOffline = true;
			eventMgr.onOfflineChanged(true);
		}
	};
	function setOnline() {
		if(isOffline === true) {
			isOffline = false;
			eventMgr.onOfflineChanged(false);
		}
	}

	function checkOnline() {
		// Try to reconnect if we are offline but we have some network
		if(isOffline === true && navigator.onLine === true && offlineTime + constants.CHECK_ONLINE_PERIOD < utils.currentTime) {
			offlineTime = utils.currentTime;
			// Try to download anything to test the connection
			$.ajax({
				url: "//www.google.com/jsapi",
				timeout: constants.AJAX_TIMEOUT,
				dataType: "script"
			}).done(function() {
				setOnline();
			});
		}
	}

	// Load settings in settings dialog
	var $themeInputElt;

	function loadSettings() {

		// Layout orientation
		utils.setInputRadio("radio-layout-orientation", settings.layoutOrientation);
		// Theme
		utils.setInputValue($themeInputElt, window.theme);
		$themeInputElt.change();
		// Lazy rendering
		utils.setInputChecked("#input-settings-lazy-rendering", settings.lazyRendering);
		// Editor font class
		utils.setInputRadio("radio-settings-editor-font-class", settings.editorFontClass);
		// Font size ratio
		utils.setInputValue("#input-settings-font-size", settings.fontSizeRatio);
		// Max width ratio
		utils.setInputValue("#input-settings-max-width", settings.maxWidthRatio);
		// Cursor locking ratio
		utils.setInputValue("#input-settings-cursor-focus", settings.cursorFocusRatio);
		// Default content
		utils.setInputValue("#textarea-settings-default-content", settings.defaultContent);
		// Edit mode
		utils.setInputRadio("radio-settings-edit-mode", settings.editMode);
		// Commit message
		utils.setInputValue("#input-settings-publish-commit-msg", settings.commitMsg);
		// Markdown MIME type
		utils.setInputValue("#input-settings-markdown-mime-type", settings.markdownMimeType);
		// Template
		utils.setInputValue("#textarea-settings-publish-template", settings.template);
		// PDF template
		utils.setInputValue("#textarea-settings-pdf-template", settings.pdfTemplate);
		// PDF options
		utils.setInputValue("#textarea-settings-pdf-options", settings.pdfOptions);

		// Load extension settings
		eventMgr.onLoadSettings();
	}

	// Save settings from settings dialog
	function saveSettings(event) {
		var newSettings = {};

		// Layout orientation
		newSettings.layoutOrientation = utils.getInputRadio("radio-layout-orientation");
		// Theme
		var theme = utils.getInputValue($themeInputElt);
		// Lazy Rendering
		newSettings.lazyRendering = utils.getInputChecked("#input-settings-lazy-rendering");
		// Editor font class
		newSettings.editorFontClass = utils.getInputRadio("radio-settings-editor-font-class");
		// Font size ratio
		newSettings.fontSizeRatio = utils.getInputFloatValue("#input-settings-font-size", event, 0.1, 10);
		// Max width ratio
		newSettings.maxWidthRatio = utils.getInputFloatValue("#input-settings-max-width", event, 0.1, 10);
		// Cursor locking ratio
		newSettings.cursorFocusRatio = utils.getInputFloatValue("#input-settings-cursor-focus", event, 0, 1);
		// Default content
		newSettings.defaultContent = utils.getInputValue("#textarea-settings-default-content");
		// Edit mode
		newSettings.editMode = utils.getInputRadio("radio-settings-edit-mode");
		// Commit message
		newSettings.commitMsg = utils.getInputTextValue("#input-settings-publish-commit-msg", event);
		// Markdown MIME type
		newSettings.markdownMimeType = utils.getInputValue("#input-settings-markdown-mime-type");
		// Template
		newSettings.template = utils.getInputTextValue("#textarea-settings-publish-template", event);
		// PDF template
		newSettings.pdfTemplate = utils.getInputTextValue("#textarea-settings-pdf-template", event);
		// PDF options
		newSettings.pdfOptions = utils.getInputJSONValue("#textarea-settings-pdf-options", event);

		// Save extension settings
		newSettings.extensionSettings = {};
		eventMgr.onSaveSettings(newSettings.extensionSettings, event);

		if(!event.isPropagationStopped()) {
			$.extend(settings, newSettings);
		}
	}

	// Create the PageDown editor
	var pagedownEditor;
	var fileDesc;
	core.initEditor = function(fileDescParam) {
		if(fileDesc !== undefined) {
			eventMgr.onFileClosed(fileDesc);
		}
		fileDesc = fileDescParam;

		if(pagedownEditor !== undefined) {
			// If the editor is already created
			editor.undoMgr.init();
			window.pagedownEditor = pagedownEditor;
			return pagedownEditor.uiManager.setUndoRedoButtonStates();
		}

		// Create the converter and the editor
		var converter = new Markdown.Converter();
		var options = {
			_DoItalicsAndBold: function(text) {
				// Restore original markdown implementation
				text = text.replace(/(\*\*|__)(?=\S)(.+?[*_]*)(?=\S)\1/g,
					"<strong>$2</strong>");
				text = text.replace(/(\*|_)(?=\S)(.+?)(?=\S)\1/g,
					"<em>$2</em>");
				return text;
			}
		};
		converter.setOptions(options);
		pagedownEditor = new Markdown.Editor(converter, undefined, {
			undoManager: editor.undoMgr
		});
		window.pagedownEditor = pagedownEditor;
		// Custom insert link dialog
		pagedownEditor.hooks.set("insertLinkDialog", function(callback) {
			core.insertLinkCallback = callback;
			utils.resetModalInputs();
			$(".modal-insert-link").modal();
			return true;
		});
		// Custom insert image dialog
		pagedownEditor.hooks.set("insertImageDialog", function(callback) {
			core.insertLinkCallback = callback;
			if(core.catchModal) {
				return true;
			}
			utils.resetModalInputs();
			$(".modal-insert-image").modal();
			return true;
		});
		// Custom insert media dialog
		pagedownEditor.hooks.set("insertMediaDialog", function(callback) {
			core.insertLinkCallback = callback;
			utils.resetModalInputs();
			$(".modal-insert-media").modal();
			return true;
		});

		eventMgr.onPagedownConfigure(pagedownEditor);
		pagedownEditor.hooks.chain("onPreviewRefresh", eventMgr.onAsyncPreview);
		pagedownEditor.run();
		editor.undoMgr.init();

		// Hide default buttons
		$(".wmd-button-row li").addClass("btn btn-success").css("left", 0).find("span").hide();

		// Add customized buttons
		var $btnGroupElt = $('.wmd-button-group1');
		$("#wmd-bold-button").append($('<i class="icon-bold">')).appendTo($btnGroupElt);
		$("#wmd-italic-button").append($('<i class="icon-italic">')).appendTo($btnGroupElt);
		$("#wmd-underline-button").append($('<i class="icon-underline">')).appendTo($btnGroupElt);
		$("#wmd-strikethrough-button").append($('<i class="icon-strike">')).appendTo($btnGroupElt);
		$btnGroupElt = $('.wmd-button-group2');
		$("#wmd-link-button").append($('<i class="icon-globe">')).appendTo($btnGroupElt);
		$("#wmd-quote-button").append($('<i class="icon-indent-right">')).appendTo($btnGroupElt);
		$("#wmd-code-button").append($('<i class="icon-code">')).appendTo($btnGroupElt);
		$("#wmd-image-button").append($('<i class="icon-picture">')).appendTo($btnGroupElt);
		$("#wmd-media-button").append($('<i class="icon-video">')).appendTo($btnGroupElt);
		$btnGroupElt = $('.wmd-button-group3');
		$("#wmd-olist-button").append($('<i class="icon-list-numbered">')).appendTo($btnGroupElt);
		$("#wmd-ulist-button").append($('<i class="icon-list-bullet">')).appendTo($btnGroupElt);
		$("#wmd-heading-button").append($('<i class="icon-text-height">')).appendTo($btnGroupElt);
		$("#wmd-hr-button").append($('<i class="icon-ellipsis">')).appendTo($btnGroupElt);
		$("#wmd-table-button").append($('<i class="icon-table">')).appendTo($btnGroupElt);
		$btnGroupElt = $('.wmd-button-group5');
		$("#wmd-undo-button").append($('<i class="icon-reply">')).appendTo($btnGroupElt);
		$("#wmd-redo-button").append($('<i class="icon-forward">')).appendTo($btnGroupElt);
		
		
	};

	// Initialize multiple things and then fire eventMgr.onReady
	core.onReady = function() {
		// Add RTL class
		document.body.className += ' ' + settings.editMode;
                $('body').append( bodyEditorModalsHTML );

		// Initialize utils library
		utils.init();

		// listen to online/offline events
		$(window).on('offline', core.setOffline);
		$(window).on('online', setOnline);
		if(navigator.onLine === false) {
			core.setOffline();
		}

		// Detect user activity
		$(document).mousemove(setUserActive).keypress(setUserActive);

		layout.init();
		editor.init();

		// Do periodic tasks
		intervalId = window.setInterval(function() {
			utils.updateCurrentTime();
			checkWindowUnique();
			if(isUserActive() === true || window.viewerMode === true) {
				eventMgr.onPeriodicRun();
				checkOnline();
			}
		}, 1000);

		eventMgr.onReady();
	};
	
	var $alerts = $();


	function removeAlerts() {
		$alerts.remove();
		$alerts = $();
	}

	// Other initialization that are not prioritary
	eventMgr.addListener("onReady", function() {

		$(document.body).on('shown.bs.modal', '.modal', function() {
			var $elt = $(this);
			setTimeout(function() {
				// When modal opens focus on the first button
				$elt.find('.btn:first').focus();
				// Or on the first link if any
				$elt.find('button:first').focus();
				// Or on the first input if any
				$elt.find("input:enabled:visible:first").focus();
			}, 50);
		}).on('hidden.bs.modal', '.modal', function() {
			// Focus on the editor when modal is gone
			editor.focus();
			// Revert to current theme when settings modal is closed
			applyTheme(window.theme);
		}).on('keypress', '.modal', function(e) {
			// Handle enter key in modals
			if(e.which == 13 && !$(e.target).is("textarea")) {
				$(this).find(".modal-footer a:last").click();
			}
		});

		// Click events on "insert link" and "insert image" dialog buttons
		$(".action-insert-link").click(function(e) {
			var value = utils.getInputTextValue($("#input-insert-link"), e);
			if(value !== undefined) {
				core.insertLinkCallback(value);
				core.insertLinkCallback = undefined;
			}
		});
		$(".action-insert-image").click(function(e) {
			var value = utils.getInputTextValue($("#input-insert-image"), e);
			if(value !== undefined) {
				core.insertLinkCallback(value);
				core.insertLinkCallback = undefined;
			}
		});
		$(".action-insert-media").click(function(e) {
			var value = utils.getInputTextValue($("#input-insert-mediaid"), e);
			var mediatype = utils.getInputValue($("#input-insert-mediatype"), e);
			if(mediatype !== undefined && value !== undefined) {
				core.insertLinkCallback(mediatype, value);
				core.insertLinkCallback = undefined;
			}
		});

		// Hide events on "insert link" and "insert image" dialogs
		$(".modal-insert-link, .modal-insert-image, .modal-insert-media").on('hidden.bs.modal', function() {
			if(core.insertLinkCallback !== undefined) {
				core.insertLinkCallback(null);
				core.insertLinkCallback = undefined;
			}
		});
		
		// Settings loading/saving
		$(".action-load-settings").click(function() {
			loadSettings();
		});
		$(".action-apply-settings").click(function(e) {
			saveSettings(e);
			if(!e.isPropagationStopped()) {
				window.location.reload();
			}
		});

		// Hot theme switcher in the settings
		var currentTheme = window.theme;

		function applyTheme(theme) {
			theme = theme || 'default';
			if(currentTheme != theme) {
				var themeModule = "less!themes/" + theme;
				if(window.baseDir.indexOf('-min') !== -1) {
					themeModule = "css!themes/" + theme;
				}
				// Undefine the module in RequireJS
				requirejs.undef(themeModule);
				// Then reload the style
				require([
					themeModule
				]);
				currentTheme = theme;
			}
		}

		$themeInputElt = $("#input-settings-theme");
		$themeInputElt.on("change", function() {
			applyTheme(this.value);
		});

		// Import docs and settings
		$(".action-import-docs-settings").click(function() {
			$("#input-file-import-docs-settings").click();
		});

		// Reset inputs
		$(".action-reset-input").click(function() {
			utils.resetModalInputs();
		});

		utils.createTooltip(".tooltip-lazy-rendering", 'Disable preview rendering while typing in order to offload CPU. Refresh preview after 500 ms of inactivity.');
		utils.createTooltip(".tooltip-default-content", [
			'Thanks for supporting StackEdit by adding a backlink in your documents!<br/><br/>',
			'<b class="text-danger">NOTE: Backlinks in Stack Exchange Q/A are not welcome.</b>'
		].join(''));
		utils.createTooltip(".tooltip-template", settingsTemplateTooltipHTML);
		utils.createTooltip(".tooltip-pdf-options", settingsPdfOptionsTooltipHTML);

		// Avoid dropdown panels to close on click
		$("div.dropdown-menu").click(function(e) {
			e.stopPropagation();
		});

		// Non unique window dialog
		$('.modal-non-unique').modal({
			backdrop: "static",
			keyboard: false,
			show: false
		});

		// Load images
		_.each(document.querySelectorAll('img'), function(imgElt) {
			var $imgElt = $(imgElt);
			var src = $imgElt.data('stackeditSrc');
			if(src) {
				$imgElt.attr('src', window.baseDir + '/img/' + src);
			}
		});

		if(window.viewerMode === false) {
			// Load theme list
			var themeOptions = _.reduce(constants.THEME_LIST, function(themeOptions, name, value) {
				return themeOptions + '<option value="' + value + '">' + name + '</option>';
			}, '');
			document.getElementById('input-settings-theme').innerHTML = themeOptions;
		}

	});

	return core;
});
