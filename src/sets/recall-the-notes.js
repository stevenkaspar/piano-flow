import {inject} from 'aurelia-framework';
import {RecallTheNotesGC} from './game-controllers/recall-the-notes-gc';
import {Keyboard} from './compose-views/keyboard';

export class RecallTheNotes {
  instructions = 'remember the notes and play them back';
  subscribers = [];
  keyboard = new Keyboard();

  constructor(){
  }

  attached(){
    
    this.game = new RecallTheNotesGC('sheet', this.keyboard);

    this.game.drawSheet();

    this.listen(true);
  }

  detached(){
    this.listen(false);
  }

  listen(on_off){
  }

  startGame(){
    this.game.startGame();
  }
  pauseGame(){
    this.game.pauseGame();
  }
  resumeGame(){
    this.game.resumeGame();
  }
  
  playKeySubscriber(key_array){

    this.game.playKey(key_array[0]);

  }
}