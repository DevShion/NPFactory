# npm dual package template

[Thanks to](https://github.com/azu/tsconfig-to-dual-package)

what does **dual** mean? => **CommonJS** & **ESM**

## Install

Clone the repo and install dependencies:

```bash
git clone https://github.com/DevShion/npfactory.git YOUR_PROJECT_NAME
cd YOUR_PROJECT_NAME
npm install
```

or use Template Button on this page.

## How to Use

### First, Follow this site and prepare for packaging

[](https://zenn.dev/missselfi/articles/d368f7296aae04)

### Update your package version in package.json

```json title="package.json"
{
    ...
    "name": "YOUR_NAME/YOUR_PROJECT_NAME",
    // something like...
    "version": "1.0.0", //  => "version": "1.0.1",
    ...
}
```

### Build

```bash
npm run build
```

This will create **cjs**, **module** folder.

### Push for publishing npm package

```bash
git add .
git commit -m "COMMENT"
git push origin main
```

### Packaging

```bash
npm publish
```