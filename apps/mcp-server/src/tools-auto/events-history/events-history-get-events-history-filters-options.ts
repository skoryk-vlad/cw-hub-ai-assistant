import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsHistoryGetEventsHistoryFiltersOptionsTool = ToolDefinition<{
  accessToken: z.ZodString;
}>;

export function getEventsHistoryGetEventsHistoryFiltersOptionsTool(): EventsHistoryGetEventsHistoryFiltersOptionsTool {
  const name: string = 'events-history-get-events-history-filters-options';

  const config: EventsHistoryGetEventsHistoryFiltersOptionsTool[1] = {
    title: "Retrieve filter options for event history",
    description: "Returns available filter options for event history.",
    inputSchema: {
      accessToken: z.string(),
    },
  };

  const cb: EventsHistoryGetEventsHistoryFiltersOptionsTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(`${process.env.APP_URL}/events/history/filters-options`, { headers: { Authorization: `Bearer ${accessToken}` } });
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
