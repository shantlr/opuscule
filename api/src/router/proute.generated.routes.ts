// This file is generated by proute, do not edit it manually, it will be override

import { createResourceMap } from 'proute';
import { object, string } from 'valibot';
import routerConfig from './config';
import * as resources from './resources';
export const RESOURCES = createResourceMap(resources);

export const ROUTES = {
  delete: {
    '/auth': {
      expressPath: '/auth',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/books/:id/bookmark': {
      expressPath: '/books/:id/bookmark',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
    '/sources/:id/subscribe': {
      expressPath: '/sources/:id/subscribe',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
  },
  get: {
    '/auth/config': {
      expressPath: '/auth/config',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/auth/google': {
      expressPath: '/auth/google',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/auth/google/callback': {
      expressPath: '/auth/google/callback',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/auth/me': {
      expressPath: '/auth/me',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/books': {
      expressPath: '/books',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/books/:id': {
      expressPath: '/books/:id',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
    '/books/:id/chapter/:chapterId': {
      expressPath: '/books/:id/chapter/:chapterId',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
        chapterId: string(),
      }),
    },
    '/chapters/:id/source/raw': {
      expressPath: '/chapters/:id/source/raw',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
    '/sources': {
      expressPath: '/sources',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
  },
  post: {
    '/books/:id/bookmark': {
      expressPath: '/books/:id/bookmark',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
    '/books/:id/refetch': {
      expressPath: '/books/:id/refetch',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
    '/sources/refetch': {
      expressPath: '/sources/refetch',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/sources/subscribe': {
      expressPath: '/sources/subscribe',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/sources/:id/subscribe': {
      expressPath: '/sources/:id/subscribe',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
  },
  put: {
    '/chapters/read-progress': {
      expressPath: '/chapters/read-progress',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({}),
    },
    '/chapters/:id/read-progress': {
      expressPath: '/chapters/:id/read-progress',
      securitySchemes: routerConfig?.securitySchemes,
      params: object({
        id: string(),
      }),
    },
  },
};
