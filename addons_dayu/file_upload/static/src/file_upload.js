/** @odoo-module **/
import { Component, onWillStart, useState, mount} from "@odoo/owl";
import { loadJS } from "@web/core/assets";
import { registry } from "@web/core/registry";

import { FileChunkUpload } from './chunkUpload/chunkUpload'
import { Preview3D } from "./preview3D/preview3D";
import { FileDragUploader } from "./dragFile/dragFile"

class FileUpload extends Component {
    static template = "file_upload.FileUpload";

    setup() {
        this.state = useState({
            fileAddr: '',
            fileType: '',
        });

        onWillStart(async () => {
            await loadJS("/file_upload/static/lib/utils/testExport.js?t="+new Date().getTime())
        })

        // 手动绑定this
        this.onFileChangedEvent = this.onFileChangedEvent.bind(this)
    }

    testFunc() {
        TestExport.MyClass.myClassFunction();
        TestExport.pureFunc('我是file_upload.js')
    };

    onFileChangedEvent(event) {
        console.log('上传成功返回event:', event)
        this.state.fileAddr = event.fileAddr;
        this.state.fileType = event.fileType;
    };

    openDialog() {
        console.log("弹窗1")
        const dialog = new ModalDialog();
        console.log("弹窗2")
        mount(dialog, document.body);
        console.log("弹窗3")
    }
}

FileUpload.components = { FileChunkUpload, Preview3D, FileDragUploader }
registry.category("actions").add("file_upload.file_upload", FileUpload);

