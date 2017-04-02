export class SetsIndex {
  configureRouter(config, router) {
    config.title = 'Sets';
    config.map([
      { 
        route:    ['', 'select-a-note'],    
        name:     'select-a-note',      
        moduleId: './select-a-note',      
        nav:      true, 
        title:    'select a note' 
      },
      { 
        route:    ['', 'play-the-notes'],    
        name:     'play-the-notes',      
        moduleId: './play-the-notes',      
        nav:      true, 
        title:    'play-the notes' 
      }
    ]);

    this.router = router;
  }
}
