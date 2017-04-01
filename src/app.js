export class App {
  configureRouter(config, router) {
    config.title = 'Piano App';
    config.map([
      { 
        route:    ['', 'home'],    
        name:     'home',      
        moduleId: 'home',      
        nav:      true, 
        title:    'home' 
      },
      { 
        route:    'about',         
        name:     'about',        
        moduleId: 'about',        
        nav:      true, 
        title:    'about' 
      },
      { 
        route:    'settings',  
        name:     'child-router', 
        moduleId: 'settings', 
        nav:      true, 
        title:    'settings' 
      },
      { 
        route:    '/sets',      
        name:     'sets', 
        moduleId: 'sets/sets-index', 
        nav:      true, 
        title:    'sets' 
      }
    ]);

    this.router = router;
  }
}
