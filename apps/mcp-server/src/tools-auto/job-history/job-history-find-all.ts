import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type JobHistoryFindAllTool = ToolDefinition<{
  userId: z.ZodString;
  accessToken: z.ZodString;
}>;

export function getJobHistoryFindAllTool(): JobHistoryFindAllTool {
  const name: string = 'job-history-find-all';

  const config: JobHistoryFindAllTool[1] = {
    title: "Retrieve job history by user ID",
    description: "Returns the job history for a specified user.",
    inputSchema: {
      userId: z.string(),
      accessToken: z.string(),
    },
  };

  const cb: JobHistoryFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/job-history/${params.userId}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
