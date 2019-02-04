import tracer from 'tracer';

const logger = tracer.colorConsole({
    level  : process.env.LOG_LEVEL || 'debug',
    format : '[docker-deploy-http] | {{timestamp}} <{{title}}> ({{file}}:{{line}}) -> {{message}} ',
});

export default logger;
