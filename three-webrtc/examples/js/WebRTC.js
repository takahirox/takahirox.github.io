( function () {

	THREE.WebRTC = function ( params ) {

		if ( window.Peer === undefined ) {

			throw new Error( 'THREE.WebRTC: Import PeerJS.' );

		}

		var self = this;

		this.id = params.id !== undefined ? params.id : '';
		this.apikey = params.apikey !== undefined ? params.apikey : '';
		this.debugLevel = params.debugLevel !== undefined ? params.debugLevel : 0;

		this.connections = [];

		this.onReceive = null;
		this.onOpen = null;
		this.onConnect = null;
		this.onClose = null;
		this.onError = null;

		if ( params.onOpen !== undefined ) {

			var onOpen = params.onOpen;

			this.onOpen = function ( id ) {

				onOpen( id );

			};

		}

		if ( params.onConnect !== undefined ) {

			var onConnect = params.onConnect;

			this.onConnect = function ( id ) {

				onConnect( id );

			};

		}

		if ( params.onReceive !== undefined ) {

			var onReceive = params.onReceive;

			this.onReceive = function ( data ) {

				onReceive( data );

			};

		}

		if ( params.onClose !== undefined ) {

			var onClose = params.onClose;

			this.onClose = function ( data ) {

				onClose( data );

			};

		}

		if ( params.onError !== undefined ) {

			var onError = params.onError;

			this.onError = function ( data ) {

				onError( data );

			};

		}

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

				if ( self.onOpen ) self.onOpen( id );

			} );

			peer.on( 'connection', function ( connection ) {

				self.connected( connection );

			} );

			peer.on( 'error', function ( error ) {

				if ( self.onError ) self.onError( error );

			} );

			return peer;

		},

		connect: function ( destPeerId ) {

			this.connected( this.peer.connect( destPeerId ) );

		},

		connected: function ( connection ) {

			var self = this;

			this.connections.push( connection );

			connection.on( 'open', function() {

				console.log( 'THREE.WebRTC: connected with ' + connection.peer );

				if ( self.onConnect !== null ) self.onConnect( connection.peer );

				connection.on( 'data', function( data ) {

					if ( self.onReceive !== null ) self.onReceive( data );

				} );

				connection.on( 'close', function () {

					// TODO: optimize
					var readIndex = 0;
					var writeIndex = 0;

					for ( var i = 0, il = self.connections.length; i < il; i ++ ) {

						if ( self.connections[ readIndex ].peer !== connection.peer ) {

							self.connections[ writeIndex ] = self.connections[ readIndex ];
							writeIndex++;

						}

						readIndex++;

					}

					self.connections.length = writeIndex;

					if ( self.onClose !== null ) self.onClose( connection.peer );

				} );

				connection.on( 'error', function ( error ) {

					if ( self.onError !== null ) self.onError( error );

				} );

			} );

		},

		send: function ( data ) {

			for ( var i = 0, il = this.connections.length; i < il; i ++ ) {

				this.connections[ i ].send( data );

			}

		}

	} );

} )();
