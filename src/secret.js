import path from 'path';
import fs from 'fs';

function getSecret(secretPath) {
    const secret = fs.readFileSync(secretPath, 'utf-8');
    return secret.replace(/\n/g, '').trim();
}

export const DOCKER_USER = getSecret(path.join(__dirname, '../docker_user.txt'));
export const DOCKER_PASS = getSecret(path.join(__dirname, '../docker_pass.txt'));
export const DDM_TOKEN = getSecret(path.join(__dirname, '../ddm_token.txt'));
