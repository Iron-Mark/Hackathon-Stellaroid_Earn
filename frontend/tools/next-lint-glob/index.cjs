"use strict";

/* eslint-disable @typescript-eslint/no-require-imports -- Loaded synchronously by the CommonJS Next ESLint plugin. */
const path = require("node:path");
const { globSync: matchDirectories } = require("tinyglobby");

// Next 16.3.8 uses only this call in utils/get-root-dirs. This is deliberately
// not a general fast-glob replacement. A plugin upgrade must review this API.
function globSync(pattern, options) {
  if (
    typeof pattern !== "string" ||
    options?.onlyDirectories !== true ||
    Object.keys(options).some((key) => key !== "onlyDirectories")
  ) {
    throw new TypeError("Unsupported Next.js lint directory-glob call");
  }
  if (pattern.length > 4096) {
    throw new RangeError("Next.js lint directory pattern is too long");
  }
  if (pattern.split("/").includes("..")) {
    throw new TypeError("Parent traversal is unsupported in Next.js lint roots");
  }

  let depth = 0;
  for (let index = 0; index < pattern.length; index++) {
    if (pattern[index] === "\\") {
      index++;
    } else if (pattern[index] === "{") {
      if (++depth > 64) {
        throw new RangeError("Next.js lint directory pattern is too deeply nested");
      }
    } else if (pattern[index] === "}") {
      depth = Math.max(0, depth - 1);
    }
  }

  const globOptions = {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: path.isAbsolute(pattern),
  };
  const normalize = (directory) =>
    directory.length > 1 && !/^[A-Za-z]:\/$/.test(directory)
      ? directory.replace(/\/$/, "")
      : directory;
  // fast-glob excludes the base of a terminal globstar; tinyglobby includes it.
  const basePattern = pattern.replace(/\/\*\*\/?$/, "");
  if (basePattern !== pattern && /[*?[\]()]/.test(basePattern)) {
    throw new TypeError("Dynamic bases before a terminal globstar are unsupported in Next.js lint roots");
  }
  const excludedBases = basePattern !== pattern
    ? new Set(matchDirectories(basePattern, globOptions).map(normalize))
    : new Set();
  return matchDirectories(pattern, globOptions)
    .map(normalize)
    .filter((directory) => !excludedBases.has(directory));
}

module.exports = { globSync };
