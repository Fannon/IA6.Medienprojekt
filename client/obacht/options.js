/* global goog, obacht */
/* jshint strict: false */

goog.provide('obacht.options');

/**
 * Options for the game
 *
 * @singleton
 */
obacht.options = {
    graphics: {
        viewportWidth: 1280,
        viewportHeight: 720
    },
    sound: {
        music: true,
        sound: true,
        vibration: true
    },
    "world": {
        "initialWorldSpeed": 100, // Fiktiv
        "iterateWorldSpeed": 5 // Fiktiv
    },
    "player": {

    },
    "trap": {

    },
    "bonus": {

    },
    "server": {
        "url": "http://192.168.2.100:8080/"
    }
};
