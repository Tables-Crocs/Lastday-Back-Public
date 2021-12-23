## Set up

* Install dependencies

```bash
npm i
```

## Running the server

* Run the server

``` bash
npm run start:dev
# port is open on 8000
```

* Open API UI

Go to https://localhost:8000/api/docs

## Running with docker env

``` bash
## access to docker is defaulted to using "sudo"
bash dev-env.sh [image_name] [new]

# if it is the first time,
bash dev-env.sh lastday:dev new

# if you already have the docker image set up (for example, lastday:dev)
bash dev-env.sh lastday:dev
```

### Versions in docker env

```bash
npm version
>>> v16.8.0
node version
>>> 7.21.0
```
