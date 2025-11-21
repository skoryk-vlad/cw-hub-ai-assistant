import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsUpdateTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ startDate: z.ZodString; endDate: z.ZodString; eventTypeId: z.ZodNumber; userComment: z.ZodNullable<z.ZodString> }>;
  accessToken: z.ZodString;
}>;

export function getEventsUpdateTool(): EventsUpdateTool {
  const name: string = 'events-update';

  const config: EventsUpdateTool[1] = {
    title: "Update event by ID",
    description: "Updates an existing event and returns the updated event details",
    inputSchema: {
      id: z.number(),
      body: z.object({ startDate: z.string(), endDate: z.string(), eventTypeId: z.number(), userComment: z.string().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: EventsUpdateTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.patch(`${process.env.APP_URL}/events/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
