interface Env {
  KV: KVNamespace;
}

export const onRequest: PagesFunction<Env> = async _context => {
  return new Response('Hello, World!', {
    headers: {'content-type': 'text/plain'},
  });
};
