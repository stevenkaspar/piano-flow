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
        route:    ['', 'recall-the-notes'],    
        name:     'recall-the-notes',      
        moduleId: './recall-the-notes',      
        nav:      true, 
        title:    'recall-the notes' 
      }
    ]);

    this.router = router;
  }
}
