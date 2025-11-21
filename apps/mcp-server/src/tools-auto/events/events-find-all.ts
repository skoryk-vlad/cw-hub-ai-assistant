import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type EventsFindAllTool = ToolDefinition<{
  fromDate: z.ZodString;
  toDate: z.ZodString;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  status: z.ZodNullable<z.ZodArray<z.ZodEnum<["deleted", "approved", "declined", "requested"]>>>;
  userStatus: z.ZodNullable<z.ZodArray<z.ZodEnum<["approved", "decline", "not-approved"]>>>;
  eventTypes: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getEventsFindAllTool(): EventsFindAllTool {
  const name: string = 'events-find-all';

  const config: EventsFindAllTool[1] = {
    title: "Retrieve all events",
    description: "Returns a list of events",
    inputSchema: {
      fromDate: z.string(),
      toDate: z.string(),
      userIds: z.array(z.number()).nullable(),
      status: z.array(z.enum(["deleted", "approved", "declined", "requested"])).nullable(),
      userStatus: z.array(z.enum(["approved", "decline", "not-approved"])).nullable(),
      eventTypes: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: EventsFindAllTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/events`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
