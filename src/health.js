// import axios from 'axios'


import http from 'http';
import CONFIG from './config';
import logger from './logger';

function healthCheck() {
    const req = http.request(`http://localhost:${CONFIG.PORT}`, {
        method  : 'GET',
        path    : '/health',
        headers : {
            'Content-Type': 'application/json',
        },
    }, res => {
        let body = '';

        res.setEncoding('utf8');
        res.on('data', d => body += d);

        res.on('end', () => {
            logger.debug('body:', body);

            if (body === 'GREEN') {
                process.exit(0);
            }

            logger.warn('Unexpected body:', body);
            process.exit(1);
        });

        res.on('error', err => {
            logger.error('Failed Health check:', err);
            process.exit(1);
        });
    });

    req.end();
}

healthCheck();
