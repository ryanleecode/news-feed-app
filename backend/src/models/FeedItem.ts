import { eqObjectId } from '../mongodb/ObjectID'
import * as t from 'io-ts'
import * as Eq from 'fp-ts/lib/Eq'
import { MongoJSONSchema4 } from 'mongodb-json-schema'
import { Schema } from './schema'
import { FeedItem as gFeedItem } from './generated'

export type FeedItem = t.TypeOf<typeof gFeedItem>

export const FeedItem = gFeedItem

export const eqFeedItem = Eq.contramap((i: FeedItem) => i._id)(eqObjectId)

type Properties = '_id' | 'title' | 'link' | 'date' | 'description'

export const schema: Schema<Properties> = {
  $jsonSchema: {
    title: 'FeedSource',
    bsonType: 'object',
    additionalProperties: false,
    required: ['_id', 'title', 'link', 'date'] as Properties[],
    properties: {
      _id: {
        bsonType: 'objectId',
      },
      title: {
        bsonType: 'string',
      },
      link: {
        bsonType: 'string',
      },
      date: {
        bsonType: 'date',
      },
      description: {
        bsonType: 'string',
      },
    },
  } as MongoJSONSchema4<Properties>,
}
