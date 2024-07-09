class EventBus {
    constructor() {
        if (!EventBus.instance) {
            this.listeners = {};
            EventBus.instance = this;
        }
        return EventBus.instance;
    }

    on(event, listener, priority = 0) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push({ listener, priority });
        this.listeners[event].sort((a, b) => b.priority - a.priority);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            for (const { listener } of this.listeners[event]) {
                listener(data);
            }
        }
    }
}

const instance = new EventBus();
Object.freeze(instance);

export default instance;
