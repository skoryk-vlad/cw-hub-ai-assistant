import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsApproveTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ adminComment: z.ZodString; updatedAt: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getEventsApproveTool(): EventsApproveTool {
  const name: string = 'events-approve';

  const config: EventsApproveTool[1] = {
    title: "Approve event by ID",
    description: "Updates the approval status of an event.",
    inputSchema: {
      id: z.number(),
      body: z.object({ adminComment: z.string(), updatedAt: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: EventsApproveTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/events/${params.id}/approve`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
