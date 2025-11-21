import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type JobHistoryNewTool = ToolDefinition<{
  userId: z.ZodNumber;
  body: z.ZodObject<{ startDate: z.ZodString; endDate: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getJobHistoryNewTool(): JobHistoryNewTool {
  const name: string = 'job-history-new';

  const config: JobHistoryNewTool[1] = {
    title: "Add new job history for user",
    description: "Creates a new job history entry for a user.",
    inputSchema: {
      userId: z.number(),
      body: z.object({ startDate: z.string(), endDate: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: JobHistoryNewTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/job-history/new/${params.userId}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
