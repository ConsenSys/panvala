import getConfig from 'next/config';
import { IProposal, ISlate, ISaveSlate, ISubmitBallot } from '../interfaces';
import axios, { AxiosResponse } from 'axios';
import { handleApiError } from './errors';

// Defaults are a workaround for https://github.com/zeit/next.js/issues/4024
const { publicRuntimeConfig = {} } = getConfig() || {};

const apiHost = publicRuntimeConfig.apiHost || 'http://localhost:5000';

const corsHeaders = {
  'Access-Control-Allow-Origin': `${apiHost}`,
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, Content-Type',
};

export async function getAllProposals(): Promise<IProposal[] | AxiosResponse> {
  try {
    const response = await axios({
      method: 'get',
      url: `${apiHost}/api/proposals`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    if (response.status === 200) {
      return response.data;
    }
    // TODO: handle response status
    return response;
  } catch (error) {
    console.log('error:', error);
    throw error;
  }
}

export async function postProposal(data: IProposal): Promise<AxiosResponse> {
  try {
    const response = await axios({
      method: 'post',
      url: `${apiHost}/api/proposals`,
      data,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    // if (response.status === 200) {
    //   return response;
    // }
    // TODO: handle response status
    return response;
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Get all the available slates
 */
export async function getAllSlates(): Promise<ISlate[] | AxiosResponse> {
  try {
    const response = await axios({
      method: 'get',
      url: `${apiHost}/api/slates`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    });
    if (response.status === 200) {
      return response.data;
    }
    // TODO: handle response status
    return response;
  } catch (error) {
    console.log('error while getting slates:', error);
    // console.log('returning dummy data');
    throw new Error(error);
  }
}

/**
 * Save slate info using the API
 * @param data
 */
export async function postSlate(data: ISaveSlate): Promise<AxiosResponse> {
  return axios({
    method: 'post',
    url: `${apiHost}/api/slates`,
    data,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  }).catch(error => {
    throw handleApiError(error);
  });
}

/**
 * Save ballot info using the API
 * @param ballot
 * @param commitHash
 * @param signature
 */
export async function postBallot(ballot: ISubmitBallot, commitHash: string, signature: string) {
  const data = {
    ballot,
    commitHash,
    signature,
  };
  return axios({
    method: 'post',
    url: `${apiHost}/api/ballots`,
    data,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  }).catch(function(error) {
    throw handleApiError(error);
  });
}
