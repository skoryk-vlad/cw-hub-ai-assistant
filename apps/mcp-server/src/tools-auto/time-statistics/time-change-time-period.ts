import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeChangeTimePeriodTool = ToolDefinition<{
  body: z.ZodObject<{ commentIds: z.ZodArray<z.ZodNumber>; streamId: z.ZodNumber; date: z.ZodString; description: z.ZodString; userId: z.ZodNumber }>;
  accessToken: z.ZodString;
}>;

export function getTimeChangeTimePeriodTool(): TimeChangeTimePeriodTool {
  const name: string = 'time-change-time-period';

  const config: TimeChangeTimePeriodTool[1] = {
    title: "Update tracked time period",
    description: "Modifies the tracked time period and returns affected count.",
    inputSchema: {
      body: z.object({ commentIds: z.array(z.number()), streamId: z.number(), date: z.string(), description: z.string(), userId: z.number() }),
      accessToken: z.string(),
    },
  };

  const cb: TimeChangeTimePeriodTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/time/tracked-time-period`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
