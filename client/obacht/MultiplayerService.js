/* global goog, lime, obacht, log, io */

goog.provide('obacht.MultiplayerService');

goog.require('goog.pubsub.PubSub');

/**
 * This service handles the connection between client and a mulitplayer-server
 *
 * It includes the communication protocol and registers functions and events
 * Uses Socket.io and connects to a Node.js Server
 *
 * @param {String} serverUrl    URL to NodeJS GameServer
 *
 * @author Sebastian Huber
 * @author Simon Heimler
 * @constructor
 */
obacht.MultiplayerService = function(serverUrl) {
    "use strict";

    //////////////////////////////
    // Model                    //
    //////////////////////////////

    var self = this;

    /** Connected to Server */
    this.connected = false;

    /** Room PIN */
    this.pin = false;

    /** Player ID */
    this.pid = false;

    /** RoomDetail Object */
    this.roomDetail = {};

    /** Friend Player, if connected to one */
    this.friend = false;

    /** Enemy Player, if game running */
    this.enemy = false;

    /** Socket.io */
    this.socket = io.connect(serverUrl, {
        'connect timeout': obacht.options.server.connectionTimeout,
        'reconnection delay': 500,
        'max reconnection attempts': 50
    });

    log.debug("Connecting to Multiplayer Server on " + serverUrl);

    /**
     * Event Publisher/Subscriber (http://closure-library.googlecode.com/svn/docs/class_goog_pubsub_PubSub.html)
     * Handles all the Events from the Multiplayer Service
     *
     * @type {goog.pubsub.PubSub}
     */
    this.events = new goog.pubsub.PubSub();


    //////////////////////////////
    // Communication Events     //
    //////////////////////////////

    /**
     * Player is connected, else print out the error
     * @event
     */
    this.socket.on('connected', function (data) {
        self.connected = true;
        if (!data.error) {
            log.info('Successful Connected with Transport: ' + self.socket.socket.transport.name);
            self.pid = data.pid;
        } else {
            log.error('Connection Error: ' + data.error);
        }
    });

    /**
     * Receiving Roomdetails
     * @event
     */
    this.socket.on('room_detail', function (data) {
        self.roomDetail = data;
        self.pin = data.pin;
        self.events.publish('room_detail', data);

        //log.debug('RoomDetails received:');
        log.dir(data);
    });

    /**
     * Print out errors
     * @event
     */
    this.socket.on('error', function(data) {
        if (data.type === 'warning') {
            log.warn(data.msg);
        } else {
            log.error(data.msg);
        }
        if (data.trace) {
            log.dir(data.trace);
        }
    });

    /**
     * Print out Servermessages
     * @event
     */
    this.socket.on('message', function(data) {
        log.debug('Incoming message:' + data.msg);
        self.msg(data.msg);
    });

    /**
     * Receive an invite for a room
     * If the received pin = 0 a new random room will be created
     * Else join the the room with the received pin
     * @event
     */
    this.socket.on('room_invite', function (data) {

        log.debug('Room invite received: PIN: #' + data.pin);

        if (data.pin === 0) {
            log.debug('Create new random Room.');

            var theme = self.getRandomTheme();
            log.debug('Random Theme: ' + theme);

            self.newRoom(theme, data.options, false, false);
            self.events.publish('new_room', data);

        } else {
            if (!obacht.currentGame) {
                log.debug('Joining Room ' + data.pin);
                self.joinRoom(data.pin, data.closed);
                self.events.publish('join_room', data);
            } else {
                log.warn('MultiplayerService: Received Room Invite when already in a Game!');
            }
        }

    });

    /**
     * No Match was found -> Create a new room
     * @event
     */
    this.socket.on('no_match_found', function () {
        log.debug('No Match found.');
        this.newRoom();
        self.events.publish('no_match_found');
    });

    /**
     * Game is ready
     * @event
     */
    this.socket.on('game_ready', function () {
        log.debug('Game is ready! ' + self.roomDetail.creatingPlayerId + ' vs. ' + self.roomDetail.creatingPlayerId);

        // Set Enemy PID
        if (self.roomDetail.creatingPlayerId === self.pid) {
            self.enemy = self.roomDetail.joiningPlayerId;
        } else {
            self.enemy = self.roomDetail.creatingPlayerId;
        }

        // Set Friend if playing closed Game
        if (self.roomDetail.closed) {
            if (self.roomDetail.creatingPlayerId === self.pid) {
                self.friend = self.roomDetail.joiningPlayerId;
            } else {
                self.friend = self.roomDetail.creatingPlayerId;
            }
        }

        self.events.publish('game_ready');
    });

    /**
     * Player took an action
     * @event
     */
    this.socket.on('player_action', function (data) {
        data.data.distance += obacht.options.gameplay.distanceOffset;
        self.events.publish('enemy_player_action', data);
    });

    /**
     * Players Health Status (from both Players)
     * @event
     */
    this.socket.on('player_health', function (data) {
        self.events.publish('player_health', data);
    });

    /**
     * Receives a bonus to show it within the reactionbox
     * @event
     */
    this.socket.on('bonus', function (data) {
        //log.debug('bonus: ' + data.type);
        self.events.publish('bonus', data.type);
    });

    /**
     * Sorts out if the player gets the bonus
     * @event
     */
    this.socket.on('receive_bonus', function (data) {
        if (data.winner_pid === self.pid) {
//            log.debug('You won Bonus: ' + data.type);
            self.events.publish('receive_bonus', data.type, true);
        } else {
//            log.debug('You lost Bonus: ' + data.type);
            self.events.publish('receive_bonus', data.type, false);
        }
    });

    /**
     * Receives a trap
     * @event
     */
    this.socket.on('trap', function (data) {
        //log.debug('Trap received: ' + data.type);
        if (data.target === self.pid) {
//            log.debug('Trap on bottom world: ' + data.type);
            self.events.publish('bottom_trap', data);
        } else {
//            log.debug('Trap on top world: ' + data.type);
            data.data.distance += obacht.options.gameplay.distanceOffset;
            self.events.publish('top_trap', data);
        }
    });

    /**
     * Shows that the game is over and who won the game
     * @event
     */
    this.socket.on('game_over', function (data) {
        log.debug('Game over! -> ' + data.reason);
        if (data.pid === self.pid){
            log.debug('Game Over! YOU LOSE!');
        } else {
            log.debug('Game Over! YOU WIN');
        }
        self.events.publish('game_over', data);
    });

    /**
     * Get room data for debugging
     * @event
     */
    this.socket.on('get_rooms', function (data) {
        log.debug('Getting Rooms Data (Debugging)');
        log.dir(data);
    });

    /**
     * Socket.io Disconnect Event
     * @event
     */
    this.socket.on('disconnect', function() {
        self.connected = false;
        log.warn('DISCONNECTED');
//        obacht.showPopup('mainMenuScene', 'Disconnected from server.');

        // Try to connect again:
        obacht.mp.socket.socket.connect();
    });

};


