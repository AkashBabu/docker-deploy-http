import CONFIG from '../ddm_config.json';

export const BROKER_URL = CONFIG.broker_url || 'mqtt://test.mosquitto.org';

export const REGISTRY = CONFIG.registry;

export const DEPLOYMENTS = CONFIG.deployments;
