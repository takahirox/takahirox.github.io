/**
 * @author takahiro / https://github.com/takahirox
 *
 * Dependencies
 *  - THREE.RenderPass
 *  - THREE.ShaderPass
 *  - THREE.EffectComposer
 *  - THREE.FXAAShader
 */

THREE.WebGLDeferredRenderer = function ( parameters ) {

	parameters = parameters || {};

	// private properties

	var _this = this;

	var _gl;

	var _width, _height;

	var _compColor, _compNormalDepth, _compLight, _compFinal;
	var _passColor, _passNormalDepth, _passLight, _passLightFullscreen, _passFinal, _passFXAA;

	// external properties

	this.renderer;
	this.domElement;

	// private methods

	var init = function ( parameters ) {

		_this.renderer = parameters.renderer !== undefined ? parameters.renderer : new THREE.WebGLRenderer( { antialias: false } );
		_this.domElement = _this.renderer.domElement;

		_gl = _this.renderer.context;

		_width = parameters.width !== undefined ? parameters.width : _this.renderer.getSize().width;
		_height = parameters.height !== undefined ? parameters.height : _this.renderer.getSize().height;

		var antialias = parameters.antialias !== undefined ? parameters.antialias : false;

		initPassFXAA();
		initPassNormalDepth();
		initPassColor();
		initPassLight();
		initPassFinal();

		_this.setSize( _width, _height );
		_this.setAntialias( antialias );

	};

	var initPassFXAA = function () {

		_passFXAA = new THREE.ShaderPass( THREE.FXAAShader );

	};

	var initPassNormalDepth = function () {

		_passNormalDepth = new THREE.RenderPass();
		_passNormalDepth.clear = true;

		var rt = new THREE.WebGLRenderTarget( _width, _height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType
		} );

		rt.texture.generateMipamps = false;

		_compNormalDepth = new THREE.EffectComposer( _this.renderer, rt );
		_compNormalDepth.addPass( _passNormalDepth );

	};

	var initPassColor = function () {

		_passColor = new THREE.RenderPass();
		_passColor.clear = true;

		var rt = new THREE.WebGLRenderTarget( _width, _height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			stencilBuffer: true
		} );

		rt.texture.generateMipamps = false;

		_compColor = new THREE.EffectComposer( _this.renderer, rt );
		_compColor.addPass( _passColor );

	};

	var initPassLight = function () {

		_passLightFullscreen = new THREE.RenderPass();
		_passLightFullscreen.clear = true;
		_passLightFullscreen.camera = new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );

		_passLight = new THREE.RenderPass();
		_passLight.clear = false;

		var rt = new THREE.WebGLRenderTarget( _width, _height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.FloatType,
			depthBuffer: false  // TODO: why this's necessary?
		} );

		rt.texture.generateMipamps = false;

		_compLight = new THREE.EffectComposer( _this.renderer, rt );
		_compLight.addPass( _passLightFullscreen );
		_compLight.addPass( _passLight );

	};

	var initPassFinal = function () {

		_passFinal = new THREE.ShaderPass( THREE.ShaderDeferred[ 'composite' ] );
		_passFinal.clear = true;
		_passFinal.uniforms[ 'samplerLight' ].value = _compLight.renderTarget2.texture;
		_passFinal.material.blending = THREE.NoBlending;
		_passFinal.material.depthWrite = false;

		var rt = new THREE.WebGLRenderTarget( _width, _height, {
			minFilter: THREE.NearestFilter,
			magFilter: THREE.LinearFilter,
			format: THREE.RGBFormat,
			type: THREE.UnsignedByteType,
			depthBuffer: false
		} );

		rt.texture.generateMipamps = false;

		_compFinal = new THREE.EffectComposer( _this.renderer, rt );
		_compFinal.addPass( _passFinal );
		_compFinal.addPass( _passFXAA );

	};

	var initLightScene = function ( scene ) {

		if ( ! scene.userData.lightScene ) scene.userData.lightScene = new THREE.Scene();

		if ( ! scene.userData.lightFullscreenScene ) {

			scene.userData.lightFullscreenScene = new THREE.Scene();
			scene.userData.lightFullscreenScene.userData.emissiveLight = createDeferredEmissiveLight();
			scene.userData.lightFullscreenScene.add( scene.userData.lightFullscreenScene.userData.emissiveLight );

		}

		_passLightFullscreen.scene = scene.userData.lightFullscreenScene;

	};

	var initDeferredProperties = function ( object ) {

		if ( object.userData.deferredInitialized === true ) return;

		if ( object.material ) initDeferredMaterials( object );

		if ( object instanceof THREE.Light ) initDeferredLight( object );

		object.userData.deferredInitialized = true;

	};

	var initDeferredMaterials = function ( object ) {

		object.userData.normalDepthMaterial = createDeferredNormalDepthMaterial( object.material );
		object.userData.colorMaterial = createDeferredColorMaterial( object.material );

	};

	var createDeferredNormalDepthMaterial = function ( originalMaterial ) {

		var shader = THREE.ShaderDeferred[ 'normalDepth' ];

		var material = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader
		} );

		material.blending = THREE.NoBlending;

		if ( originalMaterial.skinning !== undefined ) material.skinning = originalMaterial.skinning;

		return material;

	};

	var createDeferredColorMaterial = function ( originalMaterial ) {

		var shader = THREE.ShaderDeferred[ 'color' ];

		var material = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
			fragmentShader: shader.fragmentShader,
			vertexShader: shader.vertexShader
		} );

		material.blending = THREE.NoBlending;

		var diffuse, emissive;

		if ( originalMaterial instanceof THREE.MeshBasicMaterial ) {

			emissive = originalMaterial.color;

		} else {

			diffuse = originalMaterial.color;
			emissive = originalMaterial.emissive;

		}

		var specular = originalMaterial.specular;
		var shininess = originalMaterial.shininess;

		if ( diffuse !== undefined ) material.uniforms.diffuse.value.copy( diffuse );
		if ( emissive !== undefined ) material.uniforms.emissive.value.copy( emissive );
		if ( specular !== undefined ) material.uniforms.specular.value.copy( specular );
		if ( shininess !== undefined ) material.uniforms.shininess.value = shininess;

		if ( originalMaterial.skinning !== undefined ) material.skinning = originalMaterial.skinning;

		return material;

	};

	var initDeferredLight = function ( light ) {

		var deferredLight;

		if ( light instanceof THREE.PointLight ) {

			deferredLight = createDeferredPointLight( light );

		}

		light.userData.deferredLight = deferredLight;

	};

	var createDeferredEmissiveLight = function () {

		var shader = THREE.ShaderDeferred[ 'emissiveLight' ];

		var material = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		} );

		material.blending = THREE.NoBlending;
		material.depthWrite = false;

		material.uniforms[ 'samplerColor' ].value = _compColor.renderTarget2.texture;

		var geometry = new THREE.PlaneBufferGeometry( 2, 2 );
		var mesh = new THREE.Mesh( geometry, material );

		return mesh;

	};

	var createDeferredPointLight = function ( light ) {

		var shader = THREE.ShaderDeferred[ 'pointLight' ];

		var material = new THREE.ShaderMaterial( {
			uniforms: THREE.UniformsUtils.clone( shader.uniforms ),
			vertexShader: shader.vertexShader,
			fragmentShader: shader.fragmentShader
		} );

		material.transparent = true;
		material.side = THREE.BackSide;
		material.blending = THREE.AdditiveBlending;
		material.depthWrite = false;
		material.depthFunc = THREE.GreaterEqualDepth;

		material.uniforms[ 'samplerNormalDepth' ].value = _compNormalDepth.renderTarget2.texture;
		material.uniforms[ 'samplerColor' ].value = _compColor.renderTarget2.texture;

		var geometry = new THREE.SphereGeometry( 1, 16, 8 );
		var mesh = new THREE.Mesh( geometry, material );

		mesh.userData.originalLight = light;

		return mesh;

	};

	var updateDeferredEmissiveLight = function ( light, camera ) {

		var uniforms = light.material.uniforms;

		uniforms[ 'viewWidth' ].value = _width;
		uniforms[ 'viewHeight' ].value = _height;

	};

	var updateDeferredPointLight = function ( light, camera ) {

		var originalLight = light.userData.originalLight;
		var distance = originalLight.distance;
		var uniforms = light.material.uniforms;

		uniforms[ 'matProjInverse' ].value.getInverse( camera.projectionMatrix );
		uniforms[ 'viewWidth' ].value = _width;
		uniforms[ 'viewHeight' ].value = _height;
		uniforms[ 'lightColor' ].value.copy( originalLight.color );

		if ( distance > 0 ) {

			light.scale.set( 1, 1, 1 ).multiplyScalar( distance );
			uniforms[ 'lightRadius' ].value = distance;
			uniforms[ 'lightPositionVS' ].value.setFromMatrixPosition( originalLight.matrixWorld ).applyMatrix4( camera.matrixWorldInverse );
			light.position.setFromMatrixPosition( originalLight.matrixWorld );

		} else {

			uniforms[ 'lightRadius' ].value = Infinity;

		}

	};

	var setMaterialNormalDepth = function ( object ) {

		if ( object.userData.normalDepthMaterial ) object.material = object.userData.normalDepthMaterial;

	};

	var setMaterialColor = function ( object ) {

		if ( object.userData.colorMaterial ) object.material = object.userData.colorMaterial;

	};

	var saveOriginalMaterial = function ( object ) {

		if ( object.material ) object.userData.originalMaterial = object.material;

	};

	var restoreOriginalMaterial = function ( object ) {

		if ( object.userData.originalMaterial ) object.material = object.userData.originalMaterial;

	};

	var renderNormalDepth = function ( scene, camera ) {

		_passNormalDepth.scene = scene;
		_passNormalDepth.camera = camera;

		scene.traverse( setMaterialNormalDepth );

		_this.renderer.autoClearDepth = true;
		_this.renderer.autoClearStencil = true;

		_compNormalDepth.render();

	};

	var renderColor = function ( scene, camera ) {

		_passColor.scene = scene;
		_passColor.camera = camera;

		scene.traverse( setMaterialColor );

		_this.renderer.autoClearDepth = true;
		_this.renderer.autoClearStencil = false;

		_gl.enable( _gl.STENCIL_TEST );
		_gl.stencilFunc( _gl.ALWAYS, 1, 0xffffffff );
		_gl.stencilOp( _gl.REPLACE, _gl.REPLACE, _gl.REPLACE );

		_compColor.render();

	};

	var renderLight = function ( scene, camera ) {

		updateDeferredEmissiveLight( scene.userData.lightFullscreenScene.userData.emissiveLight, camera );

		var lightScene = scene.userData.lightScene;

		scene.traverse( function ( object ) {

			if ( object.userData.deferredLight ) {

				if ( ! object.userData.inLightScene ) {

					lightScene.add( object.userData.deferredLight );
					object.userData.inLightScene = true;

				}

				updateDeferredPointLight( object.userData.deferredLight, camera );

			}

		} );

		_passLight.scene = lightScene;
		_passLight.camera = camera;

		_this.renderer.autoClearDepth = false;
		_this.renderer.autoClearStencil = false;

		_gl.stencilFunc( _gl.EQUAL, 1, 0xffffffff );

		_compLight.render();

		_gl.disable( _gl.STENCIL_TEST );

	};

	var renderComposite = function ( scene, camera ) {

		_this.renderer.autoClearDepth = true;
		_this.renderer.autoClearStencil = true;

		_compFinal.render();

	};

	// external APIs

	this.setSize = function ( width, height ) {

		_width = width;
		_height = height;

		this.renderer.setSize( _width, _height );

		_compNormalDepth.setSize( _width, _height );
		_compColor.setSize( _width, _height );
		_compLight.setSize( _width, _height );
		_compFinal.setSize( _width, _height );

		_passFXAA.uniforms[ 'resolution' ].value.set( 1 / _width, 1 / _height );

	};

	this.setAntialias = function ( enabled ) {

		if ( enabled ) {

			_passFXAA.renderToScreen = true;
			_passFXAA.enabled = true;

			_passFinal.renderToScreen = false;

		} else {

			_passFXAA.renderToScreen = false;
			_passFXAA.enabled = false;

			_passFinal.renderToScreen = true;

		}

	};

	this.render = function ( scene, camera ) {

		initLightScene( scene );

		scene.traverse( initDeferredProperties );
		scene.traverse( saveOriginalMaterial );

		scene.autoUpdate = false;
		scene.updateMatrixWorld();

		renderNormalDepth( scene, camera );
		renderColor( scene, camera );
		renderLight( scene, camera );
		renderComposite( scene, camera );

		scene.traverse( restoreOriginalMaterial );

	};

	// initialize

	init( parameters );

};

