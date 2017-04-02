export class SetsIndex {
  configureRouter(config, router) {
    config.title = 'Sets';
    config.map([
      { 
        route:    ['', 'play-the-notes'],    
        name:     'play-the-notes',      
        moduleId: './play-the-notes',      
        nav:      true, 
        title:    'play the notes' 
      },
      { 
        route:    ['', 'recall-the-notes'],    
        name:     'recall-the-notes',      
        moduleId: './recall-the-notes',      
        nav:      true, 
        title:    'recall the notes' 
      }
    ]);

    this.router = router;
  }
}
