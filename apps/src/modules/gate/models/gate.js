const { ObjectId } = require('mongodb');

class Gate {
    constructor({ _id = null, title, journey, stages = [], sortOrder = 0, createdAt = new Date() }) {
        this._id = _id;
        this.title = title;
        this.journey = journey;
        this.stages = stages;
        this.sortOrder = sortOrder;
        this.createdAt = createdAt;
    }

    static validate(doc) {
        const errors = [];
        if(!doc.title || doc.title.trim() === '') {
            errors.push('Title is required');
        }
        if(!doc.journey) {
            errors.push('Journey is required');
        }
        if(doc.stages && !Array.isArray(doc.stages)) {
            errors.push('Stages must be an array');
        }
        return errors;
    }

    static buildDocument(data) {
        return {
            title: data.title,
            journey: new ObjectId(data.journey || data.journeyId),
            stages: data.stages || [],
            sortOrder: data.sortOrder || 0,
            createdAt: new Date()
        };
    }

    addStage(stageId) {
        if(!this.stages.includes(stageId)) {
            this.stages.push(new ObjectId(stageId));
        }
    }

    removeStage(stageId) {
        this.stages = this.stages.filter(s => s.toString() !== stageId.toString());
    }
}

module.exports = Gate;