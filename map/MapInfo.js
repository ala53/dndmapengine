module.exports = {
    width: 50, //map is 25 blocks, for a total of 50 in x2 capacity
    height: 44, // map is 22 blocks, for a total of 44 in x2 capacity
    backgroundImage: "mansion.jpeg",
    tileEffects: [
        {
            x: 0, y: 0, effects: {
                "fire": true,
                "underwater": true
            }
        }
    ]
}