import type { FictionPluginSettings } from '../plugin'
import { FictionPlugin } from '../plugin'
import type { FictionUser, Organization, User } from '../plugin-user'
import type { FictionServer } from '../plugin-server'
import type { FictionEmail } from '../plugin-email'
import type { FictionRouter } from '../plugin-router'
import type { FictionDb } from '../plugin-db'
import type { FictionApp } from '../plugin-app'
import { safeDirname } from '../utils'
import { QueryOrgMembers, QuerySeekInviteFromUser, QueryTeamInvite } from './endpoint'

type FictionTeamSettings = {
  fictionApp: FictionApp
  fictionDb: FictionDb
  fictionUser: FictionUser
  fictionServer: FictionServer
  fictionEmail: FictionEmail
  fictionRouter: FictionRouter
} & FictionPluginSettings

export class FictionTeam extends FictionPlugin<FictionTeamSettings> {
  queries = {
    OrgMembers: new QueryOrgMembers({ ...this.settings, fictionTeam: this }),
    TeamInvite: new QueryTeamInvite({ ...this.settings, fictionTeam: this }),
    SeekInviteFromUser: new QuerySeekInviteFromUser({ ...this.settings, fictionTeam: this }),
  }

  requests = this.createRequests({
    queries: this.queries,
    fictionServer: this.settings.fictionServer,
    fictionUser: this.settings.fictionUser,
  })

  constructor(settings: FictionTeamSettings) {
    super('fictionTeam', { root: safeDirname(import.meta.url), ...settings })
  }

  invitationReturnUrl(args: { code: string, email: string, orgId: string, redirect: string }): string {
    const { email, code, orgId, redirect = '' } = args
    const url = this.settings.fictionEnv.meta.app?.url
    const e = encodeURIComponent(email)
    const r = encodeURIComponent(redirect)
    return `${url}/set-password?code=${code}&flow=invited&orgId=${orgId}&email=${e}&redirect=${r}`
  }

  async loadMemberIndex() {
    const requestPromise = this.requests.OrgMembers.projectRequest({ _action: 'index' })

    const r = await requestPromise

    return r.data
  }

  async loadMember(userId: string) {
    const r = await this.requests.OrgMembers.projectRequest({
      _action: 'single',
      memberId: userId,
    })

    return r.data?.[0]
  }

  /**
   * Currently unused
   */
  async sendClientOrganizationWelcome(params: {
    client: User
    user: User
    org: Organization
  }): Promise<void> {
    const { client, user, org } = params
    const { email, verify } = client
    const { fullName: requestingName = 'A user', email: requestingEmail } = user

    if (!email)
      throw new Error('no client email')

    const { orgName } = org

    const bodyMarkdown = `Hi there!\n\n${requestingName} (${requestingEmail}) has invited you to the organization "${orgName}."`

    if (!verify?.code)
      throw this.stop('A verification code is required')

    await this.settings.fictionEmail.sendTransactional({
      to: email,
      subject: `${org.orgName}: You've been invited!`,
      bodyMarkdown,
      actions: [{
        name: 'Set Your Password',
        href: this.invitationReturnUrl({
          code: verify?.code,
          email,
          orgId: org.orgId,
          redirect: `/org/${org.orgId}`,
        }),
      }],
    }, { server: true })
  }
}
