const events = require("events");

module.exports = class {
    constructor(interval, callback) {
        this.enabled = false;
        this.next = null;
        this.interval = interval;
        this.callback = callback;
        this.events = new events.EventEmitter();
    }

    start() {
        if (!this.enabled) {
            this.enabled = true;
            this.next = setTimeout(() => this.execute(), this.interval);
        }
        this.events.emit("started");
    }

    stop() {
        if (this.next) {
            clearTimeout(this.next);
            this.next = null;
        }
        if (this.enabled) {
            this.enabled = false;
        }
        this.events.emit("stopped");
    }

    execute() {
        if (this.next) {
            clearTimeout(this.next);
            this.next = null;
        }

        this.callback()
            .then(() => {
                this.events.emit("success");
            })
            .catch((error) => {
                this.events.emit("error", error);
            })
            .finally(() => {
                if (this.enabled) {
                    this.next = setTimeout(() => this.execute(), this.interval);
                }
            });
    }

    on(event, cb) {
        this.events.on(event, cb);
    }
};
