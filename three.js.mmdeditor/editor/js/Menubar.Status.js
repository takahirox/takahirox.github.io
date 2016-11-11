/**
 * @author mrdoob / http://mrdoob.com/
 */

Menubar.Status = function ( editor ) {

	var container = new UI.Panel();
	container.setClass( 'menu right' );

	var showSkeleton = new UI.THREE.Boolean( editor.config.getKey( 'show skeleton' ), 'show skeleton' );
	showSkeleton.text.setColor( '#888' );
	showSkeleton.onChange( function () {

		var value = this.getValue();

		editor.config.setKey( 'show skeleton', value );

		var helpers = editor.helpers;

		var keys = Object.keys( helpers );

		for ( var i = 0, il = keys.length; i < il; i ++ ) {

			var key = keys[ i ];

			var helper = helpers[ key ];

			if ( helper instanceof THREE.SkeletonHelper ) helper.visible = value;

		}

	} );
	container.add( showSkeleton );

	var autosave = new UI.THREE.Boolean( editor.config.getKey( 'autosave' ), 'autosave' );
	autosave.text.setColor( '#888' );
	autosave.onChange( function () {

		var value = this.getValue();

		editor.config.setKey( 'autosave', value );

		if ( value === true ) {

			editor.signals.sceneGraphChanged.dispatch();

		}

	} );
	container.add( autosave );

	editor.signals.savingStarted.add( function () {

		autosave.text.setTextDecoration( 'underline' );

	} );

	editor.signals.savingFinished.add( function () {

		autosave.text.setTextDecoration( 'none' );

	} );

	var version = new UI.Text( 'r' + THREE.REVISION );
	version.setClass( 'title' );
	version.setOpacity( 0.5 );
	container.add( version );

	return container;

};
