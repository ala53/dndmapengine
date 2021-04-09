//The UI is very minimal for the client side
//Most rendering is within the canvas


//At the bottom right of the screen, 
//the UI always shows six buttons
//and two text listings overlaid on the map. It is very 
//Up, left, right, and down, so the map can be scrolled as needed
//Zoom in/out, which zooms doubles zoom or halves zoom, respectively
//The two text areas show the current zoom level and current map top/left
//in grid space

//State 1: moving player object
//If the player object has moved within the last five seconds,
//track its starting and ending positions, run an A* search, and
//show the total distance moved as an <H1> over the map. Once the object
//has been still for at least five seconds, we remove the h1 and reset
//its starting position

//State 2: multiple objects lost
//If tracking on multiple objects is lost, we render an H1 over the world
//saying "Replace all objects on to map"