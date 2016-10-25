/**
 * @author takahirox / http://github.com/takahirox/
 *
 * Dependencies
 *  - THREE.ChainableEffect
 */

THREE.ToonMapEffect = function ( renderer, parameters ) {

	THREE.ChainableEffect.call( this, renderer );

	parameters = parameters || {};

	function createCanvas() {

		var canvas = document.createElement( 'canvas' );
		canvas.width = 32;
		canvas.height = 32;

		var ctx = canvas.getContext( '2d' );
		ctx.fillStyle = 'grey';
		ctx.fillRect( 0, 0, 16, 32 );
		ctx.fillStyle = 'white';
		ctx.fillRect( 16, 0, 16, 32 );

		return canvas;

	}

	function createTexture() {

		var texture = new THREE.Texture( createCanvas() );
		texture.needsUpdate = true;
		return texture;

	}

	function setToonMap( object ) {

		var material = object.material;

		if ( material === undefined ) return;

		if ( material.isMultiMaterial === true ) {

			for ( var i = 0, il = material.materials.length; i < il; i ++ ) {

				createToonMap( material.materials[ i ] );

			}

		} else {

			createToonMap( material );

		}

	}

	function createToonMap( material ) {

		if ( material.isMeshPhongMaterial !== true ) return;

		if ( material.toonMap !== null ) return;

		material.toonMap = createTexture();
		material.needsUpdate = true;

	}

	this.render = function ( scene, camera, renderTarget, forceClear ) {

		scene.traverse( setToonMap );

		var currentAutoClear = renderer.autoClear;
		renderer.autoClear = this.autoClear;

		renderer.render( scene, camera, renderTarget, forceClear );

		renderer.autoClear = currentAutoClear;

	};

};

THREE.ToonMapEffect.prototype = Object.create( THREE.ChainableEffect.prototype );
THREE.ToonMapEffect.prototype.constructor = THREE.ToonMapEffect;
