import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeChangeTimeTool = ToolDefinition<{
  body: z.ZodObject<{ workedFrom: z.ZodString; workedTo: z.ZodString; time: z.ZodString; streamId: z.ZodNumber; date: z.ZodString; description: z.ZodString; userId: z.ZodNumber; commentId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getTimeChangeTimeTool(): TimeChangeTimeTool {
  const name: string = 'time-change-time';

  const config: TimeChangeTimeTool[1] = {
    title: "Update tracked time entry",
    description: "Modifies an existing tracked time entry.",
    inputSchema: {
      body: z.object({ workedFrom: z.string(), workedTo: z.string(), time: z.string(), streamId: z.number(), date: z.string(), description: z.string(), userId: z.number(), commentId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: TimeChangeTimeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/time/tracked-time`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
