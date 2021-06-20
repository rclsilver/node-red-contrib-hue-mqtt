const HueBrightnessMessage = require("./hue-brightness");
const HueGroupMessage = require("./hue-group");
const HueLightMessage = require("./hue-light");
const HueMotionMessage = require("./hue-motion");
const HueSwitchMessage = require("./hue-switch");
const HueTemperatureMessage = require("./hue-temperature");

class MessageFactory {
    static fromDevice(type, device) {
        if (type === "group") {
            return new HueGroupMessage(device);
        } else if (type === "sensor") {
            if (device.type === "ZLLPresence") {
                return new HueMotionMessage(device);
            } else if (device.type === "ZLLTemperature") {
                return new HueTemperatureMessage(device);
            } else if (device.type === "ZLLLightLevel") {
                return new HueBrightnessMessage(device);
            } else if (device.type === "ZLLSwitch") {
                return new HueSwitchMessage(device);
            }
        } else if (type === "light") {
            return new HueLightMessage(device);
        }

        console.log(`Factory: ${type}`);
        console.log(JSON.stringify(device));
        console.log("");
    }
}

module.exports.HueBrightnessMessage = HueBrightnessMessage;
module.exports.HueGroupMessage = HueGroupMessage;
module.exports.HueLightMessage = HueLightMessage;
module.exports.HueMotionMessage = HueMotionMessage;
module.exports.HueSwitchMessage = HueSwitchMessage;
module.exports.HueTemperatureMessage = HueTemperatureMessage;
module.exports.MessageFactory = MessageFactory;
