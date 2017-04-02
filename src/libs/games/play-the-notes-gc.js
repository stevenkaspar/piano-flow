import {Sheet} from '../sheet/index';

export class PlayTheNotesGC {
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

  // states to track in updateInterval
  round_time_remaining = 0;
  round_time_divisor   = 0;

  constructor(selector){
    this.sheet = new Sheet(selector);
    this.updateInterval = setInterval(this.udpate.bind(this), 50);
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
    }
    else {
      this.round_time_remaining = this.round_time_divisor = 1;
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

    this.round_results.push(this.calculateRoundResult());
    
    this.stepTimeout = setTimeout(this.nextRound.bind(this), this.bt_round_time);
      
  }
  playKey(key){
    var StaveNote = this.getNextStaveNote();
    this.played_notes.push(key);

    if(this.paused){
      return;
    }

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
    // check if end of round
    if(this.played_notes.length >= this.possible_notes){
      this.endRound();
    }
  }
  getNextStaveNote(){
    var index = this.played_notes.length;
    return this.sheet.getDrawnNotes()[index];
  }
  isCorrectKey(key, StaveNote){
    return StaveNote.getKeys().indexOf(key) > -1;
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