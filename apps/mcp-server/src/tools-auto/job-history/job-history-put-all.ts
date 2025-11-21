import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type JobHistoryPutAllTool = ToolDefinition<{
  userId: z.ZodNumber;
  body: z.ZodObject<{ jobHistory: z.ZodArray<z.ZodObject<{ id: z.ZodNumber; startDate: z.ZodString; endDate: z.ZodNullable<z.ZodString> }>>; endTrialPeriodDate: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getJobHistoryPutAllTool(): JobHistoryPutAllTool {
  const name: string = 'job-history-put-all';

  const config: JobHistoryPutAllTool[1] = {
    title: "Update user's job history records",
    description: "Updates and returns the job history for a specified user.",
    inputSchema: {
      userId: z.number(),
      body: z.object({ jobHistory: z.array(z.object({ id: z.number(), startDate: z.string(), endDate: z.string().nullable() })), endTrialPeriodDate: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: JobHistoryPutAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.put(`${process.env.APP_URL}/job-history/put-all/${params.userId}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
