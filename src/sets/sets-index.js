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
      }
    ]);

    this.router = router;
  }
}
