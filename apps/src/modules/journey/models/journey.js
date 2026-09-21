const { ObjectId } = require('mongodb');

class Journey {
    constructor({ _id = null, title, gates = [], createdAt = new Date() }) {
        this._id = _id;
        this.title = title;
        this.gates = gates;
        this.createdAt = createdAt;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if(doc.gates && !Array.isArray(doc.gates)) {
            errors.push('Gates must be an array');
        }
        return errors;
    }

    static buildDocument(data) {
        return {
            title: data.title,
            gates: data.gates || [],
            createdAt: new Date()
        };
    }

    addGate(gateId) {
        if (!this.gates.includes(gateId)) {
            this.gates.push(new ObjectId(gateId));
        }
    }

    removeGate(gateId) {
        this.gates = this.gates.filter(g => g.toString() !== gateId.toString());
    }
}

module.exports = Journey;