/* global goog, lime, obacht */
/* jshint strict: false, devel:true */

goog.provide('obacht.TrapManager');

goog.require('obacht.Trap');

/**
 * Trap Manager/Collection
 *
 * @param {String} type     Own or enemy TrapManager
 * @param {Object} world    World the TrapManager manages
 * @param {Object} player   Player
 * @param {Object} layer   Layer
 *
 * @constructor
 */
obacht.TrapManager = function(type, world, player, layer) {
    "use strict";

    var self = this;
    this.traps = [];
    this.world = world;
    this.layer = layer;

    this.type = type;

    obacht.mp.events.subscribe('trap', function(data) {
        var trap = new obacht.Trap(data.type);
        self.traps[self.traps.length] = trap;
        self.layer.appendChild(trap.layer);

        self.who='B';

        //Are you own or enemy?
        if(self.who==='A') {
            trap.trap.setPosition(obacht.options.trap.own.x, obacht.options.trap.own.y);
            trap.trap.setAnchorPoint(obacht.options.trap.general.anchorx, obacht.options.trap.general.anchory);
            var angle=obacht.options.trap.own.angle;
        }else if(self.who==='B') {
            trap.trap.setPosition(obacht.options.trap.enemy.x, obacht.options.trap.enemy.y);
            trap.trap.setAnchorPoint(obacht.options.trap.general.anchorx, obacht.options.trap.general.anchory);
            var angle=obacht.options.trap.enemy.angle;
        }

        //Do you fly low or high?
        var positiontype=obacht.themes[obacht.mp.roomDetail.theme].traps[data.type].position;
        if (positiontype==='air') {
        var factor=obacht.options.trap.general.factorhigh;
        }else if(positiontype==='ground') {
        var factor=obacht.options.trap.general.factorlow;
        }

        var anglespeed=0.01;
        var milleseconds=15;

        lime.scheduleManager.scheduleWithDelay(function(dt){

            var position = trap.trap.getPosition();

            //if(self.who==='A') {
            position.x = Math.sin(angle) * factor + obacht.options.trap.own.x;
            position.y = Math.cos(angle) * factor + obacht.options.trap.own.y;
            //}else if(self.who==='B') {
            /*position.x = Math.sin(angle) * factor + obacht.options.trap.enemy.x;
            position.y = Math.cos(angle) * factor + obacht.options.trap.enemy.y;
            }*/

            trap.trap.setPosition(position);
            angle=angle+anglespeed;
            console.log(position);
        }, trap,milleseconds);

    });

    obacht.intervals.cleanUpTraps = setInterval(function() {
        self.cleanUpTraps(self.traps);
    }, 500);

};

obacht.TrapManager.prototype = {

    /**
     * Removes all Traps that are beyond the player
     *
     * @param {Object} traps Traps Array
     */
    cleanUpTraps: function(traps) {
        "use strict";

        for (var i = 0; i < traps.length; i++) {

            var trap = traps[i];

            if (trap) { // Removed Traps are 'undefined'
                var position = trap.trap.getPosition();
                var width = trap.trap.getSize().width;
                if (position.x < 0 - width) {
                    //this.layer.removeChild(trap.layer);
                    //delete traps[i];
                    //console.log('Trap removed');
                }
            }
        }
    },

    /**
     * Destructor - Cleans up all Lime Elements and DataStructures
     */
    destruct: function() {

    }
};

