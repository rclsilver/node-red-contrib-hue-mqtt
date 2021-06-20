module.exports = function (RED) {
    function HueMotion(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueMotionMessage } = require("./utils/messages");

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({
                fill: "red",
                shape: "ring",
                text: "hue-motion.node.not-configured",
            });
            return false;
        }

        node.updateStatus = (sensor) => {
            if (!config.sensor || config.sensor == sensor.id) {
                const msg = new HueMotionMessage(sensor).msg;
                node.send(msg);

                if (config.sensor) {
                    if (msg.payload.active) {
                        if (msg.payload.motion) {
                            node.status({
                                fill: "green",
                                shape: "dot",
                                text: "hue-motion.node.motion-detected",
                            });
                        } else {
                            node.status({});
                        }
                    } else {
                        node.status({
                            fill: "red",
                            shape: "ring",
                            text: "hue-motion.node.disabled",
                        });
                    }
                } else {
                    node.status({});
                }
            }
        };

        node.resetStatus = (delay) => {
            if (node.resetStatusTimeout) {
                clearTimeout(node.resetStatusTimeout);
            }
            node.resetStatusTimeout = setTimeout(() => {
                node.resetStatusTimeout = undefined;
                node.status({});
            }, delay);
        };

        node.on("input", (msg, send, done) => {
            if ("payload" in msg) {
                var enabled;
                var sensor;
                var sensorName;

                if (typeof msg.payload === "boolean") {
                    enabled = msg.payload;
                } else if (typeof msg.payload === "object") {
                    if ("enabled" in msg.payload) {
                        enabled = msg.payload.enabled;
                    }

                    if ("sensor" in msg.payload) {
                        sensor =
                            typeof msg.payload.sensor === "number"
                                ? msg.payload.sensor.toString()
                                : msg.payload.sensor;
                    }

                    if (msg.payload.sensorName !== undefined) {
                        sensorName = msg.payload.sensorName;
                    }
                }

                if (sensor && config.sensor && sensor != config.sensor) {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "hue-motion.node.cannot-override-sensor",
                    });
                    node.resetStatus(3000);
                } else {
                    if (!sensor) {
                        sensor = config.sensor;
                    }

                    if (!sensor) {
                        bridge.client.sensors.getAll().then((sensors) => {
                            sensors
                                .filter(
                                    (sensor) => sensor.type === "ZLLPresence"
                                )
                                .filter((sensor) => sensor.config.on != enabled)
                                .forEach((sensor) => {
                                    if (
                                        sensorName &&
                                        sensorName.toLowerCase() !=
                                            sensor.name.toLowerCase()
                                    ) {
                                        return false;
                                    }

                                    sensor.config.on = enabled;

                                    bridge.client.sensors
                                        .save(sensor)
                                        .then((sensor) => {
                                            if (sensor.config.on) {
                                                node.debug(
                                                    `Sensor ${sensor.name} (${sensor.id}) enabled`
                                                );
                                            } else {
                                                node.debug(
                                                    `Sensor ${sensor.name} (${sensor.id}) disabled`
                                                );
                                            }

                                            bridge.sendDeviceUpdate(
                                                "sensor",
                                                sensor
                                            );
                                        })
                                        .catch((error) => {
                                            node.error(
                                                `Error while changing state of ${sensor.name}: ${error}`
                                            );
                                        });
                                });
                        });
                    } else {
                        bridge.client.sensors
                            .getById(sensor)
                            .then((sensor) => {
                                if (sensor.config.on != enabled) {
                                    sensor.config.on = enabled;
                                    return bridge.client.sensors.save(sensor);
                                } else {
                                    return new Promise((resolve) =>
                                        resolve(sensor)
                                    );
                                }
                            })
                            .then((sensor) => {
                                if (sensor.config.on) {
                                    node.debug(
                                        `Sensor ${sensor.name} (${sensor.id}) enabled`
                                    );
                                } else {
                                    node.debug(
                                        `Sensor ${sensor.name} (${sensor.id}) disabled`
                                    );
                                }

                                bridge.sendDeviceUpdate("sensor", sensor);

                                if (done) {
                                    done();
                                }
                            })
                            .catch((error) => {
                                node.status({
                                    fill: "red",
                                    shape: "ring",
                                    text: error,
                                });

                                if (done) {
                                    done(error);
                                }
                            });
                    }
                }
            }
        });

        bridge.events.on("initial", (cache) => {
            if ("sensor" in cache) {
                cache.sensor
                    .filter((sensor) => sensor.type === "ZLLPresence")
                    .forEach((sensor) => node.updateStatus(sensor));
            }
        });

        bridge.events.on("ZLLPresence", (sensor) => {
            node.updateStatus(sensor);
        });
    }

    RED.nodes.registerType("hue-motion", HueMotion);
};
