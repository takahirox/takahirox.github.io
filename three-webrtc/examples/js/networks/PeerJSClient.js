( function () {

	// TODO: support packet loss recover

	THREE.PeerJSClient = function ( params ) {

		if ( window.Peer === undefined ) {

			throw new Error( 'THREE.PeerJSClient: Import PeerJS from https://github.com/peers/peerjs.' );

		}

		if ( params === undefined ) params = {};

		THREE.NetworkClient.call( this, params );

		var self = this;

		this.apikey = params.apikey !== undefined ? params.apikey : '';
		this.debugLevel = params.debugLevel !== undefined ? params.debugLevel : 0;

		this.connections = [];
		this.connectionTable = {};

		this.peer = this.createPeer();

	};

	THREE.PeerJSClient.prototype = Object.create( THREE.NetworkClient.prototype );
	THREE.PeerJSClient.prototype.constructor = THREE.PeerJSClient;

	Object.assign( THREE.PeerJSClient.prototype, {

		createPeer: function () {

			var self = this;

			var param = { key: this.apikey, debug: this.debugLevel };

			var peer = this.id !== '' ? new Peer( this.id, param ) : new Peer( param );

			peer.on( 'open', function ( id ) {

				self.id = id;

				console.log( 'THREE.PeerJSClient: peer ID is ' + id );

				self.onOpen( id );

			} );

			peer.on( 'close', function ( id ) {

				self.onClose( id );

			} );

			peer.on( 'connection', function ( connection ) {

				self.connected( connection );

			} );

			peer.on( 'error', function ( error ) {

				self.onError( error );

			} );

			return peer;

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

				console.log( 'THREE.PeerJSClient: connected with ' + id );

				self.onConnect( id );

				connection.on( 'data', function( data ) {

					self.onReceive( data );

				} );

				connection.on( 'close', function () {

					console.log( 'THREE.PeerJSClient: disconnected with ' + id );

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

					self.onDisconnect( id );

				} );

				connection.on( 'error', function ( error ) {

					self.onError( error );

				} );

			} );

		},

		hasConnection: function ( id ) {

			return this.connectionTable[ id ] !== undefined;

		},

		connectionNum: function () {

			return this.connections.length;

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
