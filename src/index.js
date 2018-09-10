import mqtt from 'mqtt';
import logger from './logger';
import { BROKER_URL } from './config';
import { DDM_TOKEN } from './secret';
import { GenerateInternalToken } from './internalToken';
import CommandHandler from './commandHandler';
import { DeployHandler } from './deployHandler';

// Initializations
const client = mqtt.connect(BROKER_URL);
const INT_TOKEN = GenerateInternalToken();

// Connect to MQTT Broker
client.on('connect', () => {
    logger.info('CLIENT is connected');

    // Test Topic
    client.subscribe('/docker-deploy-mqtt/+');

    // Subscribe to Internal-Command Request
    client.subscribe(`/docker-deploy-mqtt/${INT_TOKEN}`);

    // Subscribe to MQTT Hooks
    client.subscribe(`/docker-deploy-mqtt/${DDM_TOKEN}`);
})
.on('reconnect', () => {
    logger.warn('CLIENT is reconnecting...');
})
.on('offline', () => {
    logger.warn('CLIENT has gone OFFLINE');
})
.on('error', err => {
    logger.error('CLIENT error:', err);

    // on exit, docker swarm handles the responsibility of creating a new task
    process.exit(1);
})
.on('message', (topic, msg) => {
    logger.debug('CLIENT received Topic:', topic, 'Msg:', msg.toString());

    const [, , token] = topic.split('/');

    // Replace `'` in msg with `"`, then parse.
    // As VARIABLES within `'<var>'` will not be resolved in CI,
    // hence allowing the option to use `'` instead of `"`
    const message = JSON.parse(msg.toString().replace(/'/g, '"'));

    // If INT_TOKEN, then use CommandHandler else use DeployHandler
    token && (token === INT_TOKEN ? CommandHandler : DeployHandler)(client, topic, message);
});

