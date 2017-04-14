import {Sheet} from '../../libs/sheet/index';
import find    from 'lodash.find';

export class PianoFlowGC {
  in_game         = false;
  in_round        = false;
  paused          = false;
  stepTimeout     = null;
  /** Note[] */
  played_notes    = [];
  performance_level = 100;
  updateInterval  = null;
  target_offset   = 115;
  flow_speed      = 80;
  cur_add_new_note_interval_ms = 0;
  update_interval_ms           = 50;
  lowest_level_time            = 4000;
  total_count_of_last_level_change = 0;
  // below here should be configurable
  level = 3;
  // states to track in updateInterval
  new_note_interval_ms = this.lowest_level_time / this.level;

  constructor(selector, keyboard){
    this.sheet = new Sheet({
      selector:    selector,
      removePoint: this.removePoint.bind(this)
    });
    
    this.keyboard = keyboard;
    this.keyboard.on('keypress', this.checkPressedKeys, this);
    this.updateInterval = setInterval(this.udpate.bind(this), this.update_interval_ms);
  }

  targetOffset(){
    let actual_sheet_width = this.sheet.context.svg.clientWidth;
    let multiplier = actual_sheet_width / this.sheet.width;
    
    return (this.target_offset * multiplier);
  }

  removePoint(){
    let actual_sheet_width = this.sheet.context.svg.clientWidth;
    let multiplier = actual_sheet_width / this.sheet.width;

    return (this.target_offset - 40) * multiplier;
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
    
    if(this.performance_level < 50){
      this.endGame();
      return;
    }

    // check state of the next note
    var Note      = this.getNextNote();
    if(Note){
      var note_time = this.getTimeOfNextNote();
      if(note_time === 2 && !this.noteHasBeenPlayed(Note)){
        Note.style('red');
        this.played_notes.push(Note);
        this.performance_level += -3;
      }
    }   

    // check level and see if we should add another note
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
    let total_notes_possible = this.played_notes.length;
    
    var new_level = this.level;

    if(this.performance_level > 97){
      new_level++;
    }
    else if(this.performance_level < 95) {
      new_level--;
    }

    if(new_level !== this.level && ((total_notes_possible - this.total_count_of_last_level_change) > (1 * this.level))){
      this.total_count_of_last_level_change = total_notes_possible;
      new_level  = Math.min(25, new_level);
      this.level = Math.max(1, new_level);
      this.new_note_interval_ms = this.lowest_level_time / this.level;
    }
  }

  drawSheet(){
    this.sheet.createSheet();
    this.sheet.addVerticalLine(this.target_offset);
  }
  startGame(){
    console.log('start');
    this.in_game       = true;
    this.sheet.clearDrawnNotes();
    this.played_notes    = [];
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
  checkPressedKeys(){
    
    if(this.paused || !this.in_game){
      return;
    }
    
    let Note    = this.getNextNote();
    let pressed_keys = this.keyboard.getPressedKeys();
    
    if(pressed_keys.length !== Note.StaveNote.getKeys().length){
      return;
    }

    let note_xy = Note.getXY();
    let time = this.getTimeOfNextNote();
    // if note is in timezone
    if(time === 0){

      // add to played notes
      this.played_notes.push(Note);

      // if correct
      if(this.pressedKeysMatchStaveNoteKeys(pressed_keys, Note.StaveNote)){
        // increment performance indicator
        Note.style('green');
        this.performance_level += 1;
      }
      // else
      else {
        // decrement performance indicator
        Note.style('red');
        this.performance_level += -1;
      }
    }
    // else
    else {
      // decrement performance indicator
      this.performance_level += -2;
    }

    // force between 1 and 100
    this.performance_level = Math.min(100, this.performance_level);
    this.performance_level = Math.max(1,   this.performance_level);
  }

  getNextNote(){
    var index = this.played_notes.length;
    return this.sheet.getDrawnNotes()[index];
  }

  pressedKeysMatchStaveNoteKeys(pressed_keys, StaveNote){
    let correct_keys = StaveNote.getKeys();
    for(let key of pressed_keys.map(pk => pk.key)){
      if(correct_keys.indexOf(key) === -1){
        return false;
      }
    }
    return true;
  }

  /**
   * returns 
   * 
   * - **0** if **on time** to be played
   * - **1** if it is **not time** yet
   * - **2** if it is too **late**
   */
  getTimeOfNextNote(){
    let Note    = this.getNextNote();
    let note_xy = Note.getXY();

    // if note note passed
    let not_passed = note_xy.x > this.targetOffset() - 14;
    let been_here  = note_xy.x < this.targetOffset() + 10;

    // been here and passed - too early
    if(!been_here){
      return 1;
    }
    // been here and passed - too late
    else if(!not_passed){
      return 2;
    }
    // it is here and not passed - on time
    else {
      return 0;
    }
  }

  noteHasBeenPlayed(Note){
    return find(this.played_notes, n => n._id === Note._id);
  }
  
}