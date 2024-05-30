# _*_ coding:utf-8 _*_
# at:2024-05-22
# author:zizle
{
    'name': '3D文件预览',
    'version': '1.0.0',
    'summary': '3D文件预览系统',
    'sequence': '10',
    'category': 'Customization/FileUpload',
    'description': '无描述',
    'website': '',
    'author': 'zizle',
    'depends': ['base', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/file_upload_views.xml',
        'views/file_upload_file_views.xml',
        'views/file_upload_menus.xml',
    ],
    'installable': True,
    'application': True,
    'license': 'LGPL-3',
    'icon': 'file_upload/static/description/3d.png',
    'assets': {
        'web.assets_backend': [
            'file_upload/static/files/**/*',
            'file_upload/static/src/**/*'
        ],
        'web.assets_frontend': [
            'file_upload/static/src/**/*'
        ],
    },
}
