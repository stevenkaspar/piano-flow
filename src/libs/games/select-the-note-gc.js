import {Sheet} from '../sheet/index';

export class SelectTheNoteGC {
  in_game         = false;
  in_round        = false;
  paused          = false;
  round_time      = 5000;
  bt_round_time   = 1250;
  cur_round_start = null;
  cur_round_end   = null;
  round_results   = [];
  stepTimeout     = null;
  num_rounds      = 2;
  possible_notes  = 4;
  played_notes    = [];

  constructor(selector){
    this.sheet = new Sheet(selector);
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
      this.round_time_left = this.cur_round_end - new Date().getTime();
      console.log('left ' + this.round_time_left);
    }

    clearTimeout(this.stepTimeout);
  }
  resumeGame(){
    console.log('resume');

    this.paused = false;

    if(this.in_round){
      this.cur_round_end = new Date().getTime() + this.round_time_left;
      console.log('new end ' + this.cur_round_end);
      this.stepTimeout = setTimeout(this.endRound.bind(this), this.round_time_left);
    }
    else {
      this.stepTimeout = setTimeout(this.nextRound.bind(this), this.bt_round_time);
    }
    
  }
  nextRound(){
    console.log('next round');

    if(this.round_results.length >= this.num_rounds){
      this.endGame();
      return;
    }

    this.sheet.clearDrawnNotes();
    this.sheet.addNotes(this.possible_notes);
    this.played_notes    = [];
    this.in_round        = true;
    this.cur_round_start = new Date().getTime();
    console.log('start ' + this.cur_round_start);
    this.cur_round_end   = this.cur_round_start + this.round_time;
    console.log('end ' + this.cur_round_end);
    this.stepTimeout     = setTimeout(this.endRound.bind(this), this.round_time);
  }
  endRound(){
    console.log('end round');
    clearTimeout(this.stepTimeout);
    this.in_round = false;

    var round_result = {
      finished: false,
      num_notes_correct: this.played_notes.length,
      time_to_finish:    Math.min(5001, this.round_time - (this.cur_round_end - new Date().getTime()))
    }

    if(round_result.num_notes_correct >= this.possible_notes){
      round_result.finished = true;
    }

    this.round_results.push(round_result);
    
    this.stepTimeout = setTimeout(this.nextRound.bind(this), this.bt_round_time);
      
  }
  playKey(key){
    var StaveNote = this.getNextStaveNote();

    if(this.paused){
      return;
    }

    if(this.isCorrectKey(key, StaveNote)){
      this.played_notes.push(key);
      $(StaveNote.attrs.el).removeClass('note-red');
      $(StaveNote.attrs.el).addClass('note-green');
    }
    else {
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
}