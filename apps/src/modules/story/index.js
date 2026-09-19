const { createStoryController } = require('./controllers/storyController');
const StoryService = require('./services/storyService');
const StoryImageService = require('./services/storyImageService');
const StoryRepository = require('./repositories/storyRepository');

module.exports = {
    createStoryController,
    StoryService,
    StoryImageService,
    StoryRepository
};
