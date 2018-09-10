import tracer from 'tracer';

const logger = tracer.colorConsole({
    level  : process.env.LOG_LEVEL || 'info',
    format : '[docker-deploy-mqtt] | {{timestamp}} <{{title}}> ({{file}}:{{line}}) -> {{message}} ',
});

export default logger;
