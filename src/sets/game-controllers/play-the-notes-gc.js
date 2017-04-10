import {Sheet} from '../../libs/sheet/index';

export class PlayTheNotesGC {
  in_game         = false;
  in_round        = false;
  paused          = false;
  bt_round_time   = 1250;
  cur_round_start = null;
  cur_round_end   = null;
  round_results   = [];
  stepTimeout     = null;
  played_notes    = [];
  correct_notes   = [];
  incorrect_notes = [];
  keys_played_for_note = [];
  updateInterval  = null;
  multikeyTimeout = null;
  // below here should be configurable
  multitouch_window_ms = 750;
  round_time           = 10000;
  num_rounds           = 2;
  possible_notes       = 4;
  // states to track in updateInterval
  round_time_remaining = this.round_time;

  constructor(selector){
    this.sheet = new Sheet({
      selector:     selector
    });
    this.updateInterval = setInterval(this.udpate.bind(this), 50);
  }

  udpate(){
    // run updates that should be calculated every 50ms
    if(this.in_round && !this.paused){
      this.round_time_remaining = this.cur_round_end - new Date().getTime();
    }
    else if(this.in_round && this.paused){
      this.round_time_remaining = this.round_time_left;
    }
    else {
      this.round_time_remaining = this.round_time;
    }

    // check if end of round
    if(this.played_notes.length >= this.possible_notes && this.in_round){
      this.endRound();
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
    this.correct_notes   = [];
    this.incorrect_notes = [];
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
    
    this.round_results.push(this.calculateRoundResult());
    
    this.stepTimeout = setTimeout(this.nextRound.bind(this), this.bt_round_time);
      
  }
  playKey(key){
    if(this.paused){
      return;
    }
    // only push if unique
    if(this.keys_played_for_note.indexOf(key) === -1){
      this.keys_played_for_note.push(key);
    }
    
    let Note = this.getNextNote();

    if(this.keys_played_for_note.length < Note.StaveNote.getKeys().length){
      this.multikeyTimeout = setTimeout(this.isWrongMultikey.bind(this), this.multitouch_window_ms);
      return;
    }

    clearTimeout(this.multikeyTimeout);

    if(this.keysPlayedMatchStaveNoteKeys(Note.StaveNote)){
      this.setNextNoteRight(key);
    }
    else {
      this.setNextNoteWrong(key);
    }
    
  }

  isWrongMultikey(){
    this.setNextNoteWrong();
  }

  setNextNoteRight(key){
    if(!key){
      key = 'PLACEHOLD';
    }
    let Note = this.getNextNote();
    this.correct_notes.push(key);
    $(Note.StaveNote.attrs.el).removeClass('note-red');
    $(Note.StaveNote.attrs.el).addClass('note-green');
    this.played_notes.push(key);
    this.keys_played_for_note = [];
  }

  setNextNoteWrong(key){
    if(!key){
      key = 'PLACEHOLD';
    }
    let Note = this.getNextNote();
    this.incorrect_notes.push(key);
    $(Note.StaveNote.attrs.el).removeClass('note-green');
    $(Note.StaveNote.attrs.el).addClass('note-red');

    this.played_notes.push(key);
    this.keys_played_for_note = [];
  }

  keysPlayedMatchStaveNoteKeys(StaveNote){
    let correct_keys = StaveNote.getKeys();
    for(let key of this.keys_played_for_note){
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
      this.round_time, 
      this.round_time - (this.cur_round_end - new Date().getTime())
      )

    var round_result = {
      finished:          this.correct_notes.length >= this.possible_notes,
      score:             (correct * 2) - (incorrect * 2) + parseInt((this.round_time - time) / 1000),
      num_notes_correct: this.correct_notes.length,
      time_to_finish:    time
    }
    
    return round_result;

  }
}