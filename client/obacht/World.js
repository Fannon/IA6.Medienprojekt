/* global goog, lime, obacht, log */

goog.provide('obacht.World');
goog.require('obacht.options');
goog.require('obacht.Bonus');

goog.require('lime.Sprite');
goog.require('lime.animation.Sequence');
goog.require('lime.animation.Loop');
goog.require('lime.animation.RotateBy');

/**
 * Its a World Object
 *
 * @param {Object} currentGame    Current Game Object
 * @param {String} type
 *
 * @constructor
 */
obacht.World = function(currentGame, type) {
    "use strict";

    this.theme = currentGame.theme;
    this.gameLayer = currentGame.layer;
    this.spritesheet = currentGame.spritesheet;


    /////////////////////////////////////////
    // DECIDE IF BOTTOM WORLD OR TOP WORLD //
    /////////////////////////////////////////

    if (type === 'bottom') {
        this.x = obacht.options.world.bottom.x;
        this.y = obacht.options.world.bottom.y;
        this.rotation1 = obacht.options.world.bottom.rotation1;
        this.rotation2 = obacht.options.world.bottom.rotation2;
        this.rotation3 = obacht.options.world.bottom.startRotation1;
        this.rotation4 = obacht.options.world.bottom.startRotation2;
    } else {
        this.x = obacht.options.world.top.x;
        this.y = obacht.options.world.top.y;
        this.rotation1 = obacht.options.world.top.rotation1;
        this.rotation2 = obacht.options.world.top.rotation2;
        this.rotation3 = obacht.options.world.bottom.startRotation1;
        this.rotation4 = obacht.options.world.bottom.startRotation2;
    }



    ///////////////////////
    // LIME.JS - OBJECTS //
    ///////////////////////

    this.clouds1 = new lime.Sprite()
        .setSize(obacht.options.world.size.clouds, obacht.options.world.size.clouds)
//        .setFill(this.spritesheet.getFrame('clouds.png'))
        .setFill(this.theme.world.files.clouds)
        .setPosition(this.x, this.y)
        .setAnchorPoint(0, 1)
        .setRotation(this.rotation1)
        .setRenderer(obacht.renderer)
        .setQuality(obacht.options.graphics.worldQualityC);

    this.clouds2 = new lime.Sprite()
        .setSize(obacht.options.world.size.clouds, obacht.options.world.size.clouds)
//        .setFill(this.spritesheet.getFrame('clouds.png'))
        .setFill(this.theme.world.files.clouds)
        .setPosition(this.x, this.y)
        .setAnchorPoint(0, 1)
        .setRotation(this.rotation2)
        .setRenderer(obacht.renderer)
        .setQuality(obacht.options.graphics.worldQualityC);

    this.landscape1 = new lime.Sprite()
        .setSize(obacht.options.world.size.landscape, obacht.options.world.size.landscape)
//        .setFill(this.spritesheet.getFrame('landscapeB.png'))
        .setFill(this.theme.world.files.landscape)
        .setPosition(this.x, this.y)
        .setAnchorPoint(0, 1)
        .setRotation(this.rotation1)
        .setRenderer(obacht.renderer)
        .setQuality(obacht.options.graphics.worldQualityB);

    this.landscape2 = new lime.Sprite()
        .setSize(obacht.options.world.size.landscape, obacht.options.world.size.landscape)
//        .setFill(this.spritesheet.getFrame('landscapeB.png'))
        .setFill(this.theme.world.files.landscape)
        .setPosition(this.x, this.y)
        .setAnchorPoint(0, 1)
        .setRotation(this.rotation2)
        .setRenderer(obacht.renderer)
        .setQuality(obacht.options.graphics.worldQualityB);

    this.ground1 = new lime.Sprite()
        .setSize(obacht.options.world.size.ground, obacht.options.world.size.ground)
//        .setFill(this.spritesheet.getFrame('ground.png'))
        .setFill(this.theme.world.files.ground)
        .setPosition(this.x, this.y)
        .setAnchorPoint(0, 1)
        .setRotation(this.rotation1)
        .setRenderer(obacht.renderer)
        .setQuality(obacht.options.graphics.worldQualityA);

    this.ground2 = new lime.Sprite()
        .setSize(obacht.options.world.size.ground, obacht.options.world.size.ground)
//        .setFill(this.spritesheet.getFrame('ground.png'))
        .setFill(this.theme.world.files.ground)
        .setPosition(this.x, this.y)
        .setAnchorPoint(0, 1)
        .setRotation(this.rotation2)
        .setRenderer(obacht.renderer)
        .setQuality(obacht.options.graphics.worldQualityA);

    this.gameLayer.appendChild(this.clouds2);
    this.gameLayer.appendChild(this.clouds1);
    this.gameLayer.appendChild(this.landscape1);
    this.gameLayer.appendChild(this.landscape2);
    this.gameLayer.appendChild(this.ground1);
    this.gameLayer.appendChild(this.ground2);

    this.spin();
};



///////////////////////////
// PROTOTYPE - FUNCTIONS //
///////////////////////////

obacht.World.prototype = {

    /**
     * Spin the World
     */
    spin: function() {
        "use strict";
        this.createAnimation1(this.ground1, this.rotation3, this.rotation4, obacht.options.world.spinDuration.front, 0);
        this.createAnimation2(this.ground2, this.rotation4, this.rotation3, 0, obacht.options.world.spinDuration.front);
        this.createAnimation1(this.landscape1, this.rotation3, this.rotation4, obacht.options.world.spinDuration.middle, 0);
        this.createAnimation2(this.landscape2, this.rotation4, this.rotation3, 0, obacht.options.world.spinDuration.middle);
        this.createAnimation1(this.clouds1, this.rotation3, this.rotation4, obacht.options.world.spinDuration.clouds, 0);
        this.createAnimation2(this.clouds2, this.rotation4, this.rotation3, 0, obacht.options.world.spinDuration.clouds);
    },

    createAnimation1: function(object, rotation1, rotation2, duration1, duration2) {
        "use strict";
        object.runAction(new lime.animation.Loop(
            new lime.animation.Sequence(
                new lime.animation
                    .RotateBy(rotation1)
                    .setDuration(duration1)
                    .setEasing(lime.animation.Easing.LINEAR)
                    .enableOptimizations(),
                new lime.animation
                    .RotateBy(rotation2)
                    .setDuration(duration2)
                    .setEasing(lime.animation.Easing.LINEAR)
                    .enableOptimizations(),
                new lime.animation
                    .RotateBy(rotation1)
                    .setDuration(duration1)
                    .setEasing(lime.animation.Easing.LINEAR)
                    .enableOptimizations()
            )
        ));
    },

    createAnimation2: function(object, rotation1, rotation2, duration1, duration2) {
        "use strict";
        object.runAction(new lime.animation.Loop(
            new lime.animation.Sequence(
                new lime.animation
                    .RotateBy(rotation1)
                    .setDuration(duration1)
                    .setEasing(lime.animation.Easing.LINEAR)
                    .enableOptimizations(),
                new lime.animation
                    .RotateBy(rotation2)
                    .setDuration(duration2)
                    .setEasing(lime.animation.Easing.LINEAR)
                    .enableOptimizations(),
                new lime.animation
                    .RotateBy(rotation2)
                    .setDuration(duration2)
                    .setEasing(lime.animation.Easing.LINEAR)
                    .enableOptimizations()
            )
        ));
    },

    /**
     * Destructor - Cleans up all Lime Elements and DataStructures
     */
    destruct: function() {
        "use strict";
    }
};
