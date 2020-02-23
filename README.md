# Filesize

**Purpose**: Monitor the size of files in your project specified within `package.json`.

Uses native compression from Node Core, attempts to parallelize compression work across available CPUs, and requires Node >= `10.16`.

![alt-text](https://github.com/ampproject/filesize/raw/master/src/preview.gif)

## Installation

```bash
yarn add @ampproject/filesize --dev
```

## Usage

Specify an object of files you'd like to check the size for inside the `filesize` key of `package.json`.

```json
{
  "filesize": {
    "./dist/index.js": {
      "brotli": "11.4 kB"
    }
  }
}
```

Each file (key in the filesize object) must include an object with key/value pairs:
1. The key is the `compression` type you would like to use on the file.
2. The value is the string representation of the files maximum allowed size.

**After completing configuration**, invoke `filesize` via: `yarn filesize`. 

Optionally one can target a different project directory via the `p` parameter `yarn filesize -p={PATH}`.

### Track Resource Size

This utility now also supports tracking filesizes without enforcing a max limit. To use this feature add a `track` key to the `filesize` entry.

```json
{
  "filesize": {
    "track": ["./dist/**/*.mjs"],
  }
}
```

These values will be added to the output report for all comression types.

## Security disclosures

The AMP Project accepts responsible security disclosures through the [Google Application Security program](https://www.google.com/about/appsecurity/).

## Code of conduct

The AMP Project strives for a positive and growing project community that provides a safe environment for everyone.  All members, committers and volunteers in the community are required to act according to the [code of conduct](CODE_OF_CONDUCT.md).

## License

filesize is licensed under the [Apache License, Version 2.0](LICENSE).
