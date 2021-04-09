module.exports = class Constants {
    //The physical size of the screen
    //This allows the renderer to ensure all blocks are 1 inch of real
    //world space
    static screenDiameterIn = 43;
    static screenWidthIn = 37.5;
    static screenHeightIn = 21.1;
    //Target framerate
    static framerate = 30;
    //The map is 200x200 5 foot blocks
    static mapSizeBlocks = 200;
    static blankTileImage = "parchment.jpg";
    static defaultOccupierImage = "/images/blank_creature.png";

    static imageBaseDir = "./client_interface/web_content/images";
};