import fs from 'fs';
import path from 'path';

import config from '../config.json';
import dockerCreds from '../docker_creds.json';


const CONFIG = {
    PORT   : process.env.PORT || 9000,
    SECRET : fs.readFileSync(path.join(__dirname, '../secret.txt'), {
        encoding: 'utf-8',
    }),
    REGISTRY     : config.registry,
    DEPLOYMENTS  : config.deployments,
    DOCKER_CREDS : {
        USER : dockerCreds.user,
        PASS : dockerCreds.pass,
    },
};

export default CONFIG;
