import Vex from 'vexflow';
import random from 'lodash.random';

class Note {
  
  VF        = Vex.Flow;
  StaveNote = null;
  removed = false;
  
  constructor(options){

    this.setOptions(options);
    
    this.initializeWithOptions();

    return this;
  }
  /**
   * Utility for building a note
   * 
   * `Options` is something like
   * 
   * ```
   * {
   *   keys:     ["c/4"], // [required]
   *   clef:     "treble",
   *   duration: "q"
   * }
   * ```
   * 
   * @param {object} options
   * @param {array}  options.keys - ["c/4"]
   * @param {string} options.duration - "q"
   * @param {string} options.clef - "treble"
   * */
  setOptions(options){
    if(!options.keys){
      throw 'No keys passed for note - ["c/4"]';
    }
    if(!options.clef){
      options.clef = 'treble';
    }
    if(!options.duration){
      options.duration = 'q';
    }

    this.options = options;

    return this;
  }
  initializeWithOptions(){

    this.StaveNote = new this.VF.StaveNote(this.options);

    return this;
  }
  /**
   * removes the SVG elements
   */
  remove(){
    if(this.removed){
      return this;
    }
    var note = $(this.StaveNote.attrs.el);
    var bar = this.getBar();
    // remove line that go though the stave
    bar.remove();
    note.remove();
    console.log('remove');
    this.removed = true;
    return this;
  }

  updateLocationInFlow(){

    this.moveXPixels(-1);
    
    if(this.isXOrLessFromLeft()){
      this.remove();
    }

  }

  /**
   * moves the note right from its CURRENT position by x pixels
   * (adjusts the trasform: translate(x) value by x)
   */
  moveXPixels(x){
    if(this.removed){
      return this;
    }
    $.each(this.getElem(true),(index, node) => {
      var x_y = this.getTransformXY(node);
      x_y.x += x;
      node.setAttribute('transform', `translate(${x_y.x},${x_y.y})`);
    })

    return this;
  }

  /**
   * moves the note right from its ORIGINAL position by x pixels
   * (sets the trasform: translate(x) value to x)
   */
  setOffsetX(x){
    if(this.removed){
      return this;
    }
    $.each(this.getElem(true),(index, node) => {
      var x_y = this.getTransformXY(node);
      x_y.x = x;
      node.setAttribute('transform', `translate(${x_y.x},${x_y.y})`);
    })

    return this;
  }

  
  // functions that don't return this
  /**
   * returns the <svg> 
   */
  getSvg(){
    return $(this.StaveNote.attrs.el).closest('svg');
  }
  /**
   * Gets the StaveNote.attrs.el as a jQuery object
   * @param {boolean} include_bar - whether to include the <rect> bar with it
   */
  getElem(include_bar){
    var return_jquery = $(this.StaveNote.attrs.el);

    if(include_bar){
      var bar = this.getBar();
      if(bar.length){
        return_jquery = return_jquery.add(bar);
      }
    }

    return return_jquery;
  }
  /**
   * returns the <rect> before the StaveNote.attrs.el
   * if it exists
   */
  getBar(){
    return $(this.StaveNote.attrs.el).prev('rect');
  }
  /**
   * Checks if the StaveNote.attrs.el is x or less pixels from the
   * edge of the SVG - this requires that the viewbox be the same as the
   * actually width of the svg 
   * @param {integer} x - number of pixels to test against 
   */
  isXOrLessFromLeft(x){
    if(isNaN(x)){
      x = 0;
    }
    let node = this.getElem();
    let svg = this.getSvg();
    let pixels_from_left = node.offset().left - svg.offset().left;
    if(pixels_from_left < x){
      return true;
    }
    return false;
  }
  /**
   * gets the {x, y} of transform=translate(x,y)
   * @param {HTMLElement} html_element 
   */
  getTransformXY(html_element){
    var xforms = html_element.getAttribute('transform');
    if(xforms === null){
      return {x: 0, y: 0};
    }
    var parts  = /translate\(\s*([^\s,)]+)[ ,]([^\s,)]+)/.exec(xforms);
    return {
      x: parseInt(parts[1]),
      y: parseInt(parts[2])
    }
  }

}

