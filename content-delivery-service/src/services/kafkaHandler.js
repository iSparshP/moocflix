const { consumeMessages } = require('../utils/kafka');
const Video = require('../models/Video');

const handleIncomingMessage = async (topic, message) => {
    switch (topic) {
        case 'Student-Enrolled':
            // Handle student enrollment logic
            break;
        case 'Transcoding-Completed':
            // Handle transcoding completed logic
            const { videoId, transcodedUrl } = message;
            await Video.update(
                { url: transcodedUrl },
                { where: { id: videoId } }
            );
            break;
        default:
            console.log(`Unhandled topic: ${topic}`);
    }
};

const initializeKafkaConsumer = () => {
    consumeMessages(
        ['Student-Enrolled', 'Transcoding-Completed'],
        handleIncomingMessage
    );
};

module.exports = { initializeKafkaConsumer };
