const idRegex = /^\/(.+)s\/([0-9]+)$/;

module.exports = {
    parseMqttMessage: function (msg) {
        if (msg.payload.data) {
            if (msg.payload.data[0].data) {
                const event = msg.payload.data[0].data[0];
                const idMatch = event.id_v1.match(idRegex);

                if (idMatch) {
                    const device = {
                        device: {
                            type: idMatch[1],
                            id_v1: idMatch[2],
                            id: event.id,
                        },
                        type: event.type,
                        attributes: {},
                    };

                    Object.keys(event).filter(key => {
                        return ['id', 'id_v1', 'type'].indexOf(key) === -1;
                    }).forEach(key => {
                        device.attributes[key] = event[key];
                    });

                    return device;
                }
            }
        }
    }
};
