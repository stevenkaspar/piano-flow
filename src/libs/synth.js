/**
 * 2014 original credit to Keith Whor 
 *   - https://github.com/keithwhor/audiosynth
 *   - http://www.keithwhor.com/music/
 * 2017 modified by Steven Kaspar to class ES6 structure
 *   - added Piano alias class
 */

class SynthInstrument {
  constructor(_parent, name, _soundID){
    this._parent  = _parent;
    this.name     = name;
    this._soundID = _soundID;
  }
  /**
   * Middleman to play(...) that allows for key passing
   * @param {string} key - format 'c/4' | 'c#/4' 
   * @param {integer} duration
   */
  playKey(key, duration){
    
  	let split  = key.split('/');
    let note   = split[0];
    let octave = parseInt(split[1]);
    
    this.play(note, octave, duration);

  }

  play(note, octave, duration){
    return this._parent.play(this._soundID, note, octave, duration);
  }

  generate(note, octave, duration){
    return this._parent.generate(this._soundID, note, octave, duration);
  }
}

export class Synth {
  /**
   * Define more instruments in the profiles array
   */
  profiles = [{
    name: 'piano',
    attack: () => {
      return 0.002;
    },
    dampen: (sampleRate, frequency, volume) => {
      return Math.pow(0.5 * Math.log((frequency * volume) / sampleRate), 2);
    },
    wave: (i, sampleRate, frequency, volume) => {
      var base = this._mod[0];
      return this._mod[1](
        i,
        sampleRate,
        frequency,
        Math.pow(base(i, sampleRate, frequency, 0), 2) +
        (0.75 * base(i, sampleRate, frequency, 0.25)) +
        (0.1 * base(i, sampleRate, frequency, 0.5))
      );
    }
  },
  {
    name: 'organ',
    attack: function() { return 0.3 },
    dampen: function(sampleRate, frequency) { return 1+(frequency * 0.01); },
    wave: function(i, sampleRate, frequency) {
      var base = this._mod[0];
      return this._mod[1](
        i,
        sampleRate,
        frequency,
        base(i, sampleRate, frequency, 0) +
          0.5*base(i, sampleRate, frequency, 0.25) +
          0.25*base(i, sampleRate, frequency, 0.5)
      );
    }
  },
  {
    name: 'acoustic',
    attack:	function() { return 0.002; },
    dampen: function() { return 1; },
    wave: function(i, sampleRate, frequency) {

      var vars = this.vars;
      vars.valueTable = !vars.valueTable?[]:vars.valueTable;
      if(typeof(vars.playVal)=='undefined') { vars.playVal = 0; }
      if(typeof(vars.periodCount)=='undefined') { vars.periodCount = 0; }
    
      var valueTable = vars.valueTable;
      var playVal = vars.playVal;
      var periodCount = vars.periodCount;

      var period = sampleRate/frequency;
      var p_hundredth = Math.floor((period-Math.floor(period))*100);

      var resetPlay = false;

      if(valueTable.length<=Math.ceil(period)) {
    
        valueTable.push(Math.round(Math.random())*2-1);
    
        return valueTable[valueTable.length-1];
    
      } else {
    
        valueTable[playVal] = (valueTable[playVal>=(valueTable.length-1)?0:playVal+1] + valueTable[playVal]) * 0.5;
    
        if(playVal>=Math.floor(period)) {
          if(playVal<Math.ceil(period)) {
            if((periodCount%100)>=p_hundredth) {
              // Reset
              resetPlay = true;
              valueTable[playVal+1] = (valueTable[0] + valueTable[playVal+1]) * 0.5;
              vars.periodCount++;	
            }
          } else {
            resetPlay = true;	
          }
        }
    
        var _return = valueTable[playVal];
        if(resetPlay) { vars.playVal = 0; } else { vars.playVal++; }
    
        return _return;
    
      }
    }
  },
  {
    name: 'edm',
    attack:	function() { return 0.002; },
    dampen: function() { return 1; },
    wave: function(i, sampleRate, frequency) {
      var base = this._mod[0];
      var mod = this._mod.slice(1);
      return mod[0](
        i,
        sampleRate,
        frequency,
        mod[9](
          i,
          sampleRate,
          frequency,
          mod[2](
            i,
            sampleRate,
            frequency,
            Math.pow(base(i, sampleRate, frequency, 0), 3) +
              Math.pow(base(i, sampleRate, frequency, 0.5), 5) +
              Math.pow(base(i, sampleRate, frequency, 1), 7)
          )
        ) +
          mod[8](
            i,
            sampleRate,
            frequency,
            base(i, sampleRate, frequency, 1.75)
          )
      );
    }
  }];

  URL                = window.URL || window.webkitURL;
  Blob               = window.Blob;
  _encapsulated      = false;
  _bitsPerSample     = 16;
  _channels          = 1;
  _sampleRate        = 44100;
  _volume            = 32768;
  _notes = {
    'c': 261.63,
    'c#': 277.18,
    'd': 293.66,
    'd#': 311.13,
    'e': 329.63,
    'f': 346.23,
    'f#': 369.99,
    'g': 392.00,
    'g#': 415.30,
    'a': 440.00,
    'a#': 466.16,
    'b': 493.88
  }
  _fileCache = [];
  _temp      = {};
  _sounds    = [];
  _mod = [(i, s, f, x) => {
    return Math.sin((2 * Math.PI) * (i / s) * f + x);
  }];

  constructor(){
    if (!this.URL || !this.Blob) {
      throw new Error('This device does not support Piano Flow');
    }
    this.loadProfiles();
    this.loadModulationFunction();
  }

  pack(c, arg){
    return [new Uint8Array([arg, arg >> 8]), new Uint8Array([arg, arg >> 8, arg >> 16, arg >> 24])][c];
  }
  
  setSampleRate(v){
    this._sampleRate = Math.max(Math.min(v | 0, 44100), 4000);
    this._clearCache();
    return this._sampleRate;
  }

  getSampleRate(){
    return this._sampleRate;
  }

    
  setVolume(v){
    v = parseFloat(v);
    if (isNaN(v)) {
        v = 0;
    }
    v = Math.round(v * 32768);
    this._volume = Math.max(Math.min(v | 0, 32768), 0);
    this._clearCache();
    return this._volume;
  }
  getVolume(){
    return Math.round(this._volume / 32768 * 10000) / 10000;
  }
  _resizeCache(){
    var f = this._fileCache;
    var l = this._sounds.length;
    while (f.length < l) {
      var octaveList = [];
      for (var i = 0; i < 8; i++) {
        var noteList = {};
        for (var k in this._notes) {
          noteList[k] = {};
        }
        octaveList.push(noteList);
      }
      f.push(octaveList);
    }
  }
  _clearCache(){
    this._fileCache = [];
    this._resizeCache();
  }
  generate(sound, note, octave, duration){
    var thisSound = this._sounds[sound];
    if (!thisSound) {
      for (var i = 0; i < this._sounds.length; i++) {
        if (this._sounds[i].name == sound) {
          thisSound = this._sounds[i];
          sound = i;
          break;
        }
      }
    }
    if (!thisSound) {
      throw new Error('Invalid sound or sound ID: ' + sound);
    }
    var t = (new Date).valueOf();
    this._temp = {};
    octave |= 0;
    octave = Math.min(8, Math.max(1, octave));
    var time = !duration ? 2 : parseFloat(duration);
    if (typeof(this._notes[note]) == 'undefined') {
      throw new Error(note + ' is not a valid note.');
    }
    if (typeof(this._fileCache[sound][octave - 1][note][time]) != 'undefined') {
      if (this._debug) {
        console.log((new Date).valueOf() - t, 'ms to retrieve (cached)');
      }
      return this._fileCache[sound][octave - 1][note][time];
    } 
    else {
      var frequency = this._notes[note] * Math.pow(2, octave - 4);
      var sampleRate = this._sampleRate;
      var volume = this._volume;
      var channels = this._channels;
      var bitsPerSample = this._bitsPerSample;
      var attack = thisSound.attack(sampleRate, frequency, volume);
      var dampen = thisSound.dampen(sampleRate, frequency, volume);
      var waveFunc = thisSound.wave;
      var waveBind = {
        modulate: this._mod,
        vars: this._temp
      };
      var val = 0;
      var curVol = 0;

      var data = new Uint8Array(new ArrayBuffer(Math.ceil(sampleRate * time * 2)));
      var attackLen = (sampleRate * attack) | 0;
      var decayLen = (sampleRate * time) | 0;

      for (var i = 0 | 0; i !== attackLen; i++) {

        val = volume * (i / (sampleRate * attack)) * waveFunc.call(waveBind, i, sampleRate, frequency, volume);

        data[i << 1] = val;
        data[(i << 1) + 1] = val >> 8;

      }

      for (; i !== decayLen; i++) {

        val = volume * Math.pow((1 - ((i - (sampleRate * attack)) / (sampleRate * (time - attack)))), dampen) * waveFunc.call(waveBind, i, sampleRate, frequency, volume);

        data[i << 1] = val;
        data[(i << 1) + 1] = val >> 8;

      }

      var out = [
        'RIFF',
        this.pack(1, 4 + (8 + 24 /* chunk 1 length */ ) + (8 + 8 /* chunk 2 length */ )), // Length
        'WAVE',
        // chunk 1
        'fmt ', // Sub-chunk identifier
        this.pack(1, 16), // Chunk length
        this.pack(0, 1), // Audio format (1 is linear quantization)
        this.pack(0, channels),
        this.pack(1, sampleRate),
        this.pack(1, sampleRate * channels * bitsPerSample / 8), // Byte rate
        this.pack(0, channels * bitsPerSample / 8),
        this.pack(0, bitsPerSample),
        // chunk 2
        'data', // Sub-chunk identifier
        this.pack(1, data.length * channels * bitsPerSample / 8), // Chunk length
        data
      ];
      var blob = new Blob(out, {
        type: 'audio/wav'
      });
      var dataURI = URL.createObjectURL(blob);
      this._fileCache[sound][octave - 1][note][time] = dataURI;
      if (this._debug) {
        console.log((new Date).valueOf() - t, 'ms to generate');
      }
      return dataURI;
    }
  }
  play(sound, note, octave, duration){
    var src = this.generate(sound, note, octave, duration);
    var audio = new Audio(src);
    audio.play();
    return true;
  }

