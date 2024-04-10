define([
	"underscore",
	"utils",
	"storage",
], function(_, utils, storage) {

	function FileDescriptor(fileIndex, title) {
		this.fileIndex = fileIndex;
		this._title = title || storage[fileIndex + ".title"];
		this._editorScrollTop = parseInt(storage[fileIndex + ".editorScrollTop"]) || 0;
		this._editorStart = parseInt(storage[fileIndex + ".editorEnd"]) || 0;
		this._editorEnd = parseInt(storage[fileIndex + ".editorEnd"]) || 0;
		this._previewScrollTop = parseInt(storage[fileIndex + ".previewScrollTop"]) || 0;
		this._selectTime = parseInt(storage[fileIndex + ".selectTime"]) || 0;
		Object.defineProperty(this, 'title', {
			get: function() {
				return this._title;
			},
			set: function(title) {
				this._title = title;
				storage[this.fileIndex + ".title"] = title;
			}
		});
		Object.defineProperty(this, 'content', {
			get: function() {
				return storage[this.fileIndex + ".content"];
			},
			set: function(content) {
				storage[this.fileIndex + ".content"] = content;
			}
		});
		Object.defineProperty(this, 'editorScrollTop', {
			get: function() {
				return this._editorScrollTop;
			},
			set: function(editorScrollTop) {
				this._editorScrollTop = editorScrollTop;
				storage[this.fileIndex + ".editorScrollTop"] = editorScrollTop;
			}
		});
		Object.defineProperty(this, 'editorStart', {
			get: function() {
				return this._editorStart;
			},
			set: function(editorStart) {
				this._editorStart = editorStart;
				storage[this.fileIndex + ".editorStart"] = editorStart;
			}
		});
		Object.defineProperty(this, 'editorEnd', {
			get: function() {
				return this._editorEnd;
			},
			set: function(editorEnd) {
				this._editorEnd = editorEnd;
				storage[this.fileIndex + ".editorEnd"] = editorEnd;
			}
		});
		Object.defineProperty(this, 'previewScrollTop', {
			get: function() {
				return this._previewScrollTop;
			},
			set: function(previewScrollTop) {
				this._previewScrollTop = previewScrollTop;
				storage[this.fileIndex + ".previewScrollTop"] = previewScrollTop;
			}
		});
		Object.defineProperty(this, 'selectTime', {
			get: function() {
				return this._selectTime;
			},
			set: function(selectTime) {
				this._selectTime = selectTime;
				storage[this.fileIndex + ".selectTime"] = selectTime;
			}
		});
	}

	return FileDescriptor;
});
