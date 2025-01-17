import { type CreateObjectType, type SyndicateStatus, type User, standardTable } from '@fiction/core'
import { FictionDbCol, FictionDbTable } from '@fiction/core/plugin-db'

export const t = {
  subscribe: 'fiction_subscribe',
  subscribeTaxonomy: 'fiction_subscribe_taxonomy',
  ...standardTable,
}

export type TableSubscribeConfig = CreateObjectType<typeof subscribeColumns>

const subscribeColumns = [
  new FictionDbCol({
    key: 'subscribeId',
    create: ({ schema, column, db }) => schema.string(column.pgKey).primary().defaultTo(db.raw(`object_id('sub')`)).index(),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'userId',
    create: ({ schema, column }) => schema.string(column.pgKey, 32).references(`${t.user}.user_id`).onUpdate('CASCADE').notNullable().index(),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'orgId',
    create: ({ schema, column }) => schema.string(column.pgKey, 50).references(`${t.org}.orgId`).onUpdate('CASCADE').notNullable().index(),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'level',
    create: ({ schema, column }) => schema.string(column.pgKey).defaultTo('standard'),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'status',
    create: ({ schema, column }) => schema.string(column.pgKey, 50).defaultTo('active'),
    default: () => '' as SyndicateStatus,
    zodSchema: ({ z }) => z.string(),
  }),
  // jsonb array of markdown strings
  new FictionDbCol({
    key: 'notes',
    create: ({ schema, column }) => schema.jsonb(column.pgKey),
    default: () => [] as string[],
    zodSchema: ({ z }) => z.array(z.string()).optional(),
  }),
  // publication user data overrides modifications that will be merged into subscriber user
  new FictionDbCol({
    key: 'customUser',
    create: ({ schema, column }) => schema.jsonb(column.pgKey),
    default: () => ({} as Partial<User>),
    zodSchema: ({ z }) => z.record(z.unknown()).optional(),
  }),
] as const

const subscribeTaxonomyCols = [
  new FictionDbCol({
    key: 'subscribeTaxonomyId',
    isComposite: true,
    create: ({ schema }) => schema.primary(['subscribe_id', 'taxonomy_id']),
    default: () => '' as string,
  }),
  new FictionDbCol({
    key: 'subscribeId',
    create: ({ schema, column }) => schema.string(column.pgKey).references(`${t.subscribe}.subscribeId`).onDelete('CASCADE'),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'taxonomyId',
    create: ({ schema, column }) => schema.string(column.pgKey).references(`${t.taxonomy}.taxonomyId`).onDelete('CASCADE'),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'orgId',
    create: ({ schema, column }) => schema.string(column.pgKey, 50).references(`${t.org}.org_id`).onUpdate('CASCADE').notNullable().index(),
    default: () => '' as string,
    zodSchema: ({ z }) => z.string(),
  }),
  new FictionDbCol({
    key: 'priority',
    create: ({ schema, column }) => schema.integer(column.pgKey).defaultTo(0),
    default: () => 0 as number,
    zodSchema: ({ z }) => z.number().int().optional(),
  }),
] as const

export const tables = [
  new FictionDbTable({ tableKey: t.subscribe, timestamps: true, columns: subscribeColumns, onCreate: t => t.unique(['user_id', 'org_id']) }),
  new FictionDbTable({ tableKey: t.subscribeTaxonomy, timestamps: true, columns: subscribeTaxonomyCols, onCreate: t => t.unique(['subscribe_id', 'taxonomy_id']) }),
]