//////////////////////////////
// Communication Functions  //
//////////////////////////////

obacht.MultiplayerService.prototype = {

    /**
     * Broadcast Message
     *
     * @param {String} msg Text of the message
     */
    msg: function (msg) {
        "use strict";
        log.debug('>> showPopup()');
        obacht.showPopup('mainMenuScene', msg);
    },

    /**
     * Broadcast New Room
     *
     * @param {String} theme    Theme of the new world
     * @param {Object} options  Options for the world, i.e. rotationspeed
     * @param {String} closed   Indicator if room is privat or public
     * @param {String} friend   Optional Friend PID, if playing with a specific friend
     */
    newRoom: function (theme, options, closed, friend) {
        "use strict";
        log.debug('>> newRoom()');

        if (!this.connected) {
            log.error('newRoom(): Not connected to a server!');
            obacht.showPopup('mainMenuScene', 'Not connected to a server!');
        } else {
            var roomDetails = {
                theme: theme,
                options: options,
                closed: closed,
                creatingPlayerHealth: obacht.options.player.general.maxHealth,
                joiningPlayerHealth: obacht.options.player.general.maxHealth
            };

            if (friend) {
                roomDetails.friend = friend;
            }

            this.socket.emit('new_room', roomDetails);
        }
    },

    /**
     * Broadcast Join Room
     *
     * @param {Number} pin Code for joining into the room
     * @param {String} closed Indicator if Room is privat or public
     */
    joinRoom: function(pin, closed) {
        "use strict";

        if (!this.connected) {
            log.error('joinRoom(): Not connected to a server!');
            obacht.showPopup('mainMenuScene', 'Not connected to a server!');
        } else {
            log.debug('>> joinRoom(' + pin + ')');
            this.socket.emit('join_room', {
                pin: pin,
                closed: closed
            });
        }
    },

    /**
     * Broadcast Find Match
     */
    findMatch: function () {
        "use strict";

        if (!this.connected) {
            log.error('findMatch(): Not connected to a server!');
            obacht.showPopup('mainMenuScene', 'Not connected to a server!');
        } else {
            log.debug('>> findMatch()');
            this.socket.emit('find_match');
        }

    },

    /**
     * Broadcast Find Match
     */
    inviteFriend: function (pid, roomDetail) {
        "use strict";
        log.debug('>> Inviting Friend for new Match');
        this.socket.emit('invite_player', pid, roomDetail);
    },

    /**
     * Broadcast Player Ready
     */
    playerReady: function () {
        "use strict";
        log.debug('>> playerReady()');
        this.socket.emit('player_ready');
    },

    /**
     * Broadcast Player Action
     *
     * @param  {String} action Action of Player, i.e. 'jump'
     * @param  {Object} data ActionData
     */
    playerAction: function(action, data) {
        "use strict";
        if (obacht.currentGame) {
            data.distance = obacht.currentGame.getDistance;
            this.socket.emit('player_action', {
                action: action,
                data: data
            });
        }
    },

    /**
     * Broadcast Player Status
     *
     * @param  {String} pid     Player-ID
     * @param  {Number} health    Healthstatus
     */
    playerStatus: function (pid, health) {
        "use strict";
        this.socket.emit('player_status', {
            pid: pid,
            health: health
        });
    },

    /**
     * Broadcast Throw Bonus
     *
     * @param  {String} type Type of the Bonus, i.e. 'snake'
     */
    throwBonus: function (type) {
        "use strict";
        this.socket.emit('bonus', {
            type: type
        });
    },

    /**
     * Broadcast Throw Trap
     *
     * @param {String} type Type of the Trap
     * @param {Object} target Indicates which player receives the Trap
     */
    throwTrap: function(type, target) {
        "use strict";

        var self = this;

        if (obacht.currentGame) {
            self.socket.emit('trap', {
                type: type,
                target: target,
                data: {
                    distance: obacht.currentGame.getDistance()
                }
            });
        }

    },

    /**
     * Broadcast Check Reactiontime
     *
     * @param  {String} type Type of the Bonus, i.e. 'snake'
     * @param  {Number} reaction_time Time the player needed to push the reactionbutton in milliseconds
     */
    checkReactiontime: function (type, reaction_time) {
        "use strict";
        this.socket.emit('check_reactiontime', {
            type: type,
            reaction_time: reaction_time
        });
    },

    /**
     * Broadcast Leave Room
     */
    leaveRoom: function() {
        "use strict";
        log.debug('>> leaveRoom()');
        this.pin = false;
        this.socket.emit('leave_room');
    },

    /**
     * Debugging Function
     */
    getRooms: function() {
        "use strict";
        log.debug('>> getRooms()');
        this.socket.emit('get_rooms', '');
    },

    /** Send Debug Message from Client to Server for easy Debugging */
    sendDebugMessage: function(type, msg) {
        "use strict";
        this.socket.emit('debug_message', type, msg);
    },

    pingPong: function(count) {
        "use strict";
        var self = this;
        var counter = 0;
        var now = new Date().getTime();
        var interval = setInterval(function() {
            var now = new Date().getTime();
            self.socket.emit('ping', now);
            if (counter >= count) {
                clearInterval(interval);
            }
            counter += 1;
        }, 200);

        this.socket.on('pong', function (time) {
            var now = new Date().getTime();
            var diff = now - time;
            log.info('PingPong Time: ' + diff + 'ms');
        });
    },

    //////////////////////////////
    // Helper Functions         //
    //////////////////////////////


    /**
     * Broadcast Get Random Theme
     *
     * @returns {String} theme Theme for the Random World
     */
    getRandomTheme: function() {
        "use strict";
        var availableThemes = Object.keys(obacht.themes);
        var rand = Math.floor(availableThemes.length * Math.random());
        return availableThemes[rand];
    },

    /**
     * Broadcast Reset Events
     */
    resetEvents: function() {
        "use strict";
        this.events = new goog.pubsub.PubSub();
    },

    /**
     * Destructor
     */
    destruct: function() {
        "use strict";

        this.socket.disconnect();
    }
};










