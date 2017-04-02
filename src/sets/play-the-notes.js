import {PlayTheNotesGC} from '../libs/games/play-the-notes-gc';

export class PlayTheNotes {

  attached(){
    
    this.game = new PlayTheNotesGC('sheet');

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