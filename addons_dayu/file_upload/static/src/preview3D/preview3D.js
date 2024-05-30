/** @odoo-module **/
import { _t } from "@web/core/l10n/translation";
import { Component, useRef, useState, onMounted, onWillStart, onWillUpdateProps } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { loadJS } from "@web/core/assets";

export class Preview3D extends Component {
    static template = 'file_upload.Preview3D';

    static props = {
        name: { type: String },
        record: { type: Object },
        fileUrl: {
            type: String,
            required: true, // 必需的props
        },
        fileType: {
          type: String,
          required: true,
        }
    };

    setup() {
        this.state = useState({ isLoading: true });
        // 状态变量
        // this.state = useState({
        //
        // })

        // 使用ref获取xml中的DOM节点，xml中使用t-ref命名
        // 注意：使用时.el
        this.canvas3dEleRef = useRef('canvas3d');

        // 3D渲染的各对象
        this.scene = null;  // 场景
        this.camera = null; // 相机
        this.renderer = null;  // 渲染器
        this.controls = null;  // 创建场景控制器
        this.pointLight = null; // 灯光

        // 懒加载依赖的JS文件
        onWillStart(async () => {
            await loadJS("/file_upload/static/lib/js/three.min.js");
            await loadJS("/file_upload/static/lib/js/chevrotain.min.js");
            await loadJS("/file_upload/static/lib/js/occt-import-js.min.js");
            await loadJS("/file_upload/static/lib/js/loaders/STLLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/GLTFLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/OBJLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/FBXLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/PLYLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/ColladaLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/TDSLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/SVGLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/VRMLLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/PCDLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/XYZLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/PDBLoader.js");
            await loadJS("/file_upload/static/lib/js/loaders/KTXLoader.js");
            await loadJS("/file_upload/static/lib/js/controls/OrbitControls.js");
            // await loadJS("/file_upload/static/lib/utils/utils.js?t=" + new Date().getTime()); // FupUtils
            await loadJS("/file_upload/static/lib/utils/threeHandler.js?t=" + new Date().getTime()); // ThreeHandler
        });

        // 在props更新前调用
        onWillUpdateProps(async (nextProps) => {
            await this.render3DModel(nextProps.fileUrl, nextProps.fileType)
            console.log('执行onWillUpdateProps：', nextProps)
        });

        // 挂载事件
        onMounted(() => {
            console.log('this.props.fileUrl', this.props.fileUrl);
            console.log('this.props.fileType', this.props.fileType);
            console.log('this.props.record.data', this.props);
            // this.props.fileUrl = this.props.record.data.file_url
            
            // 创建渲染器
            this.renderer = new THREE.WebGLRenderer();
            // this.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
            this.renderer.setSize(600, 600); // 设置固定显示盒子大小
            this.render3DModel()
        });

        // 手动绑定this
        this.render3DModel = this.render3DModel.bind(this);
        this.fileAnimate = this.fileAnimate.bind(this);
        this.addSizeLabels = this.addSizeLabels.bind(this);
        this.createTextSprite = this.createTextSprite.bind(this);
        this.clearScene = this.clearScene.bind(this);
        this.removeLights = this.removeLights.bind(this);
    };

    // 3D模型渲染
    async render3DModel(fileAddr, fileType) {
        if (!fileAddr || !fileType) {
            fileAddr = this.props.fileUrl;
            fileType = this.props.fileType;
        }
        if (!fileAddr) return;
        // 渲染盒子
        const canvas = this.canvas3dEleRef.el;
        // 清除场景元素
        this.clearScene();

        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x8c8aff)

        // const fileType = FupUtils.getFileType(fileAddr);
        console.log('文件类型:', fileType)
        // 特殊文件处理stp与iges/igs
        let loadView = null;
        if (fileType == "stp") {
          loadView = await ThreeHandler.loadStp(fileAddr)
        } else if (fileType == "iges" || fileType == "igs") {
          loadView = await ThreeHandler.loadIgs(fileAddr)
        } else {}

