import getConfig from 'next/config';
import { IProposal, ISlate } from '../interfaces';
import axios, { AxiosResponse } from 'axios';
import { proposalsArray } from './data';

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
    console.log('returning dummy data');
    return proposalsArray;
    throw new Error(error);
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
 * Calls a mock API which finds a user by ID from the list above.
 *
 * Throws an error if not found.
 */
// export async function findProposal(title: string) {
//   const selected = proposalsArray.find(data => data.title === title);

//   if (!selected) {
//     throw new Error('Cannot find proposal');
//   }

//   return selected;
// }

/** Calls a mock API which returns the above array to simulate "get all". */
// export async function findAllProposals() {
//   // Throw an error, just for example.
//   if (!Array.isArray(proposalsArray)) {
//     throw new Error('Cannot find users');
//   }

//   return proposalsArray;
// }

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
    console.log('error:', error);
    // console.log('returning dummy data');
    throw new Error(error);
  }
}
