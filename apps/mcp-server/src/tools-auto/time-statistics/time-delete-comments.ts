import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeDeleteCommentsTool = ToolDefinition<{
  workPeriodCommentIds: z.ZodArray<z.ZodNumber>;
  accessToken: z.ZodString;
}>;

export function getTimeDeleteCommentsTool(): TimeDeleteCommentsTool {
  const name: string = 'time-delete-comments';

  const config: TimeDeleteCommentsTool[1] = {
    title: "Delete user work period comments",
    description: "Removes specified comments and returns their IDs.",
    inputSchema: {
      workPeriodCommentIds: z.array(z.number()),
      accessToken: z.string(),
    },
  };

  const cb: TimeDeleteCommentsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(buildUrl(`${process.env.APP_URL}/time/comments`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
