import { MongoJSONSchema4 } from 'mongodb-json-schema'
import { constant, identity, pipe } from 'fp-ts/lib/function'
import * as O from 'fp-ts/lib/Option'
import * as A from 'fp-ts/lib/Array'
import { schema as feedSourceSchema } from '../FeedSource'
import { schema as feedItemSchema, schema } from '../FeedItem'
import * as t from 'io-ts-codegen'
import prettier from 'prettier'
import * as fs from 'fs'
import * as path from 'path'

function getRequiredProperties(schema: MongoJSONSchema4): Record<string, true> {
  const required: Record<string, true> = {}
  if (schema.required) {
    schema.required.forEach(function (k) {
      required[k] = true
    })
  }
  return required
}

function toInterfaceCombinator(
  schema: MongoJSONSchema4,
): t.InterfaceCombinator {
  const required = getRequiredProperties(schema)

  return pipe(
    schema.properties,
    O.fromNullable,
    O.map((properties) =>
      pipe(
        Object.keys(properties),
        A.map((key) =>
          t.property(key, to(properties[key]), !(key in required)),
        ),
      ),
    ),
    O.fold(constant([]), identity),
    t.interfaceCombinator,
  )
}

function to(schema: MongoJSONSchema4): t.TypeReference {
  switch (schema.bsonType) {
    case 'objectId':
      return t.customCombinator('ObjectID', 'ObjectID')
    case 'string':
      return t.stringType
    case 'int':
    case 'long':
      return t.intType
    case 'double':
    case 'number':
      return t.numberType
    case 'boolean':
      return t.booleanType
    case 'object':
      return toInterfaceCombinator(schema)
    default:
      return t.unknownType
  }
}

function asDeclaration(name: string) {
  return (typeReference: t.TypeReference) => {
    return t.typeDeclaration(name, typeReference, true)
  }
}

async function main() {
  const schemas = [
    {
      name: 'FeedItem',
      schema: feedItemSchema,
    },
    {
      name: 'FeedSource',
      schema: feedSourceSchema,
    },
  ]

  const imports = `
import * as t from 'io-ts'
import { ObjectID } from '../../mongodb/ObjectID'
`

  const declarations = pipe(
    A.array.map(schemas, ({ name, schema }) =>
      pipe(to(schema), t.exactCombinator, asDeclaration(name), t.printRuntime),
    ),
  ).join('\n\n')

  const declarations2 = pipe(
    A.array.map(schemas, ({ name, schema }) =>
      pipe(to(schema), t.exactCombinator, asDeclaration(name), t.printStatic),
    ),
  ).join('\n\n')

  console.log(declarations2)

  const source = imports + '\n' + declarations

  const prettierConfigFilePath = (await prettier.resolveConfigFile()) || ''
  const prettierConfig =
    (await prettier.resolveConfig(prettierConfigFilePath)) || {}
  const generated = prettier.format(source, {
    ...prettierConfig,
    parser: 'typescript',
  })

  fs.writeFileSync(path.join(__dirname, 'index.ts'), generated)
}

main()