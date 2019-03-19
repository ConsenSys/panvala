#!/bin/sh

# initialize a namespace for our applications
# init-env.sh ENVIRONMENT
set -u
set -e

# Delete the base release
delete() {
    ENVIRONMENT=$1
    release="panvala-base-${ENVIRONMENT}"

    helm delete ${release}
}

# Install the base release
configure() {
    ENVIRONMENT=$1

    helm upgrade --install \
        --namespace ${ENVIRONMENT} \
        --set databaseExternalHost=${DATABASE_HOST} \
        --set databaseUser=${DATABASE_USER} \
        --set databasePassword=${DATABASE_PASSWORD} \
        --set nameOverride="panvala-base" \
        panvala-base-${ENVIRONMENT} \
        ./charts/panvala-base
}

configure $1
