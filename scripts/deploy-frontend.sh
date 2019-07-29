#!/bin/sh

# deploy frontend
# deploy-frontend.sh ENVIRONMENT
# Environment is staging or production
# Creates service panvala-frontend-${ENVIRONMENT}
set -u
set -e

. scripts/helpers.sh


# Deploy
deploy() {
    ENVIRONMENT=$1
    TAG=$(get_image_tag panvala/frontend)
    REPO="$(get_image_registry)/panvala/frontend"
    APP="panvala-frontend"

    HOST=${API_HOST}
    PANVALA_ENV=${ENVIRONMENT}

    # HACK: if staging, use a different variable
    if [ "${ENVIRONMENT}" = "staging" ]
    then
       HOST=${STAGING_API_HOST}
    fi

    # NOTE: current prod environment has namespace development
    if [ "${ENVIRONMENT}" = "development" ]
    then
        PANVALA_ENV=production
    fi

    helm upgrade --install \
        --namespace ${ENVIRONMENT} \
        --set environment=${ENVIRONMENT} \
        --set panvala_env=${PANVALA_ENV} \
        --set image.tag=${TAG} \
        --set image.repository=${REPO} \
        --set service.type=LoadBalancer \
        --set apiHost=${HOST} \
        --set nameOverride="${APP}" \
        --set fullnameOverride="${APP}" \
        "${APP}-${ENVIRONMENT}" \
        ./charts/${APP}
}

deploy $1
