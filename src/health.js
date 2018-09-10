import mqtt from 'mqtt';
import { BROKER_URL } from './config';
import { GetInternalToken } from './internalToken';
import logger from './logger';

const client = mqtt.connect(BROKER_URL);

logger.info('Starting HEALTH-Check...');

client.on('connect', () => {
    const INT_TOKEN = GetInternalToken();
    const topic = `/docker-deploy-mqtt/${INT_TOKEN}`;
    client.subscribe(`${topic}/status`, () => {
        client.publish(`${topic}`, JSON.stringify({ cmd: 'HEALTH' }));
    });
});

client.on('message', (_topic, message) => {
    logger.info('HEALTH-Check Response:', message.toString());
    process.exit(message.toString() === 'GREEN' ? 0 : 1);
});

