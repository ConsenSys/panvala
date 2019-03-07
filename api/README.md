# Panvala API

Make sure the following environment variables are set:

- RPC_ENDPOINT
- GATEKEEPER_ADDRESS
- TOKEN_CAPACITOR_ADDRESS

Optional variables:

- IPFS_HOST
- IPFS_PORT

```shell
yarn start
# optionally start with a different port
PORT=5001 yarn start
```

Use something like [HTTPie](https://httpie.org/) to make requests with the example data:

```shell
# add proposals to the database
http POST localhost:5001/api/proposals < data/1-proposal.json
http POST localhost:5001/api/proposals < data/2-proposal.json

# get the list of proposals
http localhost:5001/api/proposals
```
