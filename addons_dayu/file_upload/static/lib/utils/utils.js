(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FupUtils = {}));
})(this, function (exports) {
    'use strict';

    function getFileType(fileName) {
      return fileName.split(".").pop().toLowerCase();
    }

    exports.getFileType = getFileType;

});
