/// <reference types="@fastly/js-compute" />

const notFound = () => new Response('Not Found', { status: 404 });
const error = (msg = 'Internal Server Error') => new Response(msg, { status: 500 });

export { notFound, error };
