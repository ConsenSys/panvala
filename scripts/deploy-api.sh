#!/bin/sh

# deploy API
# deploy-api.sh ENVIRONMENT
# Environment is development, staging or production
# Creates service panvala-api-${ENVIRONMENT}
set -u
set -e

. scripts/helpers.sh


# Deploy
deploy() {
    ENVIRONMENT=$1
    TAG=$(get_image_tag panvala/api)
    REPO="$(get_image_registry)/panvala/api"
    APP="panvala-api"

    echo "$TAG $REPO $APP"

    PANVALA_ENV=${ENVIRONMENT}

    ETH_HOST=${RPC_ENDPOINT}

    # Use specific variables for staging
    if [ "${ENVIRONMENT}" = "staging" ]
    then
        ETH_HOST=${STAGING_RPC_ENDPOINT}
    fi

    helm upgrade --install \
        --namespace ${ENVIRONMENT} \
        --set environment=${ENVIRONMENT} \
        --set panvala_env=${PANVALA_ENV} \
        --set image.tag=${TAG} \
        --set image.repository=${REPO} \
        --set service.type=LoadBalancer \
        --set web3Host="${ETH_HOST}" \
        --set autopilotApiKey="${AUTOPILOT_API_KEY}" \
        --set nameOverride="${APP}" \
        --set fullnameOverride="${APP}" \
        "${APP}-${ENVIRONMENT}" \
        ./charts/${APP}
}

deploy $1
