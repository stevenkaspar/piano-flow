import {SelectTheNoteGC} from '../libs/games/select-the-note-gc';

export class SelectANote {

  attached(){
    
    this.game = new SelectTheNoteGC('sheet');

    this.game.drawSheet();

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

  playKey(key){
    this.game.playKey(key);
  }
}