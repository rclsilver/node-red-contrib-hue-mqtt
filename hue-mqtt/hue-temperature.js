module.exports = function (RED) {
    function HueTemperature(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueTemperatureMessage } = require("./utils/messages");

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({
                fill: "red",
                shape: "ring",
                text: "hue-temperature.node.not-configured",
            });
            return false;
        }

        bridge.events.on("initial", (cache) => {
            node.sendUpdates(cache);
        });

        bridge.events.on("refresh", (cache) => {
            node.sendUpdates(cache);
        });

        node.sendUpdates = (cache) => {
            if (cache.sensor) {
                cache.sensor
                    .filter((sensor) => {
                        return sensor.type === "ZLLTemperature";
                    })
                    .filter((sensor) => {
                        return !config.sensor || sensor.id === config.sensor;
                    })
                    .forEach((sensor) => {
                        const msg = new HueTemperatureMessage(sensor).msg;

                        node.send(msg);

                        if (config.sensor) {
                            node.status({
                                fill: "green",
                                shape: "dot",
                                text: `${msg.payload.celsius} °C / ${msg.payload.fahrenheit} °F`,
                            });
                        } else {
                            node.status({});
                        }
                    });
            }
        };
    }

    RED.nodes.registerType("hue-temperature", HueTemperature);
};
