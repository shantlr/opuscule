// This file is generated by proute, do not edit it manually, it will be override

import { createResourceMap } from 'proute'
import { object, string } from 'valibot';

import * as resources from './resources';
export const RESOURCES = createResourceMap(resources);

export const ROUTES = {
  get: {
    '/books': {
      expressPath: '/books',
      params: object({}),
    },
    '/books/:id': {
      expressPath: '/books/:id',
      params: object({
        id: string(),
      }),
    },
    '/books/:id/chapter/:chapterId': {
      expressPath: '/books/:id/chapter/:chapterId',
      params: object({
        id: string(),
        chapterId: string(),
      }),
    },
    '/sources': {
      expressPath: '/sources',
      params: object({}),
    },
  },
  delete: {
    '/books/:id/bookmark': {
      expressPath: '/books/:id/bookmark',
      params: object({
        id: string(),
      }),
    },
    '/sources/:id/subscribe': {
      expressPath: '/sources/:id/subscribe',
      params: object({
        id: string(),
      }),
    },
  },
  post: {
    '/books/:id/bookmark': {
      expressPath: '/books/:id/bookmark',
      params: object({
        id: string(),
      }),
    },
    '/books/:id/refetch': {
      expressPath: '/books/:id/refetch',
      params: object({
        id: string(),
      }),
    },
    '/sources/:id/subscribe': {
      expressPath: '/sources/:id/subscribe',
      params: object({
        id: string(),
      }),
    },
  },
  put: {
    '/chapters/:id/read-progress': {
      expressPath: '/chapters/:id/read-progress',
      params: object({
        id: string(),
      }),
    },
  },
};