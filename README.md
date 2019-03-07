# Panvala

[![CircleCI](https://circleci.com/gh/ConsenSys/panvala/tree/develop.svg?style=shield)](https://circleci.com/gh/ConsenSys/panvala/tree/develop)

Panvala wraps the existing ecosystem of grant funders, corporate open source projects and volunteers with a token that gives them all a shared incentive to find sustainable funding together.

## Run with Docker
Requirements: [Docker](https://docs.docker.com/install/) and [docker-compose](https://docs.docker.com/compose/)

### Configuration
You need to create a file `docker/postgres/postgres.env` with your database credentials. This will create a user and a database:

```shell
# docker/postgres/postgres.env
POSTGRES_USER=panvala_devel
POSTGRES_PASSWORD=password
POSTGRES_DB=panvala_api
```

Additionally, set up a file `docker/api/panvala-api.env` 

```shell
# docker/api/panvala-api.env

# Special environment for running in docker
NODE_ENV=docker

# Must match settings in postgres.env
DB_PASSWORD=password
DB_NAME=panvala_api

# Ethereum
RPC_ENDPOINT=http://localhost:7545  # Or whereever your chain is
GATEKEEPER_ADDRESS={your-deployed-gatekeeper}
TOKEN_CAPACITOR_ADDRESS={your-deployed-capacitor}

# IPFS
IPFS_HOST=ipfs.infura.io
IPFS_PORT=5001
```

### Start up the containers
```shell
cd docker
docker-compose up
```

Frontend will run on port `3001`

API/backend will run on port `5000`

If you change code, you may need to `docker-compose up --build` to rebuild the images. If you change the database credentials in `postgres.env`, you will need to delete the database data volume to see the updated changes (**this will delete all the tables!**).

### Run migrations and set up the database tables
```shell
docker exec docker_api_1 yarn migrate
```

### (Optionally) Connect to the database from the `api` container

First, attach to the container and run `bash`
```shell
docker exec -it docker_api_1 /bin/bash
```

Once you are inside, connect to the API database as your user
```shell
psql -h pg-docker -U panvala_devel -d panvala_api
```
Check your tables by typing `\dt` at the `psql` prompt.

Your output should look something like this:
```
❯ docker exec -it docker_api_1 /bin/bash
root@990dbd10c37e:/srv# psql -h pg-docker -U panvala_devel -d panvala_api
Password for user panvala_devel:
psql (10.6 (Ubuntu 10.6-0ubuntu0.18.04.1))
Type "help" for help.

panvala_api=# \dt
               List of relations
 Schema |     Name      | Type  |     Owner
--------+---------------+-------+---------------
 public | Proposals     | table | panvala_devel
 public | SequelizeMeta | table | panvala_devel
(2 rows)

panvala_api=# \q
root@990dbd10c37e:/srv# exit
```

# hit the database from the api
