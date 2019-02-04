# docker-deploy-http
HTTP Hook for automated deployment of images to docker-swarm

## Usage

#### Config
`config.json` (docker config)
```JSON
{
  "registry": "registry.gitlab.com",
  "deployments": {
    "production": {
      "<docker registry user name>/<docker image name>": {
        "service": "hello world"
      }
    }
  }
}
```

#### Secrets 
`docker_creds.json` (docker secret)
```JSON
{
  "user": "<docker registry user name>",
  "pass": "<docker registry password>"
}
```

`secret.txt` (docker secret)
```text
awe5tqwiguy9qh49th9rhfuqwdfv980
```

#### Volume bind
/var/run/docker.sock:/var/run/docker.sock

#### Environment Variables    
ENV=\<deployment environment name>  
PORT=\<port> (*defaults to 9000*)

#### Publish Port
<exposed port>:<container port> 

# Roadmap
- [ ] Documentation
- [ ] Notification support
- [ ] Add hook support after deployment
- [ ] Design a way to check if any images has been updated on every restart
- [ ] Support passing options to docker service via config
- [ ] Support aborting previous deployment ON new pipeline event