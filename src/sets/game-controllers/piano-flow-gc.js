import {Sheet} from '../../libs/sheet/index';

export class PianoFlowGC {
  in_game         = false;
  in_round        = false;
  paused          = false;
  stepTimeout     = null;
  played_notes    = [];
  correct_notes   = [];
  incorrect_notes = [];
  updateInterval  = null;
  flow_speed      = 120;
  new_note_interval_ms = 2000;
  cur_add_new_note_interval_ms = 0;
  update_interval_ms = 50;

  // below here should be configurable
  // ** placeholder
  // states to track in updateInterval
  // ** placeholder

  constructor(selector){
    this.sheet = new Sheet(selector);
    this.updateInterval = setInterval(this.udpate.bind(this), this.update_interval_ms);
  }
  dispose(){
    if(this.updateInterval){
      clearInterval(this.updateInterval);
    }
    this.sheet.dispose();
  }
  udpate(){

    if(!this.in_game){
      return;
    }
    
    if(this.cur_add_new_note_interval_ms <= 0){
      this.addNote();
      this.cur_add_new_note_interval_ms = this.new_note_interval_ms;
    }
    else {
      this.cur_add_new_note_interval_ms += -this.update_interval_ms;
    }
    
  }

  drawSheet(){
    this.sheet.createSheet();
  }
  startGame(){
    console.log('start');
    this.in_game       = true;
    this.sheet.clearDrawnNotes();
    this.played_notes    = [];
    this.correct_notes   = [];
    this.incorrect_notes = [];
    this.sheet.flowLeft(this.flow_speed);
    this.cur_add_new_note_interval_ms = this.new_note_interval_ms;
  }
  endGame(){
    console.log('end');
    this.in_game = false;
  }
  pauseGame(){
    console.log('pause');
    
    this.paused = true;

    this.sheet.stopFlow();

    if(this.updateInterval){
      clearInterval(this.updateInterval);
    }

  }
  resumeGame(){
    console.log('resume');

    this.paused = false;

    this.sheet.flowLeft(this.flow_speed);

    this.updateInterval = setInterval(this.udpate.bind(this), this.update_interval_ms);

  }
  addNote(){
    var new_notes = this.sheet.addNotes(1);
    for(let new_note of new_notes){
      new_note.setOffsetX(500);
    }
  }
  playKey(key){

    if(this.paused){
      return;
    }
    var StaveNote = this.getNextStaveNote();
    this.played_notes.push(key);

    if(this.isCorrectKey(key, StaveNote)){
      this.correct_notes.push(key);
      $(StaveNote.attrs.el).removeClass('note-red');
      $(StaveNote.attrs.el).addClass('note-green');
    }
    else {
      this.incorrect_notes.push(key);
      $(StaveNote.attrs.el).removeClass('note-green');
      $(StaveNote.attrs.el).addClass('note-red');
    }

    // check if end of game
  }

  getNextStaveNote(){
    var index = this.played_notes.length;
    return this.sheet.getDrawnNotes()[index].StaveNote;
  }

  isCorrectKey(key, StaveNote){
    return StaveNote.getKeys().indexOf(key) > -1;
  }
  
}