import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeEditCommentsTool = ToolDefinition<{
  body: z.ZodObject<{ workPeriodCommentIds: z.ZodNumber; streamId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getTimeEditCommentsTool(): TimeEditCommentsTool {
  const name: string = 'time-edit-comments';

  const config: TimeEditCommentsTool[1] = {
    title: "Edit existing comments",
    description: "Updates and returns a list of edited comments",
    inputSchema: {
      body: z.object({ workPeriodCommentIds: z.number(), streamId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: TimeEditCommentsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/time/comments`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
