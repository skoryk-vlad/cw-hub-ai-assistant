import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsFindUpcomingEventsTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getEventsFindUpcomingEventsTool(): EventsFindUpcomingEventsTool {
  const name: string = 'events-find-upcoming-events';

  const config: EventsFindUpcomingEventsTool[1] = {
    title: "Retrieve upcoming events for user",
    description: "Returns a list of upcoming events.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: EventsFindUpcomingEventsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/events/upcoming-events`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
