import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type UserProblemTimeResolveUserTimeProblemTool = ToolDefinition<{
  userId: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getUserProblemTimeResolveUserTimeProblemTool(): UserProblemTimeResolveUserTimeProblemTool {
  const name: string = 'user-problem-time-resolve-user-time-problem';

  const config: UserProblemTimeResolveUserTimeProblemTool[1] = {
    title: "Resolve user time-related issue",
    description: "Resolves a user's time problem and returns the updated information.",
    inputSchema: {
      userId: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: UserProblemTimeResolveUserTimeProblemTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(buildUrl(`${process.env.APP_URL}/time/problem-issue/resolve`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
      const responseString = JSON.stringify(response.data);
      return { content: [{ type: 'text', text: responseString }] };
    } catch (err) {
      let error =
        err instanceof AxiosError
          ? JSON.stringify(err.response.data)
          : JSON.stringify(err);

      return {
        content: [
          {
            type: 'text',
            text: `Request failed. Error: ${error}`,
          },
        ],
      };
    }
  };

  return [name, config, cb];
}
