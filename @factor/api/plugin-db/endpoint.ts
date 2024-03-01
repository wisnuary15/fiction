import type { EndpointResponse, ResponseStatus, ValidationReason } from '@factor/api'
import { Query } from '../query'
import { words } from '../utils/lib/words'
import type { FactorDb } from '.'

type QuerySettings = { factorDb: FactorDb }

type UsernameResult = { available: ResponseStatus, reason: ValidationReason }

export class CheckUsername extends Query<QuerySettings> {
  wordsSet = new Set(words)

  isUrlFriendly(username: string): boolean {
    return /^[a-zA-Z0-9-_]+$/.test(username)
  }

  async run(
    params: { table: string, column: string, value: string },
  ): Promise<EndpointResponse<UsernameResult>> {
    const { factorDb } = this.settings
    const { table, column, value } = params

    const prepped = value.trim().toLowerCase()

    let result: UsernameResult = { available: 'loading', reason: 'loading' }

    try {
      if (prepped.length <= 3) {
        result = { available: 'fail', reason: 'short' }
      }
      else if (!this.isUrlFriendly(prepped)) {
        result = { available: 'fail', reason: 'invalid' }
      }
      else if (this.wordsSet.has(prepped)) {
        result = { available: 'fail', reason: 'reserved' }
      }

      else {
        const r = await factorDb.db?.table(table).select(column).where(column, prepped)

        if (r?.length)
          result = { available: 'fail', reason: 'taken' }

        else
          result = { available: 'success', reason: 'success' }
      }

      return { status: 'success', data: result }
    }
    catch (error) {
      this.log.error('error checking username', { error })
      result = { available: 'error', reason: `error` }
      return { status: 'error', data: result }
    }
  }
}