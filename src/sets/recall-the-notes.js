import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {RecallTheNotesGC} from '../libs/games/recall-the-notes-gc';

@inject(EventAggregator)
export class RecallTheNotes {

  constructor(ea){
    this.ea = ea;

    this.ea.subscribe('play-key', this.playKeySubscriber.bind(this));
  }

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
  
  playKeySubscriber(key_array){

    this.game.playKey(key_array[0]);

  }
}