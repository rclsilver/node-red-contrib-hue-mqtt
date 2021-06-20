module.exports = function (RED) {
    function HueScene(config) {
        const node = this;
        const bridge = RED.nodes.getNode(config.bridge);
        const { HueGroupMessage } = require("./utils/messages");

        RED.nodes.createNode(this, config);

        if (bridge == null) {
            this.status({
                fill: "red",
                shape: "ring",
                text: "hue-scene.node.not-configured",
            });
            return false;
        } else {
            this.status({});
        }

        node.on("input", (msg, send, done) => {
            var groupPromise;
            var scenePromise;

            if (msg.payload) {
                // Group management
                if (msg.payload.groupId && msg.payload.groupName) {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "hue-scene.node.both-group-id-and-name",
                    });
                } else if (msg.payload.groupId) {
                    groupPromise = bridge.client.groups.getById(
                        typeof msg.payload.groupId === "string"
                            ? msg.payload.groupId.toString()
                            : msg.payload.groupId
                    );
                } else if (msg.payload.groupName) {
                    groupPromise = bridge.client.groups
                        .getAll()
                        .then((groups) => {
                            return new Promise((resolve, reject) => {
                                for (let group of groups) {
                                    if (
                                        group.name.toLowerCase() ===
                                        msg.payload.groupName.toLowerCase()
                                    ) {
                                        return resolve(group);
                                    }
                                }
                                return reject(
                                    "hue-scene.node.group-name-not-found"
                                );
                            });
                        });
                }

                // Scene management
                if (msg.payload.sceneId && msg.payload.sceneName) {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "hue-scene.node.both-scene-id-and-name",
                    });
                } else if (msg.payload.sceneId) {
                    scenePromise = bridge.client.scenes.getById(
                        msg.payload.sceneId
                    );
                } else if (msg.payload.sceneName) {
                    scenePromise = bridge.client.scenes
                        .getAll()
                        .then((scenes) => {
                            return new Promise((resolve, reject) => {
                                for (let scene of scenes) {
                                    if (
                                        scene.name.toLowerCase() ===
                                        msg.payload.sceneName.toLowerCase()
                                    ) {
                                        return resolve(scene);
                                    }
                                }
                                return reject(
                                    "hue-scene.node.scene-name-not-found"
                                );
                            });
                        });
                }
            }

            // Use config group if defined
            if (!groupPromise) {
                if (config.group) {
                    groupPromise = bridge.client.groups.getById(config.group);
                } else {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "hue-scene.node.no-group-id",
                    });
                }
            }

            // Use config scene if defined
            if (!scenePromise) {
                if (config.scene) {
                    scenePromise = bridge.client.scenes.getById(config.scene);
                } else {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "hue-scene.node.no-scene-id",
                    });
                }
            }

            if (groupPromise && scenePromise) {
                groupPromise
                    .then((group) => {
                        scenePromise
                            .then((scene) => {
                                node.applyScene(scene, group)
                                    .then((result) => {
                                        send(
                                            new HueGroupMessage(result, scene)
                                                .msg
                                        );
                                        node.status({
                                            fill: "green",
                                            shape: "ring",
                                            text: "hue-scene.node.applied",
                                        });

                                        // Clear status after 3 seconds
                                        if (node.clearStatusTimeout) {
                                            clearTimeout(
                                                node.clearStatusTimeout
                                            );
                                        }
                                        node.clearStatusTimeout = setTimeout(
                                            () => {
                                                node.clearStatusTimeout =
                                                    undefined;
                                                node.status({});
                                            },
                                            3000
                                        );
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

            if (done) {
                done();
            }
        });

        node.applyScene = (scene, group) => {
            group.on = true;
            group.scene = scene;
            node.debug(`Applying scene ${scene.name} on group ${group.name}`);
            return bridge.client.groups.save(group);
        };
    }

    RED.nodes.registerType("hue-scene", HueScene);
};
