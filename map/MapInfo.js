module.exports = {
    maps: [
        {
            name: "Mansion",
            backgroundImage: "mansion.jpeg",
            width: 50,
            height: 44,
            start: {x: 24, y: 30}
        },
        {
            name: "Forest (Exploration)",
            backgroundImage: "forest_exploration.png",
            daylight: true,
            width: 160,
            height: 160,
            start: { x: 14, y: 160-26 }
        },
        {
            name: "Volcano Cave",
            backgroundImage: "volcano_cave.jpeg",
            daylight: false,
            width: 51,
            height: 38,
            //If the map has partial tiles of width, that can be passed on in the data
            _actualWidth: 51.25,
            _actualHeight: 38.25,
            start: { x: 5, y: 6 }
        },
        {
            name: "Campfire By River",
            backgroundImage: "campfire_by_river.jpeg",
            daylight: false,
            width: 40,
            height: 40,
            start: { x: 20, y: 40-8 }
        },
        {
            name: "Campfire In Forest",
            backgroundImage: "campfire_forest.jpeg",
            daylight: false,
            width: 40,
            height: 40,
            start: { x: 18, y: 40-20 }
        },
        {
            name: "Fort in Trees",
            backgroundImage: "fort_in_trees.jpeg",
            daylight: true,
            width: 70,
            height: 70,
            start: { x: 15, y: 35 }
        }
    ],
    tileEffects: [
        {
            x: 0, y: 0, effects: {
                "fire": true,
                "underwater": true
            }
        }
    ]
}

//mansion.jpeg: 50, 44