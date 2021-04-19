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
            name: "Volcano Lower",
            backgroundImage: "volcano_lower.jpg",
            daylight: true,
            width: 50,
            height: 36,
            start: { x: 5, y: 18 }
        },
        {
            name: "Campfire By River",
            backgroundImage: "campfire_by_river.jpeg",
            daylight: true,
            width: 40,
            height: 40,
            start: { x: 20, y: 40-8 }
        },
        {
            name: "Campfire In Forest",
            backgroundImage: "campfire_forest.jpeg",
            daylight: true,
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
        },
        {
            name: "Medusa's Wake",
            backgroundImage: "medusa_wake.jpg",
            daylight: true,
            width: 32,
            height: 47,
            start: { x: 5, y: 42 }
        },
        {
            name: "Cradle of the Giant",
            backgroundImage: "cradle_of_giant.jpg",
            daylight: true,
            width: 35,
            height: 40,
            start: { x: 18, y: 40 }
        },
        {
            name: "Fallen Goddess",
            backgroundImage: "fallen_goddess.jpg",
            daylight: true,
            width: 25,
            height: 50,
            start: { x: 12, y: 25 }
        },
        {
            name: "Northern Land of Giants",
            backgroundImage: "north_land_of_giants.jpg",
            daylight: true,
            width: 27,
            height: 17,
            start: { x: 3, y: 12 }
        },
        {
            name: "Docks",
            backgroundImage: "docks.jpg",
            daylight: false,
            width: 50,
            height: 70,
            start: { x: 25, y: 5 }
        },
        {
            name: "Cave Entrance",
            backgroundImage: "cave_entrance.jpg",
            daylight: true,
            width: 22,
            height: 17,
            start: { x: 11, y: 17 }
        },
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