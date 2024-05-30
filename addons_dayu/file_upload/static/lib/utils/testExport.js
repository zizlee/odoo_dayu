(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TestExport = {}));
})(this, function (exports) {
    'use strict';
    class MyClass {
        static myClassFunction = () => {
            console.log('在js/testExport.js中的myFunction被调用！')
        }
    };

    async function pureFunc(prm) {
        console.log('在js/testExport.js中，pureFunc被调用！我是utils')
    };

    exports.MyClass = MyClass;
    exports.pureFunc = pureFunc;


    // 目标文件使用方法
    // await loadJS("/file_upload/static/lib/utils/testExport.js?t="+new Date().getTime())
    // TestExport.MyClass.myClassFunction();
    // TestExport.pureFunc('我是file_upload.js')
});
