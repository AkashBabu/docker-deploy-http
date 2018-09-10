import logger from './logger';

export default function CommandHandler(client, topic, message) {
    const cmd = message.cmd;
    logger.debug(`INT_REQ -> cmd: ${cmd}`);
    switch (cmd.toUpperCase()) {
    case 'HEALTH':
        client.publish(`${topic}/status`, 'GREEN');
        break;
    default:
        logger.warn(`UNKNOWN cmd => ${cmd}`);
    }
}
