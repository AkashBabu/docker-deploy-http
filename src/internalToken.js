import shortid from 'shortid';
import path from 'path';
import fs from 'fs';

const INT_TOKEN_PATH = path.join(__dirname, '../.int_token');

function saveInternalToken(token) {
    const ws = fs.createWriteStream(INT_TOKEN_PATH);
    ws.write(token);
    ws.end();
}

export function GenerateInternalToken() {
    // Unique internal token - Used in MQTT Topic during health check
    const INT_TOKEN = shortid.generate();

    // Save the generated token such that Health Check can use the same
    saveInternalToken(INT_TOKEN);

    return INT_TOKEN;
}


export function GetInternalToken() {
    return fs.readFileSync(INT_TOKEN_PATH);
}
