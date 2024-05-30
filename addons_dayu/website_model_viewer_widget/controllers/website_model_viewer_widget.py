# -*- coding: utf-8 -*-
#############################################################################
#
#    Cybrosys Technologies Pvt. Ltd.
#
#    Copyright (C) 2024-TODAY Cybrosys Technologies(<https://www.cybrosys.com>)
#    Author: Cybrosys Techno Solutions(<https://www.cybrosys.com>)
#
#    You can modify it under the terms of the GNU LESSER
#    GENERAL PUBLIC LICENSE (LGPL v3), Version 3.
#
#    This program is distributed in the hope that it will be useful,
#    but WITHOUT ANY WARRANTY; without even the implied warranty of
#    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#    GNU LESSER GENERAL PUBLIC LICENSE (LGPL v3) for more details.
#
#    You should have received a copy of the GNU LESSER GENERAL PUBLIC LICENSE
#    (LGPL v3) along with this program.
#    If not, see <http://www.gnu.org/licenses/>.
#
#############################################################################
from odoo import http
from odoo.http import request


class ProductModel(http.Controller):
    """This class represents a 3D product model"""
    @http.route('/product/3d', type='json', auth='none')
    def get_product_3d_model(self, product_id):
        """This method returns a 3d model uploaded in the product"""
        product = request.env['product.template'].sudo().browse(int(product_id))
        print('product:', product)
        # product.model_3d = 'http://127.0.0.1/file_upload/static/files/招财猫 5_1.stl'
        # product.model_3d = True
        return {
            '3D_model': product.model_3d if product.model_3d else False, }
