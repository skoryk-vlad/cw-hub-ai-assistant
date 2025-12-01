import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsRemoveTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ adminComment: z.ZodString; updatedAt: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getEventsRemoveTool(): EventsRemoveTool {
  const name: string = 'events-remove';

  const config: EventsRemoveTool[1] = {
    title: "Delete an event by ID",
    description: "Removes an event and returns the result.",
    inputSchema: {
      id: z.number(),
      body: z.object({ adminComment: z.string(), updatedAt: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: EventsRemoveTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.delete(`${process.env.APP_URL}/events/${params.id}`, { headers: { Authorization: `Bearer ${accessToken}` }, data: params.body });
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