        if (loadView) {
          console.log('stp/igs文件读取成功loadView', loadView)
          // 实现3D渲染
          const { geometry, material } = loadView;
          let mesh = new THREE.Mesh(geometry, material);
          const { box, center, size } = ThreeHandler.getMeshAndSize(mesh)
          // 添加可视化包围盒
          const boxHelper = new THREE.BoxHelper(mesh, 0xffffff)
          // const box = new THREE.Box3().setFromObject(mesh)
          const labelArr = [boxHelper] //  labelArr 用于记录元素  便于后续 一键清除
          this.addSizeLabels(box, labelArr)
          this.scene.add(boxHelper)
          this.scene.add(mesh)
          // 移除场景所有光源
          this.removeLights();
          // 创建光源
          const lights = ThreeHandler.createLights(size);
          // 添加光源
          lights.forEach(l => {
            this.scene.add(l);
          })
          // 添加一个跟随相机的点光源
          this.pointLight = ThreeHandler.createLightOfCamera();
          this.scene.add(this.pointLight)
          // 创建相机
          this.camera = ThreeHandler.createCamera(size, center, mesh.up)
          // 创建控制器
          this.controls = ThreeHandler.createControls(this.camera, this.renderer.domElement);
          canvas.appendChild(this.renderer.domElement) // 挂载
          this.fileAnimate()
          return
        }
        // 其他常规3d文件走这里

        // 获取对应的模型加载器
        const loader = await ThreeHandler.chooseLoader(fileType);
        console.log('在此执行渲染图形', fileAddr)
        loader.load(
            fileAddr,
            (model) => {
                const simpleArr = ["obj", "dae", "3ds"]
                let mesh = model.scene || model
                if (!simpleArr.includes(fileType)) {
                    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0.2 })
                    mesh = new THREE.Mesh(model, material)
                }

                  console.log("🚀 ~ loadModel ~ mesh:")
                //obj文件的mesh
                // const mesh = model.scene || model

                // stl文件的mesh
                // let material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0.2 });
                // const mesh = new THREE.Mesh(model, material);

                // 计算模型中心点
                const box = new THREE.Box3().setFromObject(mesh);
                const center = box.getCenter(new THREE.Vector3());
                mesh.position.sub(center); // 将模型居中
                const size = box.getSize(new THREE.Vector3());

                // 添加辅助器
                const max = Math.max(size.x, size.y, size.z)
                const axesHelper = new THREE.AxesHelper(max / 2 + 30)
                this.scene.add(axesHelper)

                // 添加可视化包围盒
                const boxHelper = new THREE.BoxHelper(mesh, 0xffffff)
                // const box = new THREE.Box3().setFromObject(mesh)
                const labelArr = [boxHelper] //  labelArr 用于记录元素  便于后续 一键清除
                this.addSizeLabels(box, labelArr)
                this.scene.add(boxHelper)

                // 添加光源
                // ThreeHandler.createLights(size);

                // 添加一个跟随相机的点光源 此处必须添加
                this.pointLight = ThreeHandler.createLightOfCamera();
                this.scene.add(this.pointLight)

                // 创建相机
                this.camera = ThreeHandler.createCamera(size, center, mesh.up)
                this.scene.add(mesh)

