import matcher from 'matcher';
import child_process from 'child_process';
import CONFIG from './config';
import { ENV } from './env';
import logger from './logger';
// import { DOCKER_USER, DOCKER_PASS } from './secret';

let dockerCommand;
getDockerCmd();

/**
 * Parse Deployment Configuration for the given ENV
 */
const registeredImages = (function () {
    const deployments = CONFIG.DEPLOYMENTS[ENV];
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
function getImageConfig(name, tag = 'latest') {
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
    logger.debug('Executing:', cmd);
    return new Promise((resolve, reject) => {
        child_process.exec(cmd, (err, stdout, stderr) => {
            logger.debug(stdout);
            logger.error(stderr);

            if (err) {
                return reject(err);
            }
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
 * @param {String} registry Docker Registry
 * @param {String} user Docker Registry username
 * @param {String} pass Docker Registry password
 */
function dockerLogin(registry, user, pass) {
    const loginCmd = `echo ${pass} | ${dockerCommand} login ${registry} -u "${user}" --password-stdin`;
    return exec(loginCmd);
}

/**
 * Pulls/refreshes the given image from Docker Registry
 * @param {string} image Docker Image:tag
 */
function dockerPullImage(image) {
    const pullCmd = `${dockerCommand} pull ${CONFIG.REGISTRY}/${image}`;
    return exec(pullCmd);
}

/**
 * Updates the running service with the new image
 * @param {string} image New Docker Image
 * @param {string} config.service Service to be updated
 */
async function dockerUpdateService(image, { service }) {
    let result;
    try {
        const serviceUpdateCmd = `${dockerCommand} service update ${service} --force --with-registry-auth --image=${CONFIG.REGISTRY}/${image}`;
        result = await exec(serviceUpdateCmd);
    } catch (err) {
        logger.info(`docker service: "${service}" was not found, hence creating new service`);

        const serviceCreateCmd = `${dockerCommand} service create --with-registry-auth --name=${service} ${CONFIG.REGISTRY}/${image}`;
        result = await exec(serviceCreateCmd);
    }

    return result;
}


export async function DeployHandler(name, tag = 'latest') {
    const config = getImageConfig(name, tag);
    const image = `${name}:${tag}`;
    if (!config) {
        logger.warn(`WARN: ${image} does not have any CONFIG set in the Environment: ${ENV}, hence will not be deployed`);
        return false;
    }

    logger.info(`Running deployment of image: ${image}`);

    try {
        dockerCommand || await getDockerCmd();

        await dockerLogin(CONFIG.REGISTRY, CONFIG.DOCKER_CREDS.USER, CONFIG.DOCKER_CREDS.PASS);
        logger.debug(`Docker login into "${CONFIG.REGISTRY}" is successfull.`);

        await dockerPullImage(image);
        logger.debug(`Successfully pulled latest version of "${image}" from "${CONFIG.REGISTRY}"`);

        await dockerUpdateService(image, config);
        logger.info(`Successfully deployed "${image}" with config: ${JSON.stringify(config)}`);
    } catch (err) {
        logger.error(`Failed to deploy image: "${image}" with config: ${JSON.stringify(config)}, due to:`, err);
    }
}
