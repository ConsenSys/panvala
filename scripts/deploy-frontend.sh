#!/bin/sh

# deploy frontend
# deploy-frontend.sh ENVIRONMENT
# Environment is staging or production
# Creates service panvala-api-${ENVIRONMENT}
set -u
set -e

. scripts/helpers.sh


# Deploy
deploy() {
    ENVIRONMENT=$1
    # TAG=$(get_image_tag panvala/api)
    REPO="$(get_image_registry)/panvala/frontend"
    APP="panvala-frontend"

    helm upgrade --install \
        --namespace ${ENVIRONMENT} \
        --set environment=${ENVIRONMENT} \
        --set image.tag=${TAG} \
        --set image.repository=${REPO} \
        --set service.type=LoadBalancer \
        --set apiHost=${API_HOST} \
        --set nameOverride="${APP}" \
        --set fullnameOverride="${APP}" \
        "${APP}-${ENVIRONMENT}" \
        ./charts/${APP}
}

deploy $1
