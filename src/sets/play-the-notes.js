import {inject} from 'aurelia-framework';
import {PlayTheNotesGC} from './game-controllers/play-the-notes-gc';
import {Keyboard} from './compose-views/keyboard';

export class PlayTheNotes {
  instructions = 'play the notes';
  subscribers = [];
  keyboard = new Keyboard();

  constructor(){
  }

  attached(){
    
    this.game = new PlayTheNotesGC('sheet', this.keyboard);

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