/* global goog, obacht */
goog.provide('obacht.options');

/**
 * Options for the game
 *
 * @singleton
 */
obacht.options = {
    graphics: {
        viewportWidth: 1280,
        viewportHeight: 720,
    },
    sound: {
        music: true,
        sound: true,
        vibration: true
    },
    "world": {
        "initialWorldSpeed": 100,
        "iterateWorldSpeed": 5
    },
    "player": {

    },
    "trap": {

    },
    "bonus": {

    },
    "server": {
        "url": "http://obacht.informatik.hs-augsburg.de:8080/"
    }
};
