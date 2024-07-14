import { Context, Schema } from 'koishi'
import axios from 'axios'

export const name = 'asfbot'

export interface Config {
  ip: string
  port: string
  asfApiKey: string
}

const formatResponse = (data: any) => {
  if (typeof data === 'string') {
    return data.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
  return JSON.stringify(data, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const availableCommands = `
Available ASF commands: 2fa, 2fafinalize, 2fafinalized, 2fafinalizedforce, 2fainit, 2fano, 2faok, addlicense, balance, bgr, encrypt, exit, farm, fb, fbadd, fbrm, fq, fqadd, fqrm, hash, input, level, loot, loot%, loot@, loot^, mab, mabadd, mabrm, match, nickname, oa, owns, pause, pause&, pause~, play, points, privacy, r, r^, redeem, redeem^, reset, restart, resume, sa, start, stats, status, std, stop, tb, tbadd, tbrm, transfer, transfer%, transfer@, transfer^, unpack, update, updateplugins, version
`

export const Config: Schema<Config> = Schema.object({
  ip: Schema.string().description('The IP address of the ASF instance.').required(),
  port: Schema.string().description('The port of the ASF instance.').required(),
  asfApiKey: Schema.string().description('The API key for ASF.').required(),
})

export function apply(ctx: Context, config: Config) {
  const baseUrl = `http://${config.ip}:${config.port}`
  const botName = ctx.root.config.nickname[0] || 'ASF Bot'
  const botPrefix = `[${botName}] `

  ctx.command('asf <command:text>', 'Send a command to ASF')
    .action(async (_, command) => {
      if (!command) {
        return `${botPrefix}Please provide a command to send to ASF.`
      }

      try {
        const response = await axios.post(
          `${baseUrl}/Api/Command`,
          { Command: command },
          { headers: { 'Authentication': config.asfApiKey } }
        )

        if (response.data && response.data.Success) {
          return `${botPrefix}${formatResponse(response.data.Result)}`
        } else {
          return `${botPrefix}ASF command failed: ${response.data?.Message || 'Unknown error'}`
        }
      } catch (error) {
        return `${botPrefix}Error communicating with ASF: ${error.message}`
      }
    })

  ctx.command('asf.status [bots:text]', 'Get the status of specified ASF bots')
    .action(async (_, bots) => {
      const botNames = bots ? bots.split(/\s+/) : ['ASF']

      try {
        const botStatuses = await Promise.all(
          botNames.map(async (botName: string) => {
            const botStatusResponse = await axios.get(
              `${baseUrl}/Api/Bot/${botName}`,
              { headers: { 'Authentication': config.asfApiKey } }
            )
            return { botName, status: botStatusResponse.data }
          })
        )
        return `${botPrefix}${formatResponse(botStatuses)}`
      } catch (error) {
        return `${botPrefix}Error fetching ASF status: ${error.message}`
      }
    })

  ctx.command('asf.commands', 'List available ASF commands')
    .action(() => {
      return `${botPrefix}${availableCommands}`
    })

  ctx.command('asf.help', 'List available ASF commands')
    .action(() => {
      return `${botPrefix}${availableCommands}`
    })
}
