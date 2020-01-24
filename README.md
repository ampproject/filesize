# Filesize

**Purpose**: Monitor the size of files in your project specified within `package.json`.

Uses native compression from Node Core, attempts to parallelize compression work across available CPUs, and requires Node >= `10.16`.

## Installation

```bash
yarn add @ampproject/filesize --dev
```

## Usage

Specify an array of files you'd like to check the size for inside the `filesize` key of `package.json`.

```json
{
  "filesize": [
    {
      "path": "./dist/index.js",
      "compression": "brotli",
      "maxSize": "11.4 kB"
    }
  ]
}
```

Each file must include a the following keys:
1. `path`, a resolvable path to the file.
2. `compression`, the type of compression to use on the file (options: 'brotli', 'gzip', or 'none')
3. `maxSize`, a string representation of the maxiumum size the file can be.

**After completing configuration**, invoke `filesize` via: `yarn filesize`. 

Optionally one can target a different project directory via the `p` parameter `yarn filesize -p={PATH}`.

## Security disclosures

The AMP Project accepts responsible security disclosures through the [Google Application Security program](https://www.google.com/about/appsecurity/).

## Code of conduct

The AMP Project strives for a positive and growing project community that provides a safe environment for everyone.  All members, committers and volunteers in the community are required to act according to the [code of conduct](CODE_OF_CONDUCT.md).

## License

filesize is licensed under the [Apache License, Version 2.0](LICENSE).