                // 有了渲染器之后   一定要先创建相机   再创建控制器
                this.controls = ThreeHandler.createControls(this.camera, this.renderer.domElement);
                canvas.appendChild(this.renderer.domElement) // 挂载
                this.fileAnimate()
            },
            undefined,
            error => {
              console.error("模型加载出错, 出错原因:", error)
            },
          )
    };

    // 渲染动作
    fileAnimate(){
        requestAnimationFrame(this.fileAnimate.bind(this));
        this.controls.update();
        // 使点光源跟随相机
        const vector = this.camera.position.clone()
        this.pointLight.position.set(vector.x, vector.y, vector.z) //点光源位置
        this.renderer.setViewport(0, 0, 600, 600) //主场景视区
        this.renderer.autoClear = false
        this.renderer.render(this.scene, this.camera);
    };

    // 清除场景信息
    clearScene() {
        if (!this.scene) return;
        // 遍历场景中的所有对象
        while (this.scene.children.length > 0) {
            // 获取第一个子对象
            const object = this.scene.children[0]

            // 如果对象是一个网格
            if (object.isMesh) {
            // 如果网格使用了几何体，释放几何体
            if (object.geometry) {
                object.geometry.dispose()
            }
            // 如果网格使用了材料，释放材料
            if (object.material) {
                if (Array.isArray(object.material)) {
                // 对于数组材料，遍历并释放每个材料
                object.material.forEach(material => material.dispose())
                } else {
                  // 对于单个材料，直接释放
                  object.material.dispose()
                }
              }
            }

            // 从场景中移除对象
            this.scene.remove(object)
            // console.log('从场景中移除对象:', object)
        }
        // 可选：如果有需要，也可以清理其他资源，如纹理
    };

    // 移除场景所有光
    removeLights() {
      const lights = [] // 用于存储场景中所有的光源
      // 遍历场景中的所有对象，找到光源
      this.scene.traverse(function (object) {
        if (object instanceof THREE.Light) {
          lights.push(object)
        }
      })
      // 移除找到的所有光源
      lights.forEach(light => {
        this.scene.remove(light)
      })
    };

    // 添加尺寸标签
    addSizeLabels(box, labelArr){
        // const size = new THREE.Vector3()
        // box.getSize(size)
        const size = box.getSize(new THREE.Vector3())
        console.log('boxSize:', size)
        //  此处scale 用于获得相机距离模型的距离  从而计算 文本放大比例
        const d = Math.sqrt(size.x * size.x + size.y * size.y)
        const scale = (d / 4).toFixed(2)
        const positions = [
          {
            text: `长: ${size.x.toFixed(2)}`,
            position: new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y, box.min.z),
          },
          {
            text: `宽: ${size.y.toFixed(2)}`,
            position: new THREE.Vector3(box.min.x, (box.min.y + box.max.y) / 2, box.min.z),
          },
          {
            text: `高: ${size.z.toFixed(2)}`,
            position: new THREE.Vector3(box.min.x, box.min.y, (box.min.z + box.max.z) / 2),
          },
        ]

        positions.forEach(dimension => {
          const sprite = this.createTextSprite(dimension.text, scale)
          sprite.position.copy(dimension.position)
          // sprite.material.depthTest = false; // 确保文本不被遮挡
          this.scene.add(sprite) // 添加到场景中
          labelArr.push(sprite)
        })

        // 调整每个标签的位置，使其位于对应的线条中间
        positions[0].position.set((box.min.x + box.max.x) / 2, box.min.y - 0.1, box.min.z - 0.1) // 长：底部中间
        positions[1].position.set(box.min.x - 0.1, (box.min.y + box.max.y) / 2, box.min.z - 0.1) // 宽：左侧中间
        positions[2].position.set(box.min.x - 0.1, box.min.y - 0.1, (box.min.z + box.max.z) / 2) // 高：前面中间

        positions.forEach(dimension => {
          const sprite = this.createTextSprite(dimension.text)
          sprite.position.copy(dimension.position)
          // sprite.material.depthTest = false; // 确保文本不被遮挡
          sprite.position.z += 0.1 // 防止与其他对象重叠
          this.scene.add(sprite) // 添加到场景中
          labelArr.push(sprite)
        })
   };

    // 创建显示尺寸信息的精灵函数
    createTextSprite(text, scale) {
        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")

        // 设置较大的分辨率和字体
        const fontSize = 40 // 增大字体大小
        const padding = 10 // 内边距
        context.font = `Bold ${fontSize}px Arial`
        context.fillStyle = "rgba(255, 255, 255, 1.0)"

        // 计算文本宽度，调整canvas大小
        const metrics = context.measureText(text)
        const textWidth = metrics.width

        canvas.width = textWidth + padding * 2 // 加一些填充
        canvas.height = fontSize + padding * 2 // 固定高度

        // 重新绘制文本到调整过大小的canvas上
        context.font = `Bold ${fontSize}px Arial`
        context.fillStyle = "rgba(255, 255, 255, 1.0)"
        context.fillText(text, padding, fontSize + padding)

        const texture = new THREE.CanvasTexture(canvas)
        texture.needsUpdate = true

        const spriteMaterial = new THREE.SpriteMaterial({ map: texture })
        const sprite = new THREE.Sprite(spriteMaterial)
        // sprite.renderOrder = 999 // 确保精灵渲染在其他对象之上  ??  不需要

        // 调整比例以适应场景，使用固定的比例
        // const scale = 10 // 固定大小的比例
        sprite.scale.set(scale, scale * (canvas.height / canvas.width), 1)

        return sprite
    };
}
// 注册为OWL组件，可让其他组件调用
registry.category('components').add('Preview3D', Preview3D);
// 注册组件到注册表(公共组件类别:可以在website中使用<owl-component name='ume_owl.ume_owl' />调用)
registry.category("public_components").add("file_upload.preview_3d", Preview3D);

// 支持在odoo页面中使用
export const preview3D = {
  component: Preview3D,
  displayName: _t("3D previewer"),
  supportedTypes: ["char"],
  extractProps: ({ fileUrl, fileType }) => {
    return { fileUrl, fileType };
  },
};
// 注册到fields集,支持在odoo页面中使用
registry.category("fields").add("preview3DWidget", preview3D);
