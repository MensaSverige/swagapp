// Minimal no-op polyfill for expo/virtual/streams in Jest environment.
// The real module is a WebStreams polyfill that breaks during Jest's module
// initialization due to how it tests ReadableStream.cancel. Node 18+ has
// native WebStreams, so axios's fetch adapter can use those directly.
module.exports = {};