THREE.DeferredShaderChunk = {

	packVector3: [

		"float vec3_to_float( vec3 data ) {",

			"const float unit = 255.0/256.0;",
			"highp float compressed = fract( data.x * unit ) + floor( data.y * unit * 255.0 ) + floor( data.z * unit * 255.0 ) * 255.0;",
			"return compressed;",

		"}"

	].join( "\n" ),

	unpackFloat: [

		"vec3 float_to_vec3( float data ) {",

			"const float unit = 255.0;",
			"vec3 uncompressed;",
			"uncompressed.x = fract( data );",
			"float zInt = floor( data / unit );",
			"uncompressed.z = fract( zInt / unit );",
			"uncompressed.y = fract( floor( data - ( zInt * unit ) ) / unit );",
			"return uncompressed;",

		"}"

	].join( "\n" )

};

THREE.ShaderDeferred = {

	normalDepth: {

		uniforms: {},

		vertexShader: [

			"varying vec3 vNormal;",
			"varying vec4 vPosition;",

			THREE.ShaderChunk[ "skinning_pars_vertex" ],

			"void main() {",

				THREE.ShaderChunk[ "begin_vertex" ],
				THREE.ShaderChunk[ "beginnormal_vertex" ],
				THREE.ShaderChunk[ "skinbase_vertex" ],
				THREE.ShaderChunk[ "skinnormal_vertex" ],
				THREE.ShaderChunk[ "defaultnormal_vertex" ],
				THREE.ShaderChunk[ "skinning_vertex" ],
				THREE.ShaderChunk[ "project_vertex" ],

				"vNormal = normalize( normalMatrix * objectNormal );",
				"vPosition = gl_Position;",

			"}"

		].join( "\n" ),

		fragmentShader: [

			"varying vec3 vNormal;",
			"varying vec4 vPosition;",

			"void main() {",

				"vec3 normal = normalize( vNormal );",

				"vec4 color;",
				"color.rgb = normal * 0.5 + 0.5;",
				"color.a = vPosition.z / vPosition.w;",

				"gl_FragColor = color;",

			"}"

		].join( "\n" )

	},

	color: {

		uniforms: {

				diffuse: { type: "c", value: new THREE.Color( 0x000000 ) },
				emissive: { type: "c", value: new THREE.Color( 0x000000 ) },
				specular: { type: "c", value: new THREE.Color( 0x000000 ) },
				shininess: { type: "f", value: 30.0 },

		},

		vertexShader: [

			THREE.ShaderChunk[ "skinning_pars_vertex" ],

			"void main() {",

				THREE.ShaderChunk[ "begin_vertex" ],
				THREE.ShaderChunk[ "beginnormal_vertex" ],
				THREE.ShaderChunk[ "skinbase_vertex" ],
				THREE.ShaderChunk[ "skinnormal_vertex" ],
				THREE.ShaderChunk[ "defaultnormal_vertex" ],
				THREE.ShaderChunk[ "skinning_vertex" ],
				THREE.ShaderChunk[ "project_vertex" ],

			"}"

		].join( "\n" ),

		fragmentShader: [

			"uniform vec3 diffuse;",
			"uniform vec3 emissive;",
			"uniform vec3 specular;",
			"uniform float shininess;",

			THREE.DeferredShaderChunk[ "packVector3" ],

			"void main() {",

				"vec4 color;",
				"color.x = vec3_to_float( diffuse );",
				"color.y = vec3_to_float( emissive );",
				"color.z = vec3_to_float( specular );",
				"color.w = shininess;",
				"gl_FragColor = color;",

			"}"

		].join( "\n" )

	},

	emissiveLight: {

		uniforms: {

			samplerColor: { type: "t", value: null },
			viewWidth: { type: "f", value: 800 },
			viewHeight: { type: "f", value: 600 },

		},

		vertexShader : [

			"void main() { ",

				"gl_Position = vec4( sign( position.xy ), 0.0, 1.0 );",

			"}"

		].join( '\n' ),

		fragmentShader : [

			"uniform sampler2D samplerColor;",

			"uniform float viewHeight;",
			"uniform float viewWidth;",

			THREE.DeferredShaderChunk[ "unpackFloat" ],

			"void main() {",

				"vec2 texCoord = gl_FragCoord.xy / vec2( viewWidth, viewHeight );",

				"vec4 colorMap = texture2D( samplerColor, texCoord );",
				"vec3 emissive = float_to_vec3( abs( colorMap.y ) );",

				"gl_FragColor = vec4( emissive, 1.0 );",

			"}"

		].join( '\n' )

	},

	pointLight: {

		uniforms: {

			samplerNormalDepth: { type: "t", value: null },
			samplerColor: { type: "t", value: null },

			matProjInverse: { type: "m4", value: new THREE.Matrix4() },

			viewWidth: { type: "f", value: 800 },
			viewHeight: { type: "f", value: 600 },

			lightColor: { type: "c", value: new THREE.Color( 0x000000 ) },
			lightPositionVS : { type: "v3", value: new THREE.Vector3( 0, 1, 0 ) },
			lightRadius: { type: "f", value: 1.0 }

		},

		vertexShader : [

			"void main() {",

				"vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",
				"gl_Position = projectionMatrix * mvPosition;",

			"}"

		].join( "\n" ),

		fragmentShader : [

			"uniform sampler2D samplerNormalDepth;",
			"uniform sampler2D samplerColor;",

			"uniform float viewHeight;",
			"uniform float viewWidth;",

			"uniform vec3 lightColor;",
			"uniform vec3 lightPositionVS;",
			"uniform float lightRadius;",

			"uniform mat4 matProjInverse;",

			THREE.DeferredShaderChunk[ "unpackFloat" ],

			"void main() {",

				"vec2 texCoord = gl_FragCoord.xy / vec2( viewWidth, viewHeight );",

				"vec4 normalDepth = texture2D( samplerNormalDepth, texCoord );",
				"float z = normalDepth.w;",

				"if ( z == 0.0 ) discard;",

				"vec2 xy = texCoord * 2.0 - 1.0;",

				"vec4 vertexPositionProjected = vec4( xy, z, 1.0 );",
				"vec4 vertexPositionVS = matProjInverse * vertexPositionProjected;",
				"vertexPositionVS.xyz /= vertexPositionVS.w;",
				"vertexPositionVS.w = 1.0;",

				"vec3 lightVector = lightPositionVS - vertexPositionVS.xyz;",
				"float distance = length( lightVector );",

				"if ( distance > lightRadius ) discard;",

				"vec3 normal = normalDepth.rgb * 2.0 - 1.0;",
				"float depth = normalDepth.a;",

				"vec4 inColor = texture2D( samplerColor, texCoord );",
				"vec3 diffuse = float_to_vec3( inColor.r );",
				"vec3 emissive = float_to_vec3( inColor.g );",
				"vec3 specular = float_to_vec3( inColor.b );",
				"float shininess = inColor.a;",

				"float cutoff = 0.3;",
				"float denom = distance / lightRadius + 1.0;",
				"float attenuation = 1.0 / ( denom * denom );",
				"attenuation = ( attenuation - cutoff ) / ( 1.0 - cutoff );",
				"attenuation = max( attenuation, 0.0 );",
				"//attenuation *= attenuation;",

				"vec3 halfVector = normalize( lightVector - normalize( vertexPositionVS.xyz ) );",
				"float dotNormalHalf = max( dot( normal, halfVector ), 0.0 );",
				"float specularNormalization = ( shininess + 2.0001 ) / 8.0;",
				"vec3 schlick = specular + vec3( 1.0 - specular ) * pow( 1.0 - dot( lightVector, halfVector ), 5.0 );",
				"specular = schlick * max( pow( dotNormalHalf, shininess ), 0.0 ) * diffuse * specularNormalization;",

				"gl_FragColor = vec4( lightColor * ( diffuse * dot( normal, lightVector ) + specular ), attenuation );",
				"//gl_FragColor = vec4( lightColor, 0.5 );",

			"}"

		].join( "\n" )

	},

	composite: {

		uniforms: {

			samplerLight: { type: "t", value: null },

		},

		vertexShader : [

			"varying vec2 texCoord;",

			"void main() {",

				"vec4 pos = vec4( sign( position.xy ), 0.0, 1.0 );",
				"texCoord = pos.xy * vec2( 0.5 ) + 0.5;",
				"gl_Position = pos;",

			"}"

		].join( "\n" ),

		fragmentShader : [

			"varying vec2 texCoord;",
			"uniform sampler2D samplerLight;",

			"void main() {",

				"vec4 inColor = texture2D( samplerLight, texCoord );",
				"gl_FragColor = inColor;",

			"}"

		].join( "\n" )

	}

};