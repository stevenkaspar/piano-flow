import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {PlayTheNotesGC} from './game-controllers/play-the-notes-gc';

@inject(EventAggregator)
export class PlayTheNotes {
  instructions = 'play the notes';
  subscribers = [];

  constructor(ea){
    this.ea = ea;
  }

  attached(){
    
    this.game = new PlayTheNotesGC('sheet');

    this.game.drawSheet();

    this.listen(true);
  }

  detached(){
    this.listen(false);
  }

  listen(on_off){
    if(on_off){
      this.subscribers.push(this.ea.subscribe('play-key', this.playKeySubscriber.bind(this)));
    }
    else {
      for(let subscriber of this.subscribers){
        subscriber.dispose();
      }
    }
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