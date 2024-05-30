# _*_ coding:utf-8 _*_
# at:2024-05-22
# author:zizle
from odoo import models, fields, api


class FileUpload(models.Model):
    _name = 'file.upload'
    _description = '文件上传'

    name = fields.Char(string='文件名称', required=True)
    file_url = fields.Char(string='路径', required=True)
    description = fields.Text(string='描述')

