import {RecallTheNotesGC} from '../libs/games/recall-the-notes-gc';

export class RecallTheNotes {

  attached(){
    
    this.game = new RecallTheNotesGC('sheet');

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

  playKey(event, key){
    event.stopPropagation();
    event.preventDefault();
    navigator.vibrate(50);
    this.game.playKey(key);
  }
}