module.exports = function (RED) {
    function HueMqttIn(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const hueUtils = require("./utils/hue");
        const moment = require("moment");
        const { MessageFactory } = require("./utils/messages");

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({
                fill: "red",
                shape: "ring",
                text: "hue-mqtt-in.node.not-configured",
            });
            return false;
        }

        this.on("input", function (msg, send, done) {
            const message = hueUtils.parseMqttMessage(msg);

            if (
                message &&
                (message.device.type !== "group" ||
                    message.device.id_v1 !== "0")
            ) {
                const useCache =
                    message.device.type !== "group" &&
                    message.type !== "button";

                // Ignore inital_press on switches
                if (message.type === "button") {
                    if (
                        message.attributes &&
                        message.attributes.button &&
                        message.attributes.button.last_event === "initial_press"
                    ) {
                        return;
                    }
                }

                bridge
                    .getDeviceById(
                        message.device.type,
                        message.device.id_v1,
                        useCache
                    )
                    .then((device) => {
                        if (message.type === "zigbee_connectivity") {
                            if (
                                message.attributes.status ===
                                "connectivity_issue"
                            ) {
                                node.debug(
                                    `Device ${message.device.type} #${message.device.id_v1} is unreachable`
                                );
                                device.state.attributes.reachable = false;
                            } else {
                                node.debug(
                                    `Device ${message.device.type} #${message.device.id_v1} is back`
                                );
                                device.state.attributes.reachable = true;
                            }
                        }

                        if (message.device.type === "light") {
                            if (message.attributes.on) {
                                device.state.attributes.on =
                                    message.attributes.on.on;
                            }

                            if (message.attributes.color) {
                                device.state.attributes.xy =
                                    message.attributes.color.xy;
                            }

                            if (message.attributes.color_temperature) {
                                if (
                                    message.attributes.color_temperature.mirek
                                ) {
                                    device.state.attributes.ct =
                                        message.attributes.color_temperature.mirek;
                                }
                            }

                            if (message.attributes.dimming) {
                                device.state.attributes.bri =
                                    (message.attributes.dimming.brightness /
                                        100.0) *
                                    254.0;
                            }
                        } else if (message.device.type === "sensor") {
                            if (message.type === "motion") {
                                if (message.attributes.motion) {
                                    device.state.attributes.attributes.presence =
                                        message.attributes.motion.motion;
                                }
                            }
                        }

                        const msg = MessageFactory.fromDevice(
                            message.device.type,
                            device
                        );

                        if (msg) {
                            send(msg.msg);
                        }

                        node.status({
                            fill: "green",
                            shape: "dot",
                            text: moment().local().format(),
                        });

                        bridge.sendDeviceUpdate(message.device.type, device);

                        if (done) {
                            done();
                        }
                    })
                    .catch((error) => {
                        node.error(error);

                        if (done) {
                            done(error);
                        }
                    });
            } else {
                if (done) {
                    done();
                }
            }
        });
    }

    RED.nodes.registerType("hue-mqtt-in", HueMqttIn);
};
