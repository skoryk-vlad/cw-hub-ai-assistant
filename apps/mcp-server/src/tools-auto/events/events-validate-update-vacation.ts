import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsValidateUpdateVacationTool = ToolDefinition<{
  id: z.ZodNumber;
  body: z.ZodObject<{ startDate: z.ZodString; endDate: z.ZodString }>;
  accessToken: z.ZodString;
}>;

export function getEventsValidateUpdateVacationTool(): EventsValidateUpdateVacationTool {
  const name: string = 'events-validate-update-vacation';

  const config: EventsValidateUpdateVacationTool[1] = {
    title: "Validate vacation update request",
    description: "Validates and processes a vacation update request",
    inputSchema: {
      id: z.number(),
      body: z.object({ startDate: z.string(), endDate: z.string() }),
      accessToken: z.string(),
    },
  };

  const cb: EventsValidateUpdateVacationTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/events/vacation/validate/${params.id}`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
