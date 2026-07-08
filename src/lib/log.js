/// <reference types="@fastly/js-compute" />

const log = (req, resp) => {
  const record = {
    method: req.method,
    url: req.url,
    status: resp.status,
  };
  console.log(JSON.stringify(record));
};

export { log };
