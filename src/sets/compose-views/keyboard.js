import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import find   from 'lodash.find';
import uid    from 'lodash.uniqueid';
import {Piano} from '../../libs/synth';


class KeyPress {
  _id     = uid('keypress_');
  created = new Date();

  constructor(instrument, props){
    this.parentInstrument = instrument;
    this.key = props.key;
    this.active   = true;

    // play sound
    this.parentInstrument.playKey(props.key, 1.25);
  }
  
}

export class Keyboard {

  ac             = new AudioContext();
  pressed_keys   = [];
  updateInterval = null;
  piano = new Piano();
  subscribers = {};

  activate(model){}

  detached(){
    setTimeout(this.close.bind(this), 1000);
    clearInterval(this.updateInterval);
  }

  constructor(){    
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
    console.log(`keyTouchstart`);

    this.removeInactive();

    // if a KeyPress with this key already exists then stop
    let existing = find(this.pressed_keys, n => n.key === key);
    
    if(existing){
      // console.log(`duplicate key ${key}`);
      return;
    }

    // create KeyPress
    let KP = new KeyPress(this.piano, {
      ac:  this.ac,
      key: key
    });
    
    this.pressed_keys.push(KP);

    this.fire('keypress');
  }

  keyTouchmove($event, key){
    console.log(`keyTouchmove`);

    let touch = {
      x: $event.targetTouches[0].clientX,
      y: $event.targetTouches[0].clientY
    }
    if($event.target !== document.elementFromPoint(touch.x, touch.y)){
      let existing = find(this.pressed_keys, n => n.key === key);
      if(existing){
        existing.active = false;
      }
    }
  }

  keyTouchend($event, key){
    console.log(`keyTouchend`);
    let existing = find(this.pressed_keys, n => n.key === key);

    if(existing){
      existing.active = false;
    }
    
  }

  deactivateAllKeys(){
    for(let KeyPress of this.pressed_keys){
      KeyPress.active = false;
    }
  }

  getPressedKeys(){
    return this.pressed_keys.filter(pk => pk.active);
  }
  /**
   * Event system for the keyboard
   */
  on(event_name, cb, scope){
    
    if(!this.subscribers[event_name]){
      this.subscribers[event_name] = [];
    }
    this.subscribers[event_name].push({
      cb: cb,
      scope: scope
    });
  }

  off(event_name, cb){
    if(!this.subscribers[event_name]){
      return;
    }
    let i = this.subscribers[event_name].length;
    while(i--){
      if(this.subscribers[event_name].cb === cb){
        this.subscribers[event_name].splice(i, 1);
      }
    }
  }

  fire(event_name){
    if(!this.subscribers[event_name]){
      return;
    }
    let args = Array.prototype.slice.call(arguments, 1);
    for(let subscriber of this.subscribers[event_name]){
      subscriber.cb.apply(subscriber.scope, args);
    }
  }

}