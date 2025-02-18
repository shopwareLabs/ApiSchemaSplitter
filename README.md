# Shopware AdminApiSplitter (OpenApi Schema)

Yes, it sounds like a horror splatter movie. But we'll just split files for you! -- BrocksiNet

⚠️ These are experimental bun runtime scripts ⚠️ Features will be moved to [api-gen](https://github.com/shopware/frontends/tree/main/packages/api-gen) package in the future.

## Why

You want to import the admin API from your Shopware instance, but it fails because it has circular dependencies and is way too big a JSON file to import all endpoints at once. This bun scripts can help you split the admin API into smaller pieces (by path or tags) so you can decide what you want to import.

## Initial set up

Fist install dependencies:

```bash
bun install
```

Run some command _(see command reference below)_:

```bash
bun run splitTags
```

## Commands Overview

This commands are avaiable

- Download admin API schema command
- Split by tags command
- Split by paths command
- Clean up command
- Lint command

### Download admin API schema command

This command downloads the OpenAPI schema file for the admin API and places it under `./input/admin-api.json`. You can also place the file there manually and continue with the other commands.

**Download OpenAPI Schema JSON file without BearerToken (from a local instance with default URL):**

```shell
bun run downloadSchema
```

Default URL is: `http://localhost:8000/api/_info/openapi3.json?type=jsonapi`

**Download OpenAPI Schema JSON file without BearerToken (from a local instance):**

```shell
bun run downloadSchema --urlToOpenApiSchemaJson="https://www.shopware.dev/api/_info/openapi3.json?type=jsonapi"
```

**Download OpenAPI Schema JSON file with BearerToken:**

```shell
bun run downloadSchema --urlToOpenApiSchemaJson="https://demo-frontends.shopware.store/api/_info/openapi3.json?type=jsonapi" --bearerToken="eyJ0eXAiOiJKV1QiLCJhb...yourSecrectBearerToken"
```

How to get a bearer token? Use the `/oauth/token` Endpoint, for more details see the Admin API Documentation about [Authentication](https://shopware.stoplight.io/docs/admin-api/authentication).

### Split by tags command

This creates smaller OpenAPI JSON files and groups the paths according to tags. For example, all endpoints with the tag “Tax Provider” are added to an OpenAPI schema file.

```shell
bun run splitTags
```

Each tag is written to a separate file.

You can provide a `--filterByTag` parameter to only export that specific tag.

```shell
bun run splitTags --filterByTag="Tax Provider"
```

### Split by paths command

This command creates one OpenAPI JSON file for every path.

```shell
bun run splitPaths
```

The generation for all paths takes around `~45 seconds` for current Shopware version `6.6.10.0`.

You can provide a `--filterByPath` parameter to only export one specific path.

```shell
bun run splitPaths --filterByPath="/customer"
```

### Clean up command

Sometimes you need to clean up 🧼 things.

```shell
bun run cleanup
```

Deletes all files from the folders `./output/admin/split/tmp` and `./output/admin/bundeled`.

```shell
bun run cleanup --everyThing
```

Deletes all files and folders in the `input` and `output` folders.

### Lint command

```shell
bun run lint
```

This command will execute the `redocly lint` command on every file in `./output/admin/bundeled`.

## Import the splitted OpenAPI Schema files into the API client of your choice

### Postman

Workspace **>** Import Button **>** Select files from bundeled paths or tags **>** Import

### Bruno

Import Collection **>** OpenAPI V3 Spec **>** Select files from bundeled paths or tags **>** Select folder where you want to save the collection **>** Import

## Ressources

- [Redocly CLI commands](https://redocly.com/docs/cli/commands)
- [Bun runtime shell](https://bun.sh/docs/runtime/shell)

Created with happiness in mind 💙 by Shopware.
