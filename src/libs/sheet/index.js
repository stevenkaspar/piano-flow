import Vex from 'vexflow';
import random from 'lodash.random';

export class Sheet {
  context  = null;
  stave    = null;
  width    = 600;
  height   = 100;
  VF       = Vex.Flow;
  drawn_notes  = [];

  constructor(selector, width, height){
    this.selector = selector;
    if(width){
      this.width = width;      
    }
    if(height){
      this.height = height;
    }
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
      var note = $(this.drawn_notes[i].attrs.el);
      // remove lines that go though C/4
      var prev_rect = note.prev('rect');
      while (prev_rect.length){
        prev_rect.remove();
        prev_rect = note.prev('rect');
      }
      // remove actual note g
      note.remove();
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
    while(num_notes > 0){
      notes.push(this.getRandomNote());
      --num_notes;
    }
    
    var voice = new this.VF.Voice({num_beats: 4,  beat_value: 4});
    voice.addTickables(notes);
    var formatter = new this.VF.Formatter().joinVoices([voice]).format([voice], this.width);
    voice.draw(this.context, this.stave);

    for(var i = 0, l = notes.length; i < l; i++){
      this.drawn_notes.push(notes[i]);
    }
  }
  /**
   * Returns a random quarter note in the x/4 range
   */
  getRandomNote(){
    var _keys = [
      'a/4',
      'b/4',
      'c/4',
      'd/4',
      'e/4',
      'f/4',
      'g/4',
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

    return this.getNote({
      keys:     [key],
      clef:     clef,
      duration: duration
    })
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
   * @return new Vex.Flow.StaveNote(options)
   */
  getNote(options){
    if(!options.keys){
      throw 'No keys passed for note - ["c/4"]';
    }
    if(!options.clef){
      options.clef = 'treble';
    }
    if(!options.duration){
      options.duration = 'q';
    }

    return new this.VF.StaveNote(options);
  }
}