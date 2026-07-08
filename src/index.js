/// <reference types="@fastly/js-compute" />

import * as response from './lib/response.js';
import { log } from './lib/log.js';
import { postsListHandler, postDetailHandler } from './posts.js';

addEventListener('fetch', (event) => event.respondWith(handleRequest(event)));

async function handleRequest(event) {
  const req = event.request;
  const url = new URL(req.url);

  let finalResponse;

  try {
    if (url.pathname === '/posts' && req.method === 'GET') {
      finalResponse = await postsListHandler();
    } else if (url.pathname.match(/^\/posts\/(\d+)$/) && req.method === 'GET') {
      const id = url.pathname.match(/^\/posts\/(\d+)$/)[1];
      finalResponse = await postDetailHandler(id);
    } else {
      finalResponse = response.notFound();
    }
  } catch (err) {
    console.error(err);
    finalResponse = response.error();
  }

  log(req, finalResponse);
  return finalResponse;
}
