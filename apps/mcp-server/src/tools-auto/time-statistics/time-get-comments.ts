import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeGetCommentsTool = ToolDefinition<{
  userId: z.ZodNullable<z.ZodNumber>;
  projectId: z.ZodNullable<z.ZodNumber>;
  startDate: z.ZodString;
  endDate: z.ZodString;
  streamIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getTimeGetCommentsTool(): TimeGetCommentsTool {
  const name: string = 'time-get-comments';

  const config: TimeGetCommentsTool[1] = {
    title: "Retrieve all work period comments",
    description: "Returns a list of work period comments.",
    inputSchema: {
      userId: z.number().nullable(),
      projectId: z.number().nullable(),
      startDate: z.string(),
      endDate: z.string(),
      streamIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TimeGetCommentsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/comments`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
