/** @odoo-module **/
import { Component, useState, useRef, onWillStart, mount } from "@odoo/owl";
import { loadJS } from "@web/core/assets";

export class FileDragUploader extends Component {
    static template = 'file_upload.FileDragUploader';

    static props = {
        fileChange: {
            type: String,
            default: (e) => {}
        },
        name: {
            type: String,
            default: ''
        }
    }

    setup() {
        this.state = useState({
            files: [],

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

        this.fileInputEle = useRef('fileInput');

        this.triggerFileInput = this.triggerFileInput.bind(this)
    }

    generateUploadId() {
        return Math.random().toString(36).substring(2, 15);
    }

    // 分片上传文件
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
                
                // 在上传之前已传出渲染
                // this.props.fileChange({ fileAddr: this.state.fileAddr })
            }
        } else {
            alert('上传分片失败!');
        }
    };

    onDragOver(event) {
        event.preventDefault();
    }

    onDrop(event) {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files);

        this.addFiles(files);
    }

    onFileChange(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
    }

    async addFiles(files) {

        if (files.length > 0) {
            const file = files[files.length - 1]
            this.state.files = [file]  // 只显示一个
            this.state.file = file;
            this.state.totalChunks = Math.ceil(file.size / this.state.chunkSize);
            this.state.currentChunk = 0;

            // 转化为Blob对象，3D渲染
            const blob = new Blob([file], { type: file.type });
            const blobUrl = URL.createObjectURL(blob);
            const fileType = FupUtils.getFileType(file.name);
            this.props.fileChange({ fileAddr:  blobUrl, fileType: fileType})

            // 将文件上传到服务端
            await this.uploadNextChunk();
        } else {
            this.state.files = []
        }

        // this.state.files.push(...files);
        console.log('文件拖拽成功')

        // // 在这里处理文件上传逻辑，比如发送到服务器
        // files.forEach(file => {
        //     const formData = new FormData();
        //     formData.append('file', file);
        //     fetch('/upload_endpoint', {
        //         method: 'POST',
        //         body: formData
        //     }).then(response => response.json())
        //       .then(data => {
        //           console.log('File uploaded successfully', data);
        //       }).catch(error => {
        //           console.error('Error uploading file', error);
        //       });
        // });
    }

    triggerFileInput() {
        this.fileInputEle.el.click();
    }
}
