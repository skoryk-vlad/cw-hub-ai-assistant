import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type TimeGetLastWeekTimeTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getTimeGetLastWeekTimeTool(): TimeGetLastWeekTimeTool {
  const name: string = 'time-get-last-week-time';

  const config: TimeGetLastWeekTimeTool[1] = {
    title: "Retrieve last week's time statistics",
    description: "Returns statistics for the previous week's time usage.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: TimeGetLastWeekTimeTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/time/last-week`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
