import {Sheet} from '../../libs/sheet/index';

export class RecallTheNotesGC {
  // configuration items
  sec_per_note    = 1.5; // seconds to show sheet for per note
  num_rounds      = 2;
  possible_notes  = 4;
  bt_round_time   = 4000;

  // game state variables
  in_game         = false;
  in_round        = false;
  showing_sheet   = true;
  showing_board   = true;
  paused          = false;
  pause_time_left = null;
  cur_step_start  = null;
  cur_step_end    = null;
  round_results   = [];
  stepTimeout     = null;
  played_notes    = [];
  correct_notes   = [];
  incorrect_notes = [];
  updateInterval  = null;

  key_has_been_pressed_for_note = {
    yes: false,
    time: null
  };
  keypress_mercy_window = 500;

  // states to track in updateInterval
  round_time_remaining = 0;
  round_time_divisor   = 0;

  constructor(selector, keyboard){
    this.sheet = new Sheet({
      selector:     selector
    });
    
    this.keyboard = keyboard;
    this.keyboard.on('keypress', this.checkPressedKeys, this);
    this.updateInterval = setInterval(this.udpate.bind(this), 10);
  }

  udpate(){
    // run updates that should be calculated every 50ms
    if(this.in_round){
      if(!this.paused){
        this.round_time_remaining = this.cur_step_end - new Date().getTime();
      }
      else if(this.in_round && this.paused){
        this.round_time_remaining = this.pause_time_left;
      }
      this.round_time_divisor = this.cur_step_end - this.cur_step_start;

      // check if end of round
      if(this.played_notes.length >= this.possible_notes){
        this.endRound();
      }
    }
    else {
      this.round_time_remaining = this.round_time_divisor = 1;
    }

    if(this.showing_board){
      this.checkPressedKeys();
    }
    

  }

  drawSheet(){
    this.sheet.createSheet();
  }
  startGame(){
    console.log('start');
    this.in_game       = true;
    this.round_results = [];
    this.nextRound();
  }
  endGame(){
    console.log('end');
    this.in_game = false;
  }
  pauseGame(){
    console.log('pause');
    
    this.paused = true;

    if(this.in_round){
      this.pause_time_left = this.cur_step_end - new Date().getTime();
      console.log('left ' + this.pause_time_left);
    }

    this.clearIfTimeout();
  }
  resumeGame(){
    console.log('resume');

    this.paused = false;

    if(!this.in_round){
      this.stepTimeout = setTimeout(this.nextRound.bind(this), this.bt_round_time);
    }
    else {
      this.cur_step_end = new Date().getTime() + this.pause_time_left;
      console.log('new end ' + this.cur_step_end);

      if(this.showing_sheet){
        console.log('resume to show board');
        this.stepTimeout = setTimeout(this.showBoard.bind(this), this.pause_time_left);
        this.cur_step_start = this.cur_step_end - this.getShowSheetTime();
      }
      else {
        console.log('resume to end round');
        this.stepTimeout = setTimeout(this.endRound.bind(this), this.pause_time_left);
        this.cur_step_start = this.cur_step_end - this.getShowSheetTime();
      }
    }
    
  }
  nextRound(){
    console.log('next round');

    if(this.round_results.length >= this.num_rounds){
      this.endGame();
      return;
    }

    this.startRound();
  }
  startRound(){
    console.log('start round');
    this.sheet.clearDrawnNotes();
    this.sheet.addNotes(this.possible_notes);
    this.played_notes    = [];
    this.correct_notes   = [];
    this.incorrect_notes = [];
    this.in_round        = true;
    this.cur_step_start  = new Date().getTime();
    this.cur_step_end    = this.cur_step_start + this.getShowSheetTime();
    this.showing_sheet   = true;
    this.showing_board   = false;
    this.clearIfTimeout();
    this.stepTimeout     = setTimeout(this.showBoard.bind(this), this.getShowSheetTime());
    console.log('start ' + this.cur_step_start);
    console.log('end   ' + this.cur_step_end);
  }
  showBoard(){
    console.log('show board');
    this.showing_sheet   = false;
    this.showing_board   = true;
    this.cur_step_start  = new Date().getTime();
    this.cur_step_end    = this.cur_step_start + this.getShowBoardTime();
    this.clearIfTimeout();
    this.stepTimeout     = setTimeout(this.endRound.bind(this), this.getShowBoardTime());
  }
  endRound(){
    console.log('end round');
    clearTimeout(this.stepTimeout);
    this.in_round      = false;
    this.showing_sheet = true;
    this.showing_board = true;

    this.keyboard.deactivateAllKeys();

    this.round_results.push(this.calculateRoundResult());
    
    this.stepTimeout = setTimeout(this.nextRound.bind(this), this.bt_round_time);
      
  }
  checkPressedKeys(){

    if(this.paused || this.showing_sheet){
      return;
    }
    
    let Note = this.getNextNote();
    let pressed_keys = this.keyboard.getPressedKeys();
    
    let cutoff_time = this.key_has_been_pressed_for_note.time + this.keypress_mercy_window;
    
    if(pressed_keys.length >= Note.StaveNote.getKeys().length){
      
      if(this.pressedKeysMatchStaveNoteKeys(pressed_keys, Note.StaveNote)){
        this.setNextNoteRight(Note.StaveNote.getKeys());
      }
      else {
        this.setNextNoteWrong(Note.StaveNote.getKeys());
      }

      this.key_has_been_pressed_for_note = {
        yes: false,
        time: null
      };
      this.keyboard.deactivateAllKeys();

    }
    else if(this.key_has_been_pressed_for_note.yes && (new Date().getTime() > cutoff_time)){

      this.key_has_been_pressed_for_note = {
        yes: false,
        time: null
      };
      this.keyboard.deactivateAllKeys();

      this.setNextNoteWrong(Note.StaveNote.getKeys());

      return;
    }

    else if(pressed_keys.length > 0 && !this.key_has_been_pressed_for_note.yes){
      this.key_has_been_pressed_for_note = {
        yes: true,
        time: new Date().getTime()
      };
    }
    
  }
  setNextNoteRight(key){
    if(!key){
      key = 'PLACEHOLD';
    }
    let Note = this.getNextNote();
    this.correct_notes.push(key);
    Note.style('green');
    this.played_notes.push(key);
  }

  setNextNoteWrong(key){
    if(!key){
      key = 'PLACEHOLD';
    }
    let Note = this.getNextNote();
    this.incorrect_notes.push(key);
    Note.style('red');
    this.played_notes.push(key);
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

  getNextNote(){
    var index = this.played_notes.length;
    return this.sheet.getDrawnNotes()[index];
  }

  calculateRoundResult(){
    
    var correct   = this.correct_notes.length;
    var incorrect = this.incorrect_notes.length;
    var time      = Math.min(
      this.getShowBoardTime(), 
      this.getShowBoardTime() - (this.cur_step_end - new Date().getTime())
      )

    var round_result = {
      finished:          this.correct_notes.length >= this.possible_notes,
      score:             (correct * 2) - (incorrect * 2) + parseInt((this.getShowBoardTime() - time) / 1000),
      num_notes_correct: this.correct_notes.length,
      time_to_finish:    time
    }
    
    return round_result;

  }

  getShowSheetTime(){
    return this.sec_per_note * 1000 * this.possible_notes;
  }

  getShowBoardTime(){
    return this.sec_per_note * 1000 * this.possible_notes * 2;
  }

  clearIfTimeout(){
    if(this.stepTimeout){
      clearTimeout(this.stepTimeout);
    }
  }
}