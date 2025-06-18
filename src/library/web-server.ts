import type { OutgoingHttpHeaders, Server } from 'node:http';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { Readable } from 'node:stream';
import type { Context, FetchCallback, WebServerOptions } from './definitions.js';

/**
 * Safely parses a JSON string, returning the parsed object if successful,
 * or the original string if parsing fails.
 *
 * @param data - The string to parse as JSON.
 * @returns The parsed object if `data` is valid JSON, otherwise returns the original string.
 */
export const safeJsonParse = (data: string) => {
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

/**
 * Parses a flat array of raw HTTP headers into an array of key-value pairs,
 * coercing each header into a tuple of [string, string].
 *
 * Skips headers whose key starts with a colon (':') or whose value is undefined.
 *
 * @param rawHeaders - A readonly array of strings representing raw HTTP headers,
 *   where each even index is a header name and the following odd index is its value.
 * @returns An array of [key, value] tuples representing the parsed headers.
 */
export const parseAndCoerceHeaders = (rawHeaders: Readonly<string[]>): [string, string][] => {
  const headers: [string, string][] = [];

  for (let i = 0; i < rawHeaders.length; i += 2) {
    const { [i]: key, [i + 1]: value } = rawHeaders;

    if (key && key.charCodeAt(0) !== /*:*/ 0x3a && value !== undefined) {
      headers.push([key, value]);
    }
  }

  return headers;
};

/**
 * Converts a `Headers` object into an `OutgoingHttpHeaders` object suitable for use with Node.js HTTP responses.
 *
 * Iterates over all entries in the provided `headers` and copies them into a new object.
 * If the `content-type` header is not already set, it defaults to `'text/plain; charset=UTF-8'`.
 *
 * @param headers - A read-only `Headers` object containing HTTP header key-value pairs.
 * @returns An `OutgoingHttpHeaders` object with all headers from the input and a default `content-type` if not present.
 */
export const buildOutgoingHttpHeaders = (headers: Readonly<Headers>): OutgoingHttpHeaders => {
  const res: OutgoingHttpHeaders = {};

  for (const [k, v] of headers) {
    res[k] = v;
  }

  res['content-type'] ??= 'text/plain; charset=UTF-8';

  return res;
};

/**
 * Handles errors that occur during HTTP response processing.
 *
 * This function inspects the provided error and logs information based on its type.
 * If the error is an 'ERR_STREAM_PREMATURE_CLOSE', it logs an informational message indicating
 * that the user aborted the request. For all other errors, it logs the error, ensures a 500
 * response is sent if headers have not already been sent, writes an error message to the response,
 * and destroys the response with the error.
 *
 * @param e - The error encountered, which can be of any type.
 * @param outgoing - The HTTP server response object to send the error response to.
 */
export const handleResponseError = (e: unknown, outgoing: Readonly<http.ServerResponse>) => {
  const err = (e instanceof Error ? e : new Error('unknown error', { cause: e })) as Error & {
    code: string;
  };

  if (err.code === 'ERR_STREAM_PREMATURE_CLOSE') {
    console.info('The user aborted a request.');
  } else {
    console.error(e);

    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { 'Content-Type': 'text/plain' });
    }

    outgoing.end(`Error: ${err.message}`);
    outgoing.destroy(err);
  }
};

/**
 * Asynchronously builds a context object from a given HTTP request.
 *
 * @param request - The incoming HTTP request to extract context from.
 * @returns A promise that resolves to a `Context` object containing:
 *   - `method`: The HTTP method of the request.
 *   - `headers`: An object representation of the request headers.
 *   - `path`: The pathname portion of the request URL.
 *   - `query`: An object representation of the query parameters.
 *   - `body`: The parsed JSON body of the request, or the raw value if parsing fails.
 */
export const buildContext = async (request: Request): Promise<Context> => ({
  method: request.method,
  headers: Object.fromEntries(request.headers),
  path: new URL(request.url).pathname,
  query: Object.fromEntries(new URL(request.url).searchParams),
  body: safeJsonParse(Buffer.from(await request.arrayBuffer()).toString())
});

const getRequestListener = (fetchCallback: FetchCallback) => {
  return async (
    incoming: Readonly<http.IncomingMessage>,
    outgoing: Readonly<http.ServerResponse>
  ) => {
    let body: ReadableStream<Uint8Array<ArrayBufferLike>> | null = null;

    if (!(incoming.method === 'GET' || incoming.method === 'HEAD')) {
      body = Readable.toWeb(incoming) as ReadableStream<Uint8Array>;
    }

    const request = new Request(`http://${incoming.headers.host}${incoming.url}`, {
      method: incoming.method || 'GET',
      headers: parseAndCoerceHeaders(incoming.rawHeaders),
      body,
      duplex: 'half'
    });

    try {
      const res = await fetchCallback(await buildContext(request));

      if (res.body) {
        const buffer = await res.arrayBuffer();
        res.headers.set('Content-Length', buffer.byteLength.toString());

        outgoing.writeHead(res.status, buildOutgoingHttpHeaders(res.headers));
        outgoing.end(new Uint8Array(buffer));
      } else {
        outgoing.writeHead(res.status, buildOutgoingHttpHeaders(res.headers));
        outgoing.end();
      }
    } catch (e) {
      return handleResponseError(e, outgoing);
    }
  };
};

/**
 * Creates and starts an HTTP web server on the specified port.
 *
 * @param options - The configuration options for the web server.
 * @param options.port - The port number on which the server will listen.
 * @param options.fetchCallback - The callback function to handle incoming HTTP requests.
 * @returns A promise that resolves to an object containing the created server instance and its address information.
 *
 *  ## Example
 *
 * ```ts
 * const server = await createWebServer({
 *   port: 9000,
 *   fetchCallback: (ctx) => {
 *      if (ctx.method === 'GET' && ctx.path('/')) {
 *        return new Response('OK');
 *      }
 *
 *      return new Response();
 *   }
 * });
 * ```
 */
export const createWebServer = async ({
  port,
  fetchCallback
}: WebServerOptions): Promise<{ server: Server; address: AddressInfo }> => {
  const server = http.createServer(getRequestListener(fetchCallback));

  return await new Promise((resolve) => {
    server.listen(port, () => {
      const address = server.address() as AddressInfo;

      resolve({ server, address });
    });
  });
};

/**
 * Gracefully closes the provided HTTP server instance.
 *
 * @param server - The HTTP server instance to close. If `undefined`, the function resolves immediately.
 * @returns A promise that resolves when the server has been closed.
 *
 * ## Example
 *
 * ```ts
 * const server = await createWebServer({
 *   port: 9000,
 *   fetchCallback: () => new Response()
 * });
 */
export const closeWebServer = async (server: Server | undefined): Promise<void> =>
  await new Promise<void>((resolve) => {
    if (server !== undefined) {
      server.close(() => {
        resolve();
      });
    }
  });
