const TOPICS = ["family", "school", "shopping", "entertainment", "hobbies", "travel"];

function selectRandomTopic() {
    const randomIndex = Math.floor(Math.random() * TOPICS.length);
    return TOPICS[randomIndex];
}

function isValidTopic(topic) {
    return TOPICS.includes(topic);
}

module.exports = { TOPICS, selectRandomTopic, isValidTopic };