  createInstrument(sound){
    var n = 0;
    var found = false;
    if (typeof(sound) == 'string') {
      for (var i = 0; i < this._sounds.length; i++) {
        if (this._sounds[i].name == sound) {
          found = true;
          n = i;
          break;
        }
      }
    } 
    else {
      if (this._sounds[sound]) {
        n = sound;
        sound = this._sounds[n].name;
        found = true;
      }
    }
    if (!found) {
      throw new Error('Invalid sound or sound ID: ' + sound);
    }

    var ins = new SynthInstrument(this, sound, n);

    return ins;
  }
  listSounds(){
    var r = [];
    for (var i = 0; i < this._sounds.length; i++) {
      r.push(this._sounds[i].name);
    }
    return r;
  }
  loadProfiles(){
    
    for (var i = 0, len = this.profiles.length; i < len; i++) {
      var o = this.profiles[i];
      if (!(o instanceof Object)) {
        throw new Error('Invalid sound profile.');
      }
      this._sounds.push(o);
    }

    this._resizeCache();

    return true;
  }
  loadModulationFunction(){
    let funcs = [
      (i, sampleRate, frequency, x) => 1 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 1 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 1 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 1 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 1 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 0.5 * Math.sin(2 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 0.5 * Math.sin(4 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 0.5 * Math.sin(8 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 0.5 * Math.sin(0.5 * Math.PI * ((i / sampleRate) * frequency) + x),
      (i, sampleRate, frequency, x) => 0.5 * Math.sin(0.25 * Math.PI * ((i / sampleRate) * frequency) + x)
    ];
    for (var i = 0, len = funcs.length; i < len; i++) {
      let f = funcs[i];
      if (typeof(f) != 'function') {
          throw new Error('Invalid modulation function.');
      }
      this._mod.push(f);
    }
    return true;
  }
}

export class Piano {

	constructor(synth){
  	if(typeof synth === 'undefined'){
    	synth = new Synth();
    }
    
  	this._parentSynth = synth;
    
    this.instrument = this._parentSynth.createInstrument('piano');
    
    return this.instrument;
  }
  
}


