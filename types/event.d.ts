/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Event {
  id?: string;
  name: string;
  location: {
    description: string;
    lat: number;
    lng: number;
    [k: string]: unknown;
  };
  start: string;
  end?: string;
  description?: string;
  [k: string]: unknown;
}