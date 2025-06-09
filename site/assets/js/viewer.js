window.universalViewer = function() {
    return {
        type: null,
        source: null,
        viewer: null,

        init() {
            // Get item data from page
            const itemEl = document.querySelector('[data-item-type]');
            if (itemEl) {
                this.type = itemEl.dataset.itemType;
                this.source = itemEl.dataset.itemSource;

                // Initialize appropriate viewer
                this.$nextTick(() => {
                    switch(this.type) {
                        case 'image':
                            this.initImageViewer();
                            break;
                        case 'video':
                            this.initVideoViewer();
                            break;
                        case 'audio':
                            this.initAudioViewer();
                            break;
                        case 'document':
                            this.initDocumentViewer();
                            break;
                        case '3d':
                            this.init3DViewer();
                            break;
                    }
                });
            }
        },

        initImageViewer() {
            this.viewer = OpenSeadragon({
                id: 'openseadragon-viewer',
                prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.1.0/images/',
                tileSources: {
                    type: 'image',
                    url: this.source
                },
                showNavigator: true,
                showRotationControl: true,
                showFullPageControl: true,
                visibilityRatio: 1.0,
                constrainDuringPan: true,
                minZoomLevel: 0.5,
                maxZoomLevel: 10
            });
        },

        initVideoViewer() {
            const player = videojs('video-player', {
                controls: true,
                fluid: true,
                playbackRates: [0.5, 1, 1.5, 2],
                plugins: {}
            });

            player.src({ src: this.source, type: this.mimeType || 'video/mp4' });
        },

        initAudioViewer() {
            // Could add waveform visualization here
            const audio = document.querySelector('audio');
            if (audio) {
                audio.addEventListener('loadedmetadata', () => {
                    console.log('Audio loaded:', audio.duration);
                });
            }
        },

        initDocumentViewer() {
            // PDF.js is loaded via iframe to their viewer
            console.log('Document viewer initialized');
        },

        init3DViewer() {
            const container = document.getElementById('threejs-viewer');
            if (!container) return;

            // Basic Three.js setup
            const scene = new THREE.Scene();
            scene.background = new THREE.Color(0x222222);

            const camera = new THREE.PerspectiveCamera(
                75,
                container.clientWidth / container.clientHeight,
                0.1,
                1000
            );

            const renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            container.appendChild(renderer.domElement);

            // Add lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            scene.add(ambientLight);

            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 5);
            scene.add(directionalLight);

            // Load 3D model (example with OBJ loader)
            // In real implementation, would load the actual model file
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
            const cube = new THREE.Mesh(geometry, material);
            scene.add(cube);

            camera.position.z = 5;

            // Controls
            const controls = {
                mouseX: 0,
                mouseY: 0
            };

            container.addEventListener('mousemove', (e) => {
                controls.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
                controls.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
            });

            // Animation loop
            function animate() {
                requestAnimationFrame(animate);

                cube.rotation.x += 0.01;
                cube.rotation.y += 0.01;

                renderer.render(scene, camera);
            }

            animate();

            // Handle resize
            window.addEventListener('resize', () => {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });

            this.viewer = { scene, camera, renderer };
        },

        zoomIn() {
            if (this.viewer && this.viewer.viewport) {
                this.viewer.viewport.zoomBy(1.5);
            }
        },

        zoomOut() {
            if (this.viewer && this.viewer.viewport) {
                this.viewer.viewport.zoomBy(0.67);
            }
        },

        resetZoom() {
            if (this.viewer && this.viewer.viewport) {
                this.viewer.viewport.goHome();
            }
        },

        toggleFullscreen() {
            if (this.viewer && this.viewer.setFullScreen) {
                this.viewer.setFullScreen(!this.viewer.isFullPage());
            }
        },

        download() {
            if (this.source) {
                const link = document.createElement('a');
                link.href = this.source;
                link.download = true;
                link.click();
            }
        },

        resetCamera() {
            if (this.viewer && this.viewer.camera) {
                this.viewer.camera.position.set(0, 0, 5);
                this.viewer.camera.lookAt(0, 0, 0);
            }
        },

        toggleWireframe() {
            if (this.viewer && this.viewer.scene) {
                this.viewer.scene.traverse((child) => {
                    if (child.isMesh) {
                        child.material.wireframe = !child.material.wireframe;
                    }
                });
            }
        }
    };
};