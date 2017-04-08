import {Sheet} from '../../libs/sheet/index';
import find    from 'lodash.find';

export class PianoFlowGC {
  in_game         = false;
  in_round        = false;
  paused          = false;
  stepTimeout     = null;
  /** Note[] */
  played_notes    = [];
  /** Note[] */ 
  correct_notes   = [];
  /** Note[] */  
  incorrect_notes = [];
  updateInterval  = null;
  flow_speed           = 120;
  cur_add_new_note_interval_ms = 0;
  update_interval_ms = 50;
  lowest_level_time = 4000;
  total_count_of_last_level_change = 0;
  // below here should be configurable
  level = 3;
  // states to track in updateInterval
  new_note_interval_ms = this.lowest_level_time / this.level;

  constructor(selector){
    this.sheet = new Sheet({
      selector:     selector,
      remove_point: 100,
      noteRemoved:  this.noteRemovedBySheet.bind(this)
    });
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
      this.calculateLevel();
      this.cur_add_new_note_interval_ms = this.new_note_interval_ms;
    }
    else {
      this.cur_add_new_note_interval_ms += -this.update_interval_ms;
    }
    
  }
  getNewNoteIntervalMs(){
    return this.lowest_level_time / this.level;
  }

  calculateLevel(){
    let correct_count   = this.correct_notes.length;
    let incorrect_count = this.incorrect_notes.length;
    let total_count     = correct_count + incorrect_count;
    let total_shown      = this.sheet.getDrawnNotes();

    let percentage_incorrect = incorrect_count / total_count;

    if(total_count < 10){
      return;
    }

    var new_level = this.level;

    if(total_count === 0){
      return;
    }
    else if(percentage_incorrect > .02){
      --new_level;
    }
    else if((1 - percentage_incorrect) > .97){
      ++new_level;
    }

    if(new_level !== this.level && ((total_count - this.total_count_of_last_level_change) > (1 * this.level))){
      this.total_count_of_last_level_change = total_count;
      this.level = Math.max(new_level, 1);
    }

    this.new_note_interval_ms = this.lowest_level_time / this.level;
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
  noteRemovedBySheet(Note){
    
    var note_removed = find(this.played_notes, n => n._id ===  Note._id);

    if(!note_removed){
      this.played_notes.push(Note);
      this.incorrect_notes.push(Note);
    }

  }
  playKey(key){

    if(this.paused){
      return;
    }
    var Note = this.getNextNote();
    this.played_notes.push(Note);

    if(this.isCorrectKey(key, Note)){
      this.correct_notes.push(Note);
      $(Note.StaveNote.attrs.el).removeClass('note-red');
      $(Note.StaveNote.attrs.el).addClass('note-green');
    }
    else {
      this.incorrect_notes.push(Note);
      $(Note.StaveNote.attrs.el).removeClass('note-green');
      $(Note.StaveNote.attrs.el).addClass('note-red');
    }

    // check if end of game
  }

  getNextNote(){
    var index = this.played_notes.length;
    return this.sheet.getDrawnNotes()[index];
  }

  isCorrectKey(key, Note){
    return Note.StaveNote.getKeys().indexOf(key) > -1;
  }
  
}