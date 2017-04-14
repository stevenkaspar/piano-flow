import {inject} from 'aurelia-framework';
import {PianoFlowGC} from './game-controllers/piano-flow-gc';
import {Keyboard} from './compose-views/keyboard';

export class PlayTheNotes {
  instructions = 'play the notes';
  subscribers = [];
  keyboard = new Keyboard();

  constructor(){
  }

  attached(){
    
    this.game = new PianoFlowGC('sheet', this.keyboard);

    this.game.drawSheet();

    this.listen(true);
  }

  detached(){
    this.listen(false);
    this.game.dispose();
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