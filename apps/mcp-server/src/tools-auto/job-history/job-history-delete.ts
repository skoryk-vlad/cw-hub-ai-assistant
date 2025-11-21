import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type JobHistoryDeleteTool = ToolDefinition<{
  id: z.ZodNumber;
  accessToken: z.ZodString;
}>;

export function getJobHistoryDeleteTool(): JobHistoryDeleteTool {
  const name: string = 'job-history-delete';

  const config: JobHistoryDeleteTool[1] = {
    title: "Delete job history by ID",
    description: "Deletes a job history record and returns the result.",
    inputSchema: {
      id: z.number(),
      accessToken: z.string(),
    },
  };

  const cb: JobHistoryDeleteTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/job-history/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
