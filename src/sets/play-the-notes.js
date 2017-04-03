import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {PlayTheNotesGC} from '../libs/games/play-the-notes-gc';

@inject(EventAggregator)
export class PlayTheNotes {

  constructor(ea){
    this.ea = ea;

    this.ea.subscribe('play-key', this.playKeySubscriber.bind(this));
  }

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

  playKeySubscriber(key_array){

    this.game.playKey(key_array[0]);

  }
}