export class Sheet {
  context  = null;
  stave    = null;
  width    = 600;
  height   = 100;
  VF       = Vex.Flow;
  drawn_notes  = [];
  flowInterval = null;

  constructor(selector, width, height){
    this.selector = selector;
    if(width){
      this.width = width;      
    }
    if(height){
      this.height = height;
    }
  }

  dispose(){
    this.clearFlowInterval();
  }

  createSheet(){
    var sheet_elem = $('#'+this.selector);
    
    var renderer = new this.VF.Renderer(sheet_elem[0], this.VF.Renderer.Backends.SVG);

    // Configure the rendering context.
    renderer.resize(this.width, this.height);
    this.context = renderer.getContext();
    this.context.setFont("Arial", 10, "").setBackgroundFillStyle("#eed");

    // Create a stave of width this.width at position 0, 0 on the canvas.
    this.stave = new this.VF.Stave(0, 0, this.width);

    // Add a clef and time signature.
    this.stave.addClef("treble").addTimeSignature("4/4");

    // Connect it to the rendering context and draw!
    this.stave.setContext(this.context).draw();

    sheet_elem.find('svg')[0].setAttribute('width', '100%');
    sheet_elem.find('svg')[0].setAttribute('viewBox', '0 0 ' + this.width + ' ' + this.height);
  }

  getDrawnNotes(){
    return this.drawn_notes;
  }

  /**
   * removes all StaveNotes that are in this.drawn_notes
   */
  clearDrawnNotes(){
    for(var i = 0, l = this.drawn_notes.length; i < l; i++){
      this.drawn_notes[i].remove();
    }
    this.drawn_notes = [];
  }

  /**
   * Adds num_notes random StaveNotes
   */
  addNotes(num_notes){
    if(isNaN(num_notes)){
      num_notes = 4;
    }
    var notes = [];
    while(num_notes > notes.length){
      notes.push(this.getRandomNote());
    }
    
    var voice = new this.VF.Voice({num_beats: num_notes,  beat_value: 4});
    voice.addTickables(notes.map(note => note.StaveNote));

    var formatter = new this.VF.Formatter().joinVoices([voice]).format([voice], this.width);
    voice.draw(this.context, this.stave);

    for(var i = 0, l = notes.length; i < l; i++){
      this.drawn_notes.push(notes[i]);
    }
    return notes;
  }

  setOffsetX(x){
    for(let note of this.drawn_notes){
      note.setOffsetX(x);
    }
  }

  flowLeft(speed){
    this.speed = speed;

    this.clearFlowInterval();

    this.flowInterval = setInterval(this.updateLocationsInFlow.bind(this), 5000 / this.speed);
  }

  clearFlowInterval(){
    if(this.flowInterval){
      clearInterval(this.flowInterval);
    }
  }
  updateLocationsInFlow(){
    
    for(let note of this.drawn_notes){
      if(note.removed){
        continue;
      }

      note.moveXPixels(-1);
    
      if(note.isXOrLessFromLeft()){
        note.remove();
      }
    }

  }

  stopFlow(){
    this.clearFlowInterval();
  }

  /**
   * Returns a random quarter note in the x/4 range
   */
  getRandomNote(){
    var _keys = [
      'c/4',
      // 'c#/4',
      'd/4',
      // 'd#/4',
      'e/4',
      'f/4',
      // 'f#/4',
      'g/4',
      // 'g#/4',
      'a/4',
      // 'a#/4',
      'b/4',
    ];
    var _durations = [
      'q'
    ];
    var _clefs = [
      'treble'
    ]
    
    var key      = _keys[     random(0, _keys.length      - 1)];
    var duration = _durations[random(0, _durations.length - 1)];
    var clef   = _clefs[      random(0, _clefs.length     - 1)];

    return new Note({
      keys:     [key],
      clef:     clef,
      duration: duration
    })
  }
}