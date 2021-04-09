module.exports = class Constants {
    //The physical size of the screen
    //This allows the renderer to ensure all blocks are 1 inch of real
    //world space
    static screenDiameterIn = 13.3;
    static screenWidthIn = 11.6;
    static screenHeightIn = 6.5;
    //Target framerate
    static framerate = 30;
    static blankTileImage = "parchment.jpg";
    static defaultOccupierImage = "/images/blank_creature.png";

    static imageBaseDir = "./client_interface/web_content/images";
};