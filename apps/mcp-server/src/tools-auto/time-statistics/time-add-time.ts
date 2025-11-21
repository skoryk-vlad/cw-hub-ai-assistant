import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeAddTimeTool = ToolDefinition<{
  body: z.ZodObject<{ workedFrom: z.ZodString; workedTo: z.ZodString; date: z.ZodString; description: z.ZodString; streamId: z.ZodNumber; userId: z.ZodNumber; time: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getTimeAddTimeTool(): TimeAddTimeTool {
  const name: string = 'time-add-time';

  const config: TimeAddTimeTool[1] = {
    title: "Add time entry to tracking hub",
    description: "Adds a new time entry for tracking purposes.",
    inputSchema: {
      body: z.object({ workedFrom: z.string(), workedTo: z.string(), date: z.string(), description: z.string(), streamId: z.number(), userId: z.number(), time: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: TimeAddTimeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/time/add-time`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
