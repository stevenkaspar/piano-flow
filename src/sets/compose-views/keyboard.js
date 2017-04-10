import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import find   from 'lodash.find';
import uid    from 'lodash.uniqueid';

class Sound {
  key  = '';
  final_source = null;
  source_nodes = [];

  constructor(context, key){
    this.context = context;
    this.key     = key;

    // create this.sine_node
    this.createSineWave();
    // create this.filter_node
    this.createFilter();
    // create this.gain_node
    this.createGain(this.filter_node);

    this.final_source = this.gain_node;

    var self = this;
    this.source_nodes.map(function(node){
      node.start(0);
    })
  }
  createSineWave(){
    this.sine_node = this.context.createOscillator();
    this.sine_node.type = 'sine';
    this.sine_node.frequency.value = key_frequencies[this.key];
    this.source_nodes.push(this.sine_node);
  }
  createFilter(){
    this.filter_node                 = this.context.createBiquadFilter();
    this.filter_node.type            = "lowpass";
    this.filter_node.frequency.value = 200;
    var self = this;
    this.source_nodes.map(function(node){
      node.connect( self.filter_node);
    })
  }

  createGain(connector){
    this.gain_node = this.context.createGain();
    this.gain_node.gain.value = 1;
    connector.connect(this.gain_node);
  }

  play(intensity){
    if(typeof intensity === 'undefined'){
      intensity = 100;
    }
    this.gain_node.connect(this.context.destination);

    setTimeout(this.stop.bind(this), intensity);

  }
  stop(){
    this.gain_node.gain.exponentialRampToValueAtTime(
      0.00001, this.context.currentTime + 1
    )
    setTimeout(this.disconnect.bind(this), 1000);
  }
  disconnect(){
    this.gain_node.disconnect();
  }
}

class KeyPress {
  _id     = uid('keypress_');
  created = new Date();
  active_time = 200;

  constructor(props){
    this.key = props.key;
    /**touch identifier */
    this.tid      = props.tid;
    this.active   = true;

    // play sound
    let sound = new Sound(props.ac, props.key);
    sound.play();

    // set timeout to go active = false
    setTimeout(this.deactivate.bind(this), this.active_time);
  }

  deactivate(){
    this.active = false;
  }
  
}

@inject(EventAggregator)
export class Keyboard {

  ac             = new AudioContext();
  pressed_keys   = [];
  updateInterval = null;

  activate(model){}

  detached(){
    setTimeout(this.close.bind(this), 1000);
    clearInterval(this.updateInterval);
  }

  constructor(ea){
    this.ea = ea;
    
    this.updateInterval = setInterval(this.update.bind(this), 50);
  }
  
  close(){
    this.ac.close();
  }

  update(){
    this.removeInactive();
  }

  removeInactive(){
    var i = this.pressed_keys.length;
    // remove inactive KeyPresses
    while(i--){
      let KeyPress = this.pressed_keys[i]; 
      if(!KeyPress.active){
        this.pressed_keys.splice(i, 1);
      }
    }
  }

  keyTouchstart($event, key){
    // console.log($event, key);

    this.removeInactive();

    // if a KeyPress with this key already exists then stop
    let existing = find(this.pressed_keys, n => n.key === key);
    
    if(existing){
      // console.log(`duplicate key ${key}`);
      return;
    }

    // create KeyPress
    let KP = new KeyPress({
      tid: $event.targetTouches[0].identifier,
      ac:  this.ac,
      key: key
    });
    
    this.pressed_keys.push(KP);

    this.playKey(KP.key);
  }

  playKey(key){

    // console.log(`playKey ${key}`);

    this.ea.publish('play-key', [
      key
    ]);

  }

}


