import matcher from 'matcher';
import child_process from 'child_process';
import { REGISTRY, DEPLOYMENTS } from './config';
import { ENV } from './env';
import logger from './logger';
import { DOCKER_USER, DOCKER_PASS } from './secret';

let dockerCommand;
getDockerCmd();

/**
 * Parse Deployment Configuration for the given ENV
 */
const registeredImages = (function () {
    const deployments = DEPLOYMENTS[ENV];
    return Object.entries(deployments).reduce((regImages, [image, config]) => {
        const [name, tag = 'latest'] = image.split(':');

        if (!regImages[name]) regImages[name] = {};

        regImages[name][tag] = config;
        return regImages;
    }, {});
}());

/**
 * Get Configurations matching the given image
 * @param {string} name Docker Image Name
 * @param {string} tag Docker Image Tag
 *
 * returns {object}
 */
function getImageConfig(name, tag) {
    if (registeredImages[name]) {
        const [, config = null] = Object.entries(registeredImages[name]).find(([_tag]) => matcher.isMatch(tag, _tag)) || [];
        return config;
    }
    return null;
}

/**
 * Executes the given command in the shell and optionally returns the response
 * @param {string} cmd Command to execute
 * @param {boolean} getReply Whether or not to return `stdout`
 */
async function exec(cmd, getReply = false) {
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (err, stdout) => {
            if (err) return reject(err);
            resolve(getReply ? stdout : undefined);
        });
    });
}

/**
 * Get Docker command using `which docker`
 */
async function getDockerCmd() {
    const whichDockerCmd = 'which docker';
    const reply = await exec(whichDockerCmd, true) || '';
    const dockerCmd = reply.replace('\n', '').trim();
    if (!dockerCmd) throw Error('Docker command not found!!');
    dockerCommand = dockerCmd;

    logger.debug('DockerCmd:', dockerCommand);
    logger.debug('Docker version check:', await exec(`${dockerCommand} version`, true));
}

/**
 * Login into Docker Registry
 */
function dockerLogin() {
    const loginCmd = `echo ${DOCKER_PASS} | ${dockerCommand} login ${REGISTRY} -u "${DOCKER_USER}" --password-stdin`;
    return exec(loginCmd);
}

/**
 * Pulls/refreshes the given image from Docker Registry
 * @param {string} image Docker Image:tag
 */
function dockerPullImage(image) {
    const pullCmd = `${dockerCommand} pull ${REGISTRY}/${image}`;
    return exec(pullCmd);
}

/**
 * Updates the running service with the new image
 * @param {string} image New Docker Image
 * @param {string} config.service Service to be updated
 */
function dockerUpdateService(image, { service }) {
    const serviceUpdateCmd = `${dockerCommand} service update ${service} --force --with-registry-auth --image=${REGISTRY}/${image}`;
    return exec(serviceUpdateCmd);
}


export async function DeployHandler(_client, _topic, message) {
    const { name, tag = 'latest' } = message;
    const config = getImageConfig(name, tag);
    const image = `${name}:${tag}`;
    if (!config) {
        logger.warn(`WARN: ${image} does not have any CONFIG set in the Environment: ${ENV}, hence will not be deployed`);
        return false;
    }

    logger.info(`Running deployment of image: ${image}`);

    try {
        dockerCommand || await getDockerCmd();
        await dockerLogin(DOCKER_USER, DOCKER_PASS);
        logger.debug(`Docker login into ${REGISTRY} is successfull.`);
        await dockerPullImage(image);
        logger.debug(`Successfully pulled latest version of ${image} from ${REGISTRY}`);
        await dockerUpdateService(image, config);
        logger.info(`Successfully deployed "${image}" with config: ${JSON.stringify(config)}`);
    } catch (err) {
        logger.error(`Failed to deploy image: "${image}" with config: ${JSON.stringify(config)}, due to:`, err);
    }
}
