import express from 'express';

import bodyParser from 'body-parser';
import ValidateReq from './validateReq';
import { DeployHandler } from './deployHandler';
import CONFIG from './config';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
    res.status(200).send('GREEN');
});

app.post('/', (req, res) => {
    const valid = ValidateReq(req);

    // logger.debug(req.headers);
    // logger.debug(req.body);

    const image = req.body.project.path_with_namespace;

    if (!valid) return res.status(401).send('Access Denied: Token Invalid');


    DeployHandler(image, 'latest');

    res.status(200).send('Success');
});


app.listen(CONFIG.PORT, err => {
    if (err) throw err;
    console.log(`docker-deploy-http is running webhook on [PORT:${CONFIG.PORT}]`);
});
