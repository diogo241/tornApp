'use client';

import { createDataProvider, CreateDataProviderOptions } from '@refinedev/rest';
import type {
  CreateParams,
  GetListResponse,
  UpdateParams,
  BaseRecord,
} from '@refinedev/core';
import { ApiErrorResponse } from '@lib/api';


const options: CreateDataProviderOptions = {
  getList: {
    getEndpoint: ({ resource }) => resource,
    buildQueryParams: async ({ pagination, filters, sorters }) => {
      const query: Record<string, any> = {};

      // pagination
      query.page = pagination?.currentPage ?? 1;
      query.size = pagination?.pageSize ?? 10;

      // sorters
      if (sorters?.length) {
        query.sort = sorters
          .map(({ field, order }) => `${order === 'desc' ? '-' : ''}${field}`)
          .join(',');
      }

      // filters
      for (const filter of filters ?? []) {
        if (filter.operator === 'eq') {
          query[filter.field] = filter.value;
        }
        if (filter.operator === 'contains') {
          query[`${filter.field}`] = filter.value;
        }
      }

      return query;
    },
    mapResponse: async (response) => {
      if (!response.ok) {
        const error = (await response.json()) as ApiErrorResponse;
        throw new Error(error.message || error.error || 'Failed to fetch data');
      }
      const payload: GetListResponse = await response.json();

      return payload.data;
    },
    getTotalCount: async (response) => {
      const payload: GetListResponse = await response.json();

      return payload.total ?? payload.data.length ?? 0;
    },
  },
  getOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response) => {
      const payload = await response.json();
      return payload as BaseRecord;
    },
  },
  update: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    getRequestMethod: (params: UpdateParams<any>) => 'put',
    buildBodyParams: async ({ resource, id, variables }) => {
      return {
        id,
        ...variables,
      };
    },
    mapResponse: async (response) => {
      const payload = await response.json();
      return payload as BaseRecord;
    },
    transformError: async (response) => {
      const error = (await response.json()) as ApiErrorResponse;

      return {
        message: error.error || 'Update failed',
        statusCode: response.status,
      };
    },
  },
  deleteOne: {
    getEndpoint: ({ resource, id }) => `${resource}/${id}`,
    mapResponse: async (response, params) => {
      const payload = await response.json();
      return payload as BaseRecord;
    },
    transformError: async (response) => {
      const error = (await response.json()) as ApiErrorResponse;

      return {
        message: error.error || 'Delete failed',
        statusCode: response.status,
      };
    },
  },
  create: {
    getEndpoint: ({ resource }) => resource,
    mapResponse: async (response) => {
      const payload = await response.json();
      return payload as BaseRecord;
    },
    transformError: async (response) => {
      const error = (await response.json()) as ApiErrorResponse;

      return {
        message: error.error || 'Something went wrong',
        statusCode: response.status,
      };
    },
  },
};

const { dataProvider } = createDataProvider('/api', options);

export { dataProvider };
