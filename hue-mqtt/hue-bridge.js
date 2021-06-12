module.exports = function (RED) {
    function HueBridge(config) {
        const node = this;
        const huejay = require('huejay');
        const events = require('events');
        const Poller = require('./utils/poller');
        const bridgeHostArray = (config.bridge).toString().trim().split(':');

        // Build the local cache
        node.refresh = () => {
            return new Promise((resolve, reject) => {
                node.client.lights.getAll().then(bridge_lights => {
                    node.client.sensors.getAll().then(bridge_sensors => {
                        node.client.groups.getAll().then(bridge_groups => {
                            cache.light = bridge_lights;

                            cache.sensor = bridge_sensors.filter(sensor => {
                                return [
                                    'ZLLPresence',
                                    'ZLLLightLevel',
                                    'ZLLTemperature',
                                    'ZLLSwitch',
                                ].indexOf(sensor.attributes.attributes.type) !== -1;
                            });

                            cache.group = bridge_groups;

                            resolve();
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            });
        };

        // Get device by id
        node.getDeviceById = (type, id, useCache = true) => {
            return new Promise((resolve, reject) => {
                if (useCache) {
                    let device = cache.getDevice(type, id);

                    if (device) {
                        resolve(device);
                    } else {
                        reject(`Device ${type} with id ${id} not found in cache`);
                    }
                } else {
                    node.client[type + 's'].getById(id).then(resolve).catch(`Device ${type} with id ${id} not found`);
                }
            });
        };

        // Send device update
        node.sendDeviceUpdate = (type, device) => {
            if (type === 'sensor') {
                if (['ZLLPresence', 'ZLLSwitch'].indexOf(device.type) !== -1) {
                    type = device.type;
                }
            }
            node.debug(`Event emitted with type ${type}: ${device}`);
            node.events.emit(type, device);
        }

        // Initialize the node
        node.events = new events.EventEmitter();
        node.client = new huejay.Client({
            host: bridgeHostArray[0],
            port: (bridgeHostArray > 1) ? parseInt(bridgeHostArray[1]) : 80,
            username: config.key
        });
        node.poller = new Poller(config.interval, node.refresh);

        node.poller.on('started', () => {
            node.log(`Starting polling with interval of ${node.poller.interval}ms`);
        });

        node.poller.on('stopped', () => {
            node.log('Polling disabled');
        });

        node.poller.on('success', () => {
            node.debug('Cache refreshed from the Hue bridge');
            cache.emitRefresh();
        });

        node.poller.on('error', (error) => {
            node.error(`Error while refreshing cache from the bridge: ${error}`);
        });

        // Initialize local cache
        const cache = {
            light: [],
            sensor: [],
            group: [],

            getDevice: function (type, id) {
                if (type in this) {
                    result = this[type].filter(device => {
                        return device.id === id;
                    });

                    if (result.length > 0) {
                        return result[0];
                    }
                }
            },

            emitInitial: function () {
                node.events.emit('initial', {
                    light: this.light,
                    sensor: this.sensor,
                    group: this.group,
                });
            },

            emitRefresh: function () {
                node.events.emit('refresh', {
                    light: this.light,
                    sensor: this.sensor,
                    group: this.group,
                });
            },
        };

        RED.nodes.createNode(this, config);

        // Fetch initial data from hue bridge and start poller
        this.refresh().then(() => {
            node.log('Cache initialized from the Hue bridge');
            cache.emitInitial();
        }).catch(error => {
            node.events.emit('error', error);
            node.error(`Error while initializing cache from the Hue bridge: ${error}`);
        }).finally(() => node.poller.start());

        // Stop the polling when the node is closing
        node.on('close', () => {
            node.poller.stop();
            node.events.removeAllListeners();
        });
    }

    RED.nodes.registerType('hue-bridge', HueBridge);

    // Discover bridges
    RED.httpAdmin.get('/hue/bridges', function (req, res, next) {
        let huejay = require('huejay');

        huejay.discover().then(bridges => {
            res.end(JSON.stringify(bridges));
        }).catch(error => {
            res.sendStatus(500).send(error.message);
        });
    });

    // Discover sensors
    RED.httpAdmin.get('/hue/sensors', function (req, res, next) {
        const huejay = require('huejay');
        const bridge = (req.query.bridge).toString();
        const username = req.query.key;
        const type = req.query.type;

        const client = new huejay.Client({
            host: bridge,
            username: username
        });

        client.sensors.getAll().then(sensors => {
            const result = sensors.filter(sensor => {
                return sensor.type === type;
            }).map(sensor => {
                return {
                    id: sensor.id,
                    name: sensor.name,
                };
            });

            res.end(JSON.stringify(result));
        }).catch(error => {
            res.sendStatus(500).send(error.stack);
        });
    });

    // Discover groups
    RED.httpAdmin.get('/hue/groups', function (req, res, next) {
        const huejay = require('huejay');
        const bridge = (req.query.bridge).toString();
        const username = req.query.key;

        const client = new huejay.Client({
            host: bridge,
            username: username
        });

        client.groups.getAll().then(groups => {
            const result = groups.map(group => {
                return {
                    id: group.id,
                    name: group.name,
                };
            });

            res.end(JSON.stringify(result));
        }).catch(error => {
            res.sendStatus(500).send(error.stack);
        });
    });

    // Discover lights
    RED.httpAdmin.get('/hue/lights', function (req, res, next) {
        const huejay = require('huejay');
        const bridge = (req.query.bridge).toString();
        const username = req.query.key;

        const client = new huejay.Client({
            host: bridge,
            username: username
        });

        client.lights.getAll().then(lights => {
            const result = lights.map(light => {
                return {
                    id: light.id,
                    name: light.name,
                };
            });

            res.end(JSON.stringify(result));
        }).catch(error => {
            res.sendStatus(500).send(error.stack);
        });
    });

    // Discover scenes
    RED.httpAdmin.get('/hue/scenes', function (req, res, next) {
        const huejay = require('huejay');
        const bridge = (req.query.bridge).toString();
        const username = req.query.key;

        const client = new huejay.Client({
            host: bridge,
            username: username
        });

        client.scenes.getAll().then(scenes => {
            const result = scenes.map(scene => {
                return {
                    id: scene.id,
                    name: scene.name,
                };
            });

            res.end(JSON.stringify(result));
        }).catch(error => {
            res.sendStatus(500).send(error.stack);
        });
    });
};
