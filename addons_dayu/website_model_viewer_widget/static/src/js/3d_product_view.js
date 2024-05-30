/** @odoo-module */

import publicWidget from '@web/legacy/js/public/public_widget';
import { jsonrpc } from "@web/core/network/rpc_service";


publicWidget.registry.product_detail_view_3d = publicWidget.Widget.extend({
        selector: '.o_wsale_product_page',
        events: {
            'click .product_images':'_3dBtn',
        },
    /**
    *While clicking the extra image of the product in the website the 3D model
     is displayed.
    */
         _3dBtn:function (ev){
            var self = this;
            if (this.$(ev.target).data('type') == "3d"){
                this.$('.o_carousel_product_outer').hide()
                this.$('#product_main').show()
                this.$('#product_main').html('<canvas class="view3d-canvas" style="height: 343px;  width: 361px;"/>')
                this.$('#3d_image').addClass('active')
                this.$('#product_image').removeClass('active')
                var product_id = this.$("span[data-oe-model|='product.template']").data('oe-id')
                jsonrpc('/product/3d',{
                        product_id: product_id}
                ).then(function(data) {
                     if (data['3D_model'] != false){
                        var val = `data:model/gltf-binary;base64, ${data['3D_model']}`;
                        self.view3D = new View3D('#product_main', {
                            src: val
                        });
                     }else{
//                        var val = `/model_viewer_widget/static/src/assets/3d.glb`;
                        var val = 'http://127.0.0.1/file_upload/static/files/zcm5_1.stl';
                        self.view3D = new View3D('#product_main', {
                            src: val
                        });
                     }
                });
            }else{
                this.$('.o_carousel_product_outer').show()
                this.$('#product_main').hide()
                this.$('#product_image').addClass('active')
                this.$('#3d_image').removeClass('active')
            }
        },
    });
