import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type UserProblemTimeGetUsersWithTimeProblemTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getUserProblemTimeGetUsersWithTimeProblemTool(): UserProblemTimeGetUsersWithTimeProblemTool {
  const name: string = 'user-problem-time-get-users-with-time-problem';

  const config: UserProblemTimeGetUsersWithTimeProblemTool[1] = {
    title: "List users with time issues",
    description: "Returns a list of users experiencing time-related problems",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: UserProblemTimeGetUsersWithTimeProblemTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/time/problem-issue`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
