(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ThreeHandler = {}));
})(this, function (exports) {
    'use strict';
     function chooseLoader(type) {
        let loader;
        switch (type.toLowerCase()) {
          case "gltf":
          case "glb":
            loader = new THREE.GLTFLoader()
            break
          case "obj":
            loader = new THREE.OBJLoader()
            break
          case "fbx":
            loader = new THREE.FBXLoader()
            break
          case "stl":
            // case 'x_t':
            loader = new THREE.STLLoader();
            break
          case "ply":
            loader = new THREE.PLYLoader()
            break
          case "collada":
          case "dae":
            loader = new THREE.ColladaLoader()
            break
          case "3ds":
            loader = new THREE.TDSLoader()
            break
          case "svg":
            loader = new THREE.SVGLoader()
            break
          case "vrml":
          case "wrl":
            loader = new THREE.VRMLLoader()
            break
          case "pcd":
            loader = new THREE.PCDLoader()
            break
          case "xyz":
            loader = new THREE.XYZLoader()
            break
          case "pdb":
            loader = new THREE.PDBLoader()
            break
          case "ktx2":
            loader = new THREE.KTX2Loader()
            break
          default:
            console.error("Unsupported model type:", type)
            return
        }
        return loader
    };

    // 加载Stp文件
    async function loadStp(fileUrl) {
      // init occt-import-js   已全局引入
      // eslint-disable-next-line no-undef
      const occt = await occtimportjs()
      let response = await fetch(fileUrl)
      let buffer = await response.arrayBuffer()
      // read the imported step file
      let fileBuffer = new Uint8Array(buffer)
      let result = occt.ReadStepFile(fileBuffer, null)
      // process the geometries of the result
      const resultMesh = result.meshes[0]
      let geometry = new THREE.BufferGeometry()

      geometry.setAttribute("position", new THREE.Float32BufferAttribute(resultMesh.attributes.position.array, 3))
      if (resultMesh.attributes.normal) {
        geometry.setAttribute("normal", new THREE.Float32BufferAttribute(resultMesh.attributes.normal.array, 3))
      }
      const index = Uint32Array.from(resultMesh.index.array)
      geometry.setIndex(new THREE.BufferAttribute(index, 1))

      let material = null
      if (resultMesh.color) {
        const color = new THREE.Color(resultMesh.color[0], resultMesh.color[1], resultMesh.color[2])
        material = new THREE.MeshPhongMaterial({ color: color })
      } else {
        //  side 属性很重要  用于剖面空心状态的显示
        // material = new THREE.MeshPhongMaterial({ color: 0xcccccc, side: THREE.BackSide })
        material = new THREE.MeshPhongMaterial({ color: 0xcccccc })
      }
      return { geometry, material }
    };

    // 加载igs文件
    async function loadIgs(fileUrl) {
      // init occt-import-js   已全局引入
      // eslint-disable-next-line no-undef
      const occt = await occtimportjs()
      // download a step file
      let response = await fetch(fileUrl)
      let buffer = await response.arrayBuffer()
      // read the imported step file
      let fileBuffer = new Uint8Array(buffer)
      // let igesResult = occt.ReadIgesFile(fileBuffer, null);
      let result = occt.ReadIgesFile(fileBuffer, null)
      if (result.success) {
        const mergedGeometry = new THREE.BufferGeometry()
        const positionArray = []
        const normalArray = []
        const indexArray = []

        let offset = 0

        result.meshes.forEach(mesh => {
          positionArray.push(...mesh.attributes.position.array)
          if (mesh.attributes.normal) {
            normalArray.push(...mesh.attributes.normal.array)
          }
          if (mesh.index) {
            mesh.index.array.forEach(index => {
              indexArray.push(index + offset)
            })
            offset += mesh.attributes.position.array.length / 3
          }
        })
        const positions = new Float32Array(positionArray)
        mergedGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3))
        if (normalArray.length > 0) {
          const normals = new Float32Array(normalArray)
          mergedGeometry.setAttribute("normal", new THREE.BufferAttribute(normals, 3))
        }
        if (indexArray.length > 0) {
          const indices = new Uint32Array(indexArray)
          mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1))
        }
        mergedGeometry.computeBoundingBox()
        mergedGeometry.computeBoundingSphere()
        const material = new THREE.MeshStandardMaterial({ color: 0xffffff })
        return { geometry: mergedGeometry, material }
      } else {
        console.error("IGES文件加载失败")
      }
    };

    // 获取网格大小
    function getMeshAndSize(mesh) {
      const box = new THREE.Box3().setFromObject(mesh)
      const center = box.getCenter(new THREE.Vector3())
      mesh.position.sub(center) // 将模型居中
      const size = box.getSize(new THREE.Vector3())
      return { box, center, size }
    };

    // 添加场景光源
    function createLights(size) {
      //  平行光的距离影响也很大  太远会显得很模糊
      // const lightX = size.x + 50
      // const lightY = size.y + (lightX / size.y) * 50
      let lightsList = [];
      const ll = size.x + size.y
      const lightX = ll
      const lightY = ll
      // const lightY = size.y + 50
      const lightZ = size.z * 2
      // const halfZ = lightZ / 2
      const halfZ = lightZ / 4
      // 添加光源  不然模型会是全黑色的
      const color = 0xffffff
      const skyColor = 0xb1e1ff // light blue
      const groundColor = 0xb97a20 // brownish orange
      const intensity = 0.8
      //  环境光   没有方向，无法产生阴影   通常的作用是提亮场景，让暗部不要太暗
      const ambientLight = new THREE.AmbientLight(color, intensity)
      lightsList.push(ambientLight)
      
      // 右前
      const directionLight22 = new THREE.DirectionalLight(0xffffff, intensity)
      directionLight22.position.set(lightX, lightY, lightZ)
      // directionLight22.target.position.set(0, 0, 0)
      const directionLight22Helper = new THREE.DirectionalLightHelper(directionLight22)
      lightsList.push(directionLight22Helper)
      lightsList.push(directionLight22)
      // 顶部
      const directionLightBottom = new THREE.DirectionalLight(0xffffff, intensity)
      directionLightBottom.position.set(0, 0, lightZ + 50)
      const directionLightBottomHelper = new THREE.DirectionalLightHelper(directionLightBottom)
      lightsList.push(directionLightBottomHelper)
      lightsList.push(directionLightBottom)
      return lightsList;
    };

    // 添加一个跟随相机的点光源
    function createLightOfCamera() {
      const pointLight = new THREE.DirectionalLight(0xffffff, 0.5, 100)
      pointLight.castShadow = true
      return pointLight;
    };

    // 创建相机
    function createCamera(size, center) {
      // const { x, y, z } = up || { x: 0, y: 0, z: 1 } //  元素自带基底面  用于相机视角 默认为Z轴
      const d = Math.sqrt(size.x * size.x + size.y * size.y)
      // this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
      // OrthographicCamera正交投影相机；PerspectiveCamera透视投影相机
      // OrthographicCamera( left : Number, right : Number, top : Number, bottom : Number, near : Number, far : Number )
      // left — 摄像机视锥体左侧面。
      // right — 摄像机视锥体右侧面。
      // top — 摄像机视锥体上侧面。
      // bottom — 摄像机视锥体下侧面。
      // near — 摄像机视锥体近端面。
      // far — 摄像机视锥体远端面。
      let camera = new THREE.OrthographicCamera(-d, d, d, -d, 1, 1000) //  直接展示物体每个面的真实 映射  眼 = 物体
      // const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)  //  模拟人眼  以点看物体  眼 < 物体
      // 计算相机位置
      // 定位相机到左上角
      // camera.position.set(center.x - size.x, center.y + size.y, center.z)
      camera.position.set(size.x - center.x, -(center.y + size.y), center.z)
      camera.lookAt(center)
      camera.up.set(0, 0, 1)
      // const helper = new THREE.CameraHelper(camera)
      // scene.add(helper)
      return camera
    };

    // 创建控制器
    function createControls(camera, dom, type="orbit") {
      let controls
      if (type != "orbit") {
        controls = new THREE.TransformControls(camera, dom)
      } else {
        controls = new THREE.OrbitControls(camera, dom)
      }
      controls.enableDamping = true // 启用阻尼效果
      controls.dampingFactor = 0.25 // 阻尼系数
      controls.enableZoom = true // 启用缩放
      // controls.enablePan = !true;
      controls.enableRotate = true // 启用旋转
      // controls.screenSpacePanning = false; // 允许基于世界坐标的平移
      controls.target.set(0, 0, 0)
      controls.minDistance = 1
      controls.maxDistance = 1000
      return controls
    }

    exports.chooseLoader = chooseLoader;
    exports.loadStp = loadStp;
    exports.loadIgs = loadIgs;
    exports.getMeshAndSize = getMeshAndSize;
    exports.createLights = createLights;
    exports.createLightOfCamera = createLightOfCamera;
    exports.createCamera = createCamera;
    exports.createControls = createControls;

});
