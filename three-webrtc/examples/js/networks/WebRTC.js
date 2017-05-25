( function () {

	// TODO: enable to switch WebRTC client.
	// TODO: support interpolation
	// TODO: support packet loss recover

	THREE.WebRTC = function ( params ) {

		if ( window.Peer === undefined ) {

			throw new Error( 'THREE.WebRTC: Import PeerJS from https://github.com/peers/peerjs.' );

		}

		if ( params === undefined ) params = {};

		var self = this;

		this.id = params.id !== undefined ? params.id : '';
		this.apikey = params.apikey !== undefined ? params.apikey : '';
		this.debugLevel = params.debugLevel !== undefined ? params.debugLevel : 0;

		this.connections = [];
		this.connectionTable = {};

		this.onOpens = [];
		this.onCloses = [];
		this.onErrors = [];
		this.onConnects = [];
		this.onDisconnects = [];
		this.onReceives = [];

		if ( params.onOpen !== undefined ) this.addEventListener( 'open', params.onOpen );
		if ( params.onClose !== undefined ) this.addEventListener( 'close', params.onClose );
		if ( params.onError !== undefined ) this.addEventListener( 'error', params.onError );
		if ( params.onConnect !== undefined ) this.addEventListener( 'connect', params.onConnect );
		if ( params.onDisconnect !== undefined ) this.addEventListener( 'disconnect', params.onDisconnect );
		if ( params.onReceive !== undefined ) this.addEventListener( 'receive', params.onReceive );

		this.peer = this.createPeer();

	};

	Object.assign( THREE.WebRTC.prototype, {

		createPeer: function () {

			var self = this;

			var param = { key: this.apikey, debug: this.debugLevel };

			var peer = this.id !== '' ? new Peer( this.id, param ) : new Peer( param );

			peer.on( 'open', function ( id ) {

				self.id = id;

				console.log( 'THREE.WebRTC: peer ID is ' + id );

				for ( var i = 0, il = self.onOpens.length; i < il; i ++ ) {

					self.onOpens[ i ]( id );

				}

			} );

			peer.on( 'close', function ( id ) {

				for ( var i = 0, il = self.onCloses.length; i < il; i ++ ) {

					self.onCloses[ i ]( id );

				}

			} );

			peer.on( 'connection', function ( connection ) {

				self.connected( connection );

			} );

			peer.on( 'error', function ( error ) {

				for ( var i = 0, il = self.onErrors.length; i < il; i ++ ) {

					self.onErrors[ i ]( error );

				}

			} );

			return peer;

		},

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
					console.log( 'THREE.WebRTC.addEventListener: Unknown type ' + type );
					break;

			}

		},

		connect: function ( destPeerId ) {

			this.connected( this.peer.connect( destPeerId ) );

		},

		connected: function ( connection ) {

			var self = this;

			var id = connection.peer;

			this.connections.push( connection );
			this.connectionTable[ id ] = connection;

			connection.on( 'open', function() {

				console.log( 'THREE.WebRTC: connected with ' + id );

				for ( var i = 0, il = self.onConnects.length; i < il; i ++ ) {

					self.onConnects[ i ]( id );

				}

				connection.on( 'data', function( data ) {

					for ( var i = 0, il = self.onReceives.length; i < il; i ++ ) {

						self.onReceives[ i ]( data );

					}

				} );

				connection.on( 'close', function () {

					console.log( 'THREE.WebRTC: disconnected with ' + id );

					delete self.connectionTable[ id ];

					// TODO: optimize
					var readIndex = 0;
					var writeIndex = 0;

					for ( var i = 0, il = self.connections.length; i < il; i ++ ) {

						if ( self.connections[ readIndex ].peer !== id ) {

							self.connections[ writeIndex ] = self.connections[ readIndex ];
							writeIndex++;

						}

						readIndex++;

					}

					self.connections.length = writeIndex;

					for ( var i = 0, il = self.onDisconnects.length; i < il; i ++ ) {

						self.onDisconnects[ i ]( id );

					}

				} );

				connection.on( 'error', function ( error ) {

					for ( var i = 0, il = self.onErrors.length; i < il; i ++ ) {

						self.onErrors[ i ]( error );

					}

				} );

			} );

		},

		hasConnection: function ( id ) {

			return this.connectionTable[ id ] !== undefined;

		},

		send: function ( id, data ) {

			var connection = this.connectionTable[ id ];

			if ( connection === undefined ) return;

			connection.send( data );

		},

		broadcast: function ( data ) {

			for ( var i = 0, il = this.connections.length; i < il; i ++ ) {

				this.connections[ i ].send( data );

			}

		}

	} );

} )();
