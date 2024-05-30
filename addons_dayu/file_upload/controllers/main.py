# _*_ coding:utf-8 _*_
# at:2024-05-22
# author:zizle
import json
from pathlib import Path
from odoo import http
from odoo.http import request
from odoo.modules import get_module_path


class FileUploadController(http.Controller):
    @http.route('/file_upload/upload', type='http', auth='public', methods=['POST'], csrf=False)
    def upload_file(self, **post):
        # file = request.httprequest.files.get('file')
        file = post.get('file')

        base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')

        message = '请上传文件。'
        code = 200
        sql_filepath = ''
        if file:
            file_name = file.filename
            # 将文件保存到相应的服务文件夹
            module_path = Path(get_module_path('file_upload'))
            folder = module_path.joinpath('static/files/')
            save_file = folder.joinpath(file_name)
            with open(save_file, 'wb') as f:
                f.write(file.read())  # 读取二进制数据

            sql_filepath = '/file_upload/static/files/' + file_name

            # 写入数据库
            request.env['file.upload'].sudo().create({
                'name': file_name,
                'file_url': sql_filepath,
            })

            message = '上传文件成功!'
            code = 201

        response_data = {
            'message': message,
            'file_url': base_url + sql_filepath,
            'code': code
        }

        return request.make_response(
            data=json.dumps(response_data),
            headers=[('Content-Type', 'application/json')],
            status=code
        )

    @http.route('/file_upload/upload/chunk', type='http', auth='public', methods=['POST'], csrf=False)
    def upload_file_block(self, **kwargs):
        # 获取请求中的分片信息
        chunk_number = int(kwargs.get('chunkNumber'))
        total_chunks = int(kwargs.get('totalChunks'))
        file_name = kwargs.get('filename')
        upload_id = kwargs.get('uploadId')

        # 创建一个临时目录来存储分片
        module_path = Path(get_module_path('file_upload'))
        upload_dir = module_path.joinpath('static/chunks') / upload_id
        upload_dir.mkdir(parents=True, exist_ok=True)

        # 保存当前分片
        chunk_file = request.httprequest.files['file']
        chunk_path = upload_dir / f"{file_name}.part{chunk_number}"
        with chunk_path.open('wb') as f:
            f.write(chunk_file.read())

        # 检查是否所有分片都上传完毕
        uploaded_chunks = len(list(upload_dir.glob(f"{file_name}.part*")))

        if uploaded_chunks == total_chunks:
            # 合并分片
            final_file_path = module_path.joinpath('static/files') / file_name
            sql_filepath = f'/file_upload/static/files/{file_name}'
            with open(final_file_path, 'wb') as final_file:
                for i in range(1, total_chunks + 1):
                    part_path = upload_dir / f"{file_name}.part{i}"
                    with part_path.open('rb') as part_file:
                        final_file.write(part_file.read())
                    part_path.unlink()  # 删除分片文件

            # 写入sql
            request.env['file.upload'].sudo().create({
                'name': file_name,
                'file_url': sql_filepath,
            })

            base_url = request.env['ir.config_parameter'].sudo().get_param('web.base.url')
            response_data = {
                'message': '文件上传且合并成功',
                'file_url': base_url + sql_filepath,
                'code': 201
            }

            return request.make_response(
                data=json.dumps(response_data),
                headers=[('Content-Type', 'application/json')],
                status=201
            )

        return request.make_response(
            data=json.dumps({'message': '分片上传成功!', 'file_url': '', 'code': 200}),
            headers=[('Content-Type', 'application/json')],
            status=200
        )
