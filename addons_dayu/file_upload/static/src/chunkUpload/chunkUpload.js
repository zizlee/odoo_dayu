/** @odoo-module **/

import { Component, useState, onWillStart } from "@odoo/owl";
import { loadJS } from "@web/core/assets";

export class FileChunkUpload extends Component {
    static template = 'file_upload.ChunkUpload';

    static props = {
        fileChange: {
            type: Function,
            default: (e) => {}
        },
    }

    setup() {
        this.state = useState({
            fileAddr: '',
            file: null,
            chunkSize: 1024 * 1024, // 1MB
            uploadId: this.generateUploadId(),
            totalChunks: 0,
            currentChunk: 0,
        });

        onWillStart(async () => {
            await loadJS("/file_upload/static/lib/utils/utils.js?t=" + new Date().getTime()); // FupUtils
        })
    }

    generateUploadId() {
        return Math.random().toString(36).substring(2, 15);
    }

    async onFileChange(ev) {
        const file = ev.target.files[0];

        // 转化为Blob对象
        const blob = new Blob([file], { type: file.type });
        const blobUrl = URL.createObjectURL(blob);
        const fileType = FupUtils.getFileType(file.name);
        this.props.fileChange({ fileAddr:  blobUrl, fileType: fileType})
        // 以下是同时将文件上传到服务端
        this.state.file = file;
        this.state.totalChunks = Math.ceil(file.size / this.state.chunkSize);
        this.state.currentChunk = 0;
        await this.uploadNextChunk();
    }

    async uploadNextChunk() {
        const { file, chunkSize, currentChunk, totalChunks, uploadId } = this.state;
        const start = currentChunk * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        const formData = new FormData();
        formData.append('file', chunk);
        formData.append('chunkNumber', currentChunk + 1);
        formData.append('totalChunks', totalChunks);
        formData.append('filename', file.name);
        formData.append('uploadId', uploadId);

        const response = await fetch('/file_upload/upload/chunk', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            this.state.currentChunk += 1;
            console.log('上传分片:' + this.state.currentChunk + '/' + this.state.totalChunks)
            if (this.state.currentChunk < totalChunks) {
                await this.uploadNextChunk();
            } else {
                // alert('文件上传且合并成功!');
                const resData = await response.json();
                this.state.fileAddr = resData.file_url;
                console.log('文件上传成功响应:', this.state);
                // 在上传之前使用本地blob创建出本地URL，使用本地路径解析
                // this.props.fileChange({ fileAddr: this.state.fileAddr })
            }
        } else {
            alert('上传分片失败!');
        }
    }
}
