import { describe, expect, it } from 'vitest'
import type { Table } from '../../schema/index.js'
import { aColumn, aDBStructure, aTable } from '../../schema/index.js'
import { processor } from './index.js'

describe(processor, () => {
  const userTable = (override?: Partial<Table>) =>
    aDBStructure({
      tables: {
        users: aTable({
          name: 'users',
          columns: {
            id: aColumn({
              name: 'id',
              type: 'Int',
              notNull: true,
              primary: true,
              unique: false,
            }),
            ...override?.columns,
          },
          indices: {
            ...override?.indices,
          },
          comment: override?.comment ?? null,
        }),
      },
    })

  describe('should parse prisma schema correctly', () => {
    it('not null', async () => {
      const { value } = await processor(`
        model users {
          id   Int    @id @default(autoincrement())
          name String
        }
      `)

      const expected = userTable({
        columns: {
          name: aColumn({
            name: 'name',
            type: 'String',
            notNull: true,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('nullable', async () => {
      const { value } = await processor(`
        model users {
          id   Int    @id @default(autoincrement())
          description String?
        }
      `)

      const expected = userTable({
        columns: {
          description: aColumn({
            name: 'description',
            type: 'String',
            notNull: false,
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('column comment', async () => {
      const { value } = await processor(`
        model users {
          id   Int    @id @default(autoincrement())
          /// this is description
          description String?
        }
      `)

      const expected = userTable({
        columns: {
          description: aColumn({
            name: 'description',
            type: 'String',
            comment: 'this is description',
          }),
        },
      })

      expect(value).toEqual(expected)
    })

    it('table comment', async () => {
      const { value } = await processor(`
        /// store our users.
        model users {
          id   Int    @id @default(autoincrement())
        }
      `)

      const expected = userTable({
        comment: 'store our users.',
      })

      expect(value).toEqual(expected)
    })

    it('relationship', async () => {
      const { value } = await processor(`
        model users {
          id   Int    @id @default(autoincrement())
          posts posts[]
        }

        model posts {
          id   Int    @id @default(autoincrement())
          user users @relation(fields: [user_id], references: [id])
          user_id Int
        }
      `)

      const expected = {
        postsTousers: {
          name: 'postsTousers',
          primaryTableName: 'users',
          primaryColumnName: 'id',
          foreignTableName: 'posts',
          foreignColumnName: 'user_id',
          cardinality: 'ONE_TO_MANY',
          updateConstraint: 'NO_ACTION',
          deleteConstraint: 'NO_ACTION',
        },
      }

      expect(value.relationships).toEqual(expected)
    })
  })
})
