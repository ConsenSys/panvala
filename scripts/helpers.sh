#!/bin/sh
set -e
set -u

get_image_registry() {
    REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
    echo "${REGISTRY}"
}

get_image_tag() {
    TAG=${CIRCLE_SHA1:-$(git rev-parse HEAD)}
    echo "${TAG}"
}

get_image_name() {
    REPOSITORY_NAME=$1
    TAG=${CIRCLE_SHA1:-$(git rev-parse HEAD)}

    # calculate the image name for AWS
    REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_DEFAULT_REGION}.amazonaws.com"
    IMAGE_NAME="${REGISTRY}/${REPOSITORY_NAME}"

    # export for later steps
    export FULL_IMAGE_NAME="${IMAGE_NAME}:${TAG}"
    echo "$FULL_IMAGE_NAME"
}

# update_docker_token() {
#     export TOKEN=$(aws ecr --region=$REGION get-authorization-token --output text --query authorizationData[].authorizationToken | base64 -d | cut -d: -f2)
# }

create_docker_pull_secret() {
    NAMESPACE=$1
    kubectl create secret generic regcred --from-file=.dockerconfigjson=$HOME/.docker/config.json --type=kubernetes.io/dockerconfigjson -n ${NAMESPACE}
}

install_helm() {
    HELM_URL=https://storage.googleapis.com/kubernetes-helm/helm-v2.12.3-linux-amd64.tar.gz
    HELM_ARCHIVE=helm-v2.12.3-linux-amd64.tar.gz
    curl -o $HELM_ARCHIVE $HELM_URL
    curl -o $HELM_ARCHIVE.sha256 ${HELM_URL}.sha256
    openssl sha1 -sha256 $HELM_ARCHIVE
    tar -zxf $HELM_ARCHIVE
    cd linux-amd64
    chmod +x helm
    sudo mv ./helm /usr/local/bin/helm

    helm init --client-only
    sleep 3
    helm version
}

kube_config() {
    aws --version
    login=$(aws ecr get-login --region $AWS_DEFAULT_REGION --no-include-email)
    ${login}

    aws eks update-kubeconfig --name $EKS_CLUSTER_NAME
}