var key_frequencies = {
  "c/0": 16.35,
  "c#/0": 17.32,
  "db/0": 17.32,
  "d/0": 18.35,
  "d#/0": 19.45,
  "eb/0": 19.45,
  "e/0": 20.6,
  "f/0": 21.83,
  "f#/0": 23.12,
  "gb/0": 23.12,
  "g/0": 24.5,
  "g#/0": 25.96,
  "ab/0": 25.96,
  "a/0": 27.5,
  "a#/0": 29.14,
  "bb/0": 29.14,
  "b/0": 30.87,
  "c/1": 32.7,
  "c#/1": 34.65,
  "db/1": 34.65,
  "d/1": 36.71,
  "d#/1": 38.89,
  "eb/1": 38.89,
  "e/1": 41.2,
  "f/1": 43.65,
  "f#/1": 46.25,
  "gb/1": 46.25,
  "g/1": 49,
  "g#/1": 51.91,
  "ab/1": 51.91,
  "a/1": 55,
  "a#/1": 58.27,
  "bb/1": 58.27,
  "b/1": 61.74,
  "c/2": 65.41,
  "c#/2": 69.3,
  "db/2": 69.3,
  "d/2": 73.42,
  "d#/2": 77.78,
  "eb/2": 77.78,
  "e/2": 82.41,
  "f/2": 87.31,
  "f#/2": 92.5,
  "gb/2": 92.5,
  "g/2": 98,
  "g#/2": 103.83,
  "ab/2": 103.83,
  "a/2": 110,
  "a#/2": 116.54,
  "bb/2": 116.54,
  "b/2": 123.47,
  "c/3": 130.81,
  "c#/3": 138.59,
  "db/3": 138.59,
  "d/3": 146.83,
  "d#/3": 155.56,
  "eb/3": 155.56,
  "e/3": 164.81,
  "f/3": 174.61,
  "f#/3": 185,
  "gb/3": 185,
  "g/3": 196,
  "g#/3": 207.65,
  "ab/3": 207.65,
  "a/3": 220,
  "a#/3": 233.08,
  "bb/3": 233.08,
  "b/3": 246.94,
  "c/4": 261.63,
  "c#/4": 277.18,
  "db/4": 277.18,
  "d/4": 293.66,
  "d#/4": 311.13,
  "eb/4": 311.13,
  "e/4": 329.63,
  "f/4": 349.23,
  "f#/4": 369.99,
  "gb/4": 369.99,
  "g/4": 392,
  "g#/4": 415.3,
  "ab/4": 415.3,
  "a/4": 440,
  "a#/4": 466.16,
  "bb/4": 466.16,
  "b/4": 493.88,
  "c/5": 523.25,
  "c#/5": 554.37,
  "db/5": 554.37,
  "d/5": 587.33,
  "d#/5": 622.25,
  "eb/5": 622.25,
  "e/5": 659.26,
  "f/5": 698.46,
  "f#/5": 739.99,
  "gb/5": 739.99,
  "g/5": 783.99,
  "g#/5": 830.61,
  "ab/5": 830.61,
  "a/5": 880,
  "a#/5": 932.33,
  "bb/5": 932.33,
  "b/5": 987.77,
  "c/6": 1046.5,
  "c#/6": 1108.73,
  "db/6": 1108.73,
  "d/6": 1174.66,
  "d#/6": 1244.51,
  "eb/6": 1244.51,
  "e/6": 1318.51,
  "f/6": 1396.91,
  "f#/6": 1479.98,
  "gb/6": 1479.98,
  "g/6": 1567.98,
  "g#/6": 1661.22,
  "ab/6": 1661.22,
  "a/6": 1760,
  "a#/6": 1864.66,
  "bb/6": 1864.66,
  "b/6": 1975.53,
  "c/7": 2093,
  "c#/7": 2217.46,
  "db/7": 2217.46,
  "d/7": 2349.32,
  "d#/7": 2489.02,
  "eb/7": 2489.02,
  "e/7": 2637.02,
  "f/7": 2793.83,
  "f#/7": 2959.96,
  "gb/7": 2959.96,
  "g/7": 3135.96,
  "g#/7": 3322.44,
  "ab/7": 3322.44,
  "a/7": 3520,
  "a#/7": 3729.31,
  "bb/7": 3729.31,
  "b/7": 3951.07,
  "c/8": 4186.01
};