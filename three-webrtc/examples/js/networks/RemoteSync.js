( function () {

	var TRANSFER_TYPE_SYNC = 0;
	var TRANSFER_TYPE_SNOOP = 1

	// TODO: support interpolation
	// TODO: support packet loss recover for UDP

	THREE.RemoteSync = function ( client ) {

		var self = this;

		this.client = client;

		this.id = client.id;

		this.localObjects = {};
		this.remoteObjects = {};
		this.transferComponents = {};

		this.onOpens = [];
		this.onCloses = [];
		this.onErrors = [];
		this.onConnects = [];
		this.onDisconnects = [];
		this.onReceives = [];

		this.client.addEventListener( 'open', function( id ) { self.onOpen( id ); } );
		this.client.addEventListener( 'close', function( id ) { self.onClose( id ); } );
		this.client.addEventListener( 'error', function( error ) { self.onError( error ); } );
		this.client.addEventListener( 'connect', function( id ) { self.onConnect( id ); } );
		this.client.addEventListener( 'disconnect', function( id ) { self.onDisconnect( id ); } );
		this.client.addEventListener( 'receive', function( data ) { self.onReceive( data ); } );

	};

	Object.assign( THREE.RemoteSync.prototype, {

		addEventListener: function ( type, func ) {

			switch ( type ) {

				case 'open':
					this.onOpens.push( func );
					break;

				case 'close':
					this.onCloses.push( func );
					break;

				case 'error':
					this.onErrors.push( func )
					break;

				case 'connect':
					this.onConnects.push( func )
					break;

				case 'disconnect':
					this.onDisconnects.push( func );
					break;

				case 'receive':
					this.onReceives.push( func );
					break;

				default:
					console.log( 'THREE.RemoteSync.addEventListener: Unknown type ' + type );
					break;

			}

		},

		connect: function ( destId ) {

			this.client.connect( destId );

		},

		addLocalObject: function ( object ) {

			this.localObjects[ this.id ] = object;

		},

		addRemoteObject: function ( id, object ) {

			this.remoteObjects[ id ] = object;

		},

		onOpen: function ( id ) {

			this.id = id;

			for ( var i = 0, il = this.onOpens.length; i < il; i ++ ) {

				this.onOpens[ i ]( id );

			}

		},

		onClose: function ( id ) {

			for ( var i = 0, il = this.onCloses.length; i < il; i ++ ) {

				this.onCloses[ i ]( id );

			}

		},

		onError: function ( error ) {

			for ( var i = 0, il = this.onErrors.length; i < il; i ++ ) {

				this.onErrors[ i ]( error );

			}

		},

		onConnect: function ( id ) {

			for ( var i = 0, il = this.onConnects.length; i < il; i ++ ) {

				this.onConnects[ i ]( id );

			}

			this.sendSnoopList( id );

			this.sync( true );

		},

		onDisconnect: function ( id ) {

			var object = this.remoteObjects[ id ];

			if ( object === undefined ) return;

			for ( var i = 0, il = this.onDisconnects.length; i < il; i ++ ) {

				this.onDisconnects[ i ]( id, object );

			}

			delete this.remoteObjects[ id ];

		},

		checkUpdate: function ( id, object ) {

			var component = this.transferComponents[ id ];

			if ( component === undefined ) return true;

			var array = component.matrix;
			var array2 = object.matrix.elements;

			for ( var i = 0, il = array.length; i < il; i ++ ) {

				if ( array[ i ] !== array2[ i ] ) return true;

			}

			return false;

		},

		serialize: function ( id, object ) {

			if ( this.transferComponents[ id ] === undefined ) {

				this.transferComponents[ id ] = {
					type: TRANSFER_TYPE_SYNC,
					id: id,
					matrix: [ 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1 ]
				};

			}

			var component = this.transferComponents[ id ];

			component.type = TRANSFER_TYPE_SYNC;
			component.id = id;

			var array = component.matrix;
			var array2 = object.matrix.elements;

			for ( var i = 0, il = array.length; i < il; i ++ ) {

				array[ i ] = array2[ i ];

			}

			return component;

		},

		deserialize: function ( object, component ) {

			object.matrix.fromArray( component.matrix );
			object.matrix.decompose( object.position, object.quaternion, object.scale );

		},

		sync: function ( force ) {

			if ( this.localObjects[ this.id ] === undefined ) return;

			if ( force === true || this.checkUpdate( this.id, this.localObjects[ this.id ] ) ) {

				this.client.broadcast( this.serialize( this.id, this.localObjects[ this.id ] ) );

			}

		},

		sendSnoopList: function ( id ) {

			// TODO: temporal. Is this safe?
			this.client.send( id, {
				type: TRANSFER_TYPE_SNOOP,
				id: this.id,
				ids: Object.keys( this.client.connectionTable )
			} );

		},

		snoop: function ( ids ) {

			for ( var i = 0, il = ids.length; i < il; i ++ ) {

				var id = ids[ i ];

				if ( this.id === id || this.client.hasConnection( id ) ) continue;

				this.connect( id );

			}

		},

		onReceive: function ( component ) {

			switch ( component.type ) {

				case TRANSFER_TYPE_SYNC:

					var object = this.remoteObjects[ component.id ];
					if ( object !== undefined ) this.deserialize( object, component );
					break;

				case TRANSFER_TYPE_SNOOP:

					this.snoop( component.ids );
					break;

				default:

					console.log( 'THREE.RemoteSync.unReceive: Unknown type ' + component.type );
					break;

			}

			for ( var i = 0, il = this.onReceives.length; i < il; i ++ ) {

				this.onReceives[ i ]( component );

			}

		}

	} );

} )();
