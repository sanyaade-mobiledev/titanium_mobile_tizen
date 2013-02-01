define(["Ti/_/declare", "Ti/_/dom", "Ti/_/event", "Ti/_/lang", "Ti/Media", "Ti/_/Evented"],
	function(declare, dom, event, lang, Media, Evented) {
	
	// Ti.Media.Sound is based on tag <audio> of HTML5.
	// Ti.Media.Sound wraps the interface of the <audio> tag, adds basic
	// state management, error checking, and provides interface common for
	// Titanium namespaces.
	
	var doc = document,
		on = require.on,
		mimeTypes = {
			"mp3": "audio/mpeg",
			"ogg": "audio/ogg",
			"wav": "audio/wav"
		},
		INITIALIZED = 1,
		PAUSED = 2,
		PLAYING = 3,
		STARTING = 4,
		STOPPED = 5,
		STOPPING = 6,
		ENDED = 9,
		ABORT = 10,
		ERROR = 11;
	
	return declare("Ti.Media.Sound", Evented, {
		_currentState: STOPPED,
		
		// The following 3 variables mirror (cache) the according properties of the <audio> tag.
		// Reason: if the <audio> tag is not initialized, direct referencing of the tag's properties
		// leads to exception. To prevent this situation, we mirror the properties and use them
		// if the tag's properties cannot be accessed at the moment.
		_volume: 1.0,
		_looping: false,
		_time: 0,
		
		// This variable records the command that was requested before the <audio> tag was initialized.
		// It will be executed when the tag becomes initialized.
		_nextCmd: undefined,
		
		_initialized: false,
		
		constructor: function() {
			this._handles = [];
		},
		
		properties: {
		
			url: {
				set: function(value) {
					if (!value || value === this.properties.__values__.url) {
						return;
					}
					
					this.constants.__values__.playing = false;
					this.constants.__values__.paused  = false;
					this._currentState = STOPPED;
					this.properties.__values__.url = value;
					this._createAudio(true/*Release*/);
					this.time = 0;
					return value;
				}
			},

			// See comment for "_volume".
			volume: {
				get: function() {
					return this._volume;
				},
				set: function(value) {
					if (value > 1.0 ) {
						value = 1.0;
					} else if (value < 0) {
						value = 0;
					}
					
					this._volume = value;
					this._initialized && this._audio && (this._audio.volume = value);
					return value;
				}
			},

			// See comment for "_time".
			time: {
				get: function() {
					return this._initialized && this._audio ? Math.floor(this._audio.currentTime * 1000) : this._time;
				},
				set: function(value) {
					this._time = value;
					this._initialized && this._audio && (this._audio.currentTime = this._time/1000);
					return this._time;
				}
			},
			
			// See comment for "_looping".
			looping: {
				get: function() {
					return this._looping; 
				},
				set: function(value) {
					this._looping = value;
					this._initialized && this._audio && (this._audio.loop = value);
					return value;
				}
			}
		},
		
		//read-only properties
		constants: {
			paused: false,
			playing: false,
			duration: 0
		},
		
		//used for delayed command when playback has not initialised yet
		// see comment for "_nextCmd"
		_command: function(cmd) {
			if(!this._initialized) {
				this._nextCmd = cmd
				return true;
			}
			return false;
		},
		
		// Update the state information;
		// fire external events according to changes of the internal state.
		_changeState: function(newState, msg) {
			this._currentState = newState;
			this.constants.__values__.playing 	= PLAYING === newState;
			this.constants.__values__.paused 	= PAUSED === newState;
			var evt = {};
			evt['src'] = this;
			switch (this._currentState) {
				case ENDED:
					evt['type'] = 'complete';
					evt['success'] = true;
					if (!this.properties.__values__.looping) {
						this.fireEvent('complete', evt);  // external (interface) event
					}
					break;
				case ERROR: 
					evt['type'] = 'error';	
					evt['message'] = msg;
					this.fireEvent('error', evt);  // external (interface) event
					break;
			}
		},
		
		_durationChange: function() {
			var d = this._audio.duration*1000;
			if (d !== Infinity) {
				this.constants.__values__.duration = Math.floor(d);
			}
		},
		
		_error: function() {
			var msg = "Unknown error";
			switch (this._audio.error.code) {
				case 1: msg = "Aborted"; break;
				case 2: msg = "Decode error"; break;
				case 3: msg = "Network error"; break;
				case 4: msg = "Unsupported format";break;
			}
			this._changeState(ERROR, "error: " + msg);
		},
		
		// isRelease: if true, the <audio> tag will be destroyed and recreated.
		// if false, and the tag has been already created, nothing will happen.
		_createAudio: function(isRelease) {
			var audio = this._audio,
				url = this.url,
				i, attr, match;
			
			if (!url) {
				return;
			}
			
			if (audio && audio.parentNode && !isRelease) {
				return audio;
			}
			
			this.release();
			
			audio = this._audio = dom.create("audio");
			
			// Handlers of events generated by the <audio> tag. 
			// These events are handled here and do not propagate outside.
			this._handles = [
				on(audio, "playing", this, function() {
					this._changeState(PLAYING, "playing");
				}),
				on(audio, "play", this, function() {
					this._changeState(STARTING, "starting");
				}),
				on(audio, "pause", this, function() {
					if (this._currentState === STOPPING) {
						this._stop();
					} else {
						this._changeState(PAUSED, "paused");	
					}
				}),
				on(audio, "ended", this, function() {
					this._changeState(ENDED, "ended");
				}),
				on(audio, "abort", this, function() {
					this._changeState(ABORT, "abort");
				}),
				on(audio, "timeupdate", this, function() {
					this._time = this._audio.currentTime;
					this._currentState === STOPPING && this.pause();
				}),
				on(audio, "error", this, "_error"),
				on(audio, "canplay", this, function() {
					this._initialized = true;
					
					//Audio has just initilised
					this.volume = this._volume;
					this.looping = this._looping;
					this.time = this._time;
										
					this._changeState(INITIALIZED, "initialized");
					
					this._nextCmd && this._nextCmd();
					this._nextCmd = null;
				}),				
				on(audio, "durationchange", this, "_durationChange")
			];
			
			doc.body.appendChild(audio);
			
			//Set "url" into tag <source> of tag <audio>
			require.is(url, "Array") || (url = [url]);
			
			for (i = 0; i < url.length; i++) {
				attr = {src: url[i]};
				match = url[i].match(/.+\.([^\/\.]+?)$/);
				match && mimeTypes[match[1]] && (attr.type = mimeTypes[match[1]]);
				dom.create("source", attr, audio);
			}

			return audio;
		},
		
		// Remove the <audio> tag from the DOM tree
		release: function() {
			var audio = this._audio,
				parent = audio && audio.parentNode;
			this._currentState = STOPPED;
			this.constants.playing = false;
			this.constants.paused = false;
			this._initialized = false;
			if (parent) {
				event.off(this._handles);
				parent.removeChild(audio);
			}
			this._audio = null;
		},
		
		// All methods can be called before initialization <audio> tag
		// It can be reason of crush tag <audio>.  
		// In order to avoid it we add "delayed" functionality
		pause: function() {
			var audio;
			!this._command(this.pause) && this._currentState === PLAYING && (audio = this._createAudio()) && audio.pause();
		},
		
		start: function() {
			var audio;
			!this._command(this.start) && this._currentState !== PLAYING && (audio = this._createAudio()) && audio.play();
		},
		
		play: function() {
			this.start();
		},
		
		_stop: function() {
			var a = this._audio;
			a.currentTime = 0;
			this._changeState(STOPPED, "stopped");

			// Some versions of Webkit has a bug: if <audio>'s current time is non-zero and we try to 
			// stop it by setting time to 0 and pausing, it won't work: music is paused, but time is 
			// not reset. This is a work around.
			if (a.currentTime !== 0) {
				a.load();
				this.volume = this._volume;
				this.looping = this._looping;
			}
		},
		
		stop: function() {
			if (this._command(null)) {
				return;
			}
				
			var a = this._audio;
			if (!a)
				return;
				
			if (this._currentState === PAUSED) {
				this._stop();
			} else {
				this._changeState(STOPPING, "stopping");
				a.pause();
			}
		},
		
		reset: function() {
			this.time = 0;
		},
		
		isLooping: function() {
				return this._looping;
		},
		
		isPaused: function() {
				return this.constants.__values__.paused; 
		},
		
		isPlaying: function() {
				return this.constants.__values__.playing;
		}
		
	});

});
