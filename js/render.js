const { debug } = require('console');
const { WebSocketServer } = require('ws');
const ws = require('ws')

const activeRobots = new Map

const globalMap = []

var scene, camera, renderer, contols;
const w = window.innerWidth;
const h = window.innerHeight;
const ratio = w / h;

var targetPoint

const initThree = () => {
    scene = new THREE.Scene()
    camera = new THREE.PerspectiveCamera(45, ratio, 0.1, 2000)
    camera.position.x = 30
    camera.position.y = 30
    camera.position.z = 30
    axis = new THREE.AxesHelper(1)
    scene.add(axis)

    renderer = new THREE.WebGLRenderer({ antialias: true })

    renderer.setClearColor('#aaaaaa')
    renderer.setSize(w, h)

    controls = new THREE.OrbitControls(camera, renderer.domElement)

    document.getElementById('webgl').append(renderer.domElement)

    const grid = new THREE.GridHelper(4100, 100, '#ffffff')
    scene.add(grid)

    const ambient = new THREE.AmbientLight( 0x404040, 3);
    scene.add(ambient)

    const point = new THREE.PointLight( 0x404040 , 10, 100 );
    point.position.set( 50, 50, 50 );
    scene.add( point );

    const geometry = new THREE.SphereGeometry( 5, 0, 0 );
    const material = new THREE.MeshBasicMaterial( { color: 0xffff00 } );
    const sphere = new THREE.Mesh( geometry, material );
    targetPoint = sphere
    scene.add( sphere );

    scene.add( targetPoint )

    for(var i = 0; i < 6; i++) {
        for(var j = 0; j < 3; j++) {
            let geo = new THREE.PlaneGeometry(41, 41, 1, 1)
            let m   = new THREE.MeshStandardMaterial({color: 0xcc0000})

            geo.rotateX(3*Math.PI/2)

            let tile = new THREE.Mesh(geo, m)
            tile.translateX(20.5 + 41*i)
            tile.translateZ(20.5 + 41*j)

            scene.add(tile)
            globalMap[i*3+j] = tile
        }
    }

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight
        camera.updateProjectionMatrix()

        renderer.setSize(window.innerWidth, window.innerHeight)
    })

    const render = () => {
        requestAnimationFrame(render)
        renderer.render(scene, camera)
        controls.update()
    }
    render()
}

const updateRobotPos = (name, x, y, t) => {
    if(activeRobots.get(name) != undefined) {
        activeRobots.get(name).position.x = x
        activeRobots.get(name).position.y = 0
        activeRobots.get(name).position.z = -y
        activeRobots.get(name).setRotationFromAxisAngle(new THREE.Vector3(0, -1, 0), -t)
    }
}

const loadRobot = (name) => {
    const gltfLoader = new THREE.GLTFLoader();
    gltfLoader.load( 'assets/romi.glb', ( gltf ) => {
        let geo = gltf.scene.getObjectByName('imagetostl_mesh').geometry
        let material = new THREE.MeshStandardMaterial({color: 0x0000aa})
        
        group = new THREE.Group()

        let mesh = new THREE.Mesh( geo, material )
        mesh.scale.x = 0.05
        mesh.scale.y = 0.05
        mesh.scale.z = 0.05

        mesh.position.set( -5, -2.75, 5)
        mesh.rotation.x = Math.PI/2
        mesh.rotation.z = -Math.PI/2

        group.add(mesh)
        scene.add( group )
        
        activeRobots.set(name, group)
    })
}

const updateMap = ( view ) => {
    for(var i = 0; i < 6; i++) {
        for(var j = 0; j < 3; j++) {
            if(view.getUint8((i*3)+j, true) & 0b10000) {
                globalMap[(i*3)+j].material.color.setHex(0x00aa00)
            }
        }
    }
}

const updateTargetPoint = ( x, y ) => {
    console.log("%f %f", x, y)
    targetPoint.position.x = x
    targetPoint.position.z = y
}

const createDebugMessage = (data) => {
    var p = document.createElement('p')
    p.textContent = data
    d = document.getElementById("debug")

    p = d.appendChild(p)

    // p.animate([
    //     { opacity: 1},
    //     { opacity: 0}
    // ], 30000).finished.then(() => {
    //     p.remove()
    // })
}

function _base64ToArrayBuffer(base64) {
    var binary_string = window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return new DataView(bytes.buffer);
}

const initWS = () => {
    const wss = new WebSocketServer({
        port: 1337
    })

    wss.on('connection', (ws) => {
        loadRobot( "Roamy1" )

        ws.on('message', (data) => {
            var msg = JSON.parse(data)

            if('loggingMessage' in msg) {
                createDebugMessage(atob(msg.loggingMessage))
            }

            if('globalMap' in msg) {
                console.log(msg)
                var view = _base64ToArrayBuffer(msg.globalMap)
                updateMap(view)
            }

            if('pose' in msg) {
                var view = _base64ToArrayBuffer(msg.pose)

                updateRobotPos("Roamy1", view.getFloat32(0, true), view.getFloat32(4, true), view.getFloat32(8, true))
            }

            if('targetPoint' in msg) {
                var view = _base64ToArrayBuffer(msg.targetPoint)

                updateTargetPoint(view.getFloat32(0, true), view.getFloat32(4, true))
            }
        })
    })
}

initThree()
initWS()