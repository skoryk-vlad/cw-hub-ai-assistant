import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';

type EventsValidateNewVacationTool = ToolDefinition<{
  body: z.ZodObject<{ startDate: z.ZodString; endDate: z.ZodString; userId: z.ZodNullable<z.ZodNumber> }>;
  accessToken: z.ZodString;
}>;

export function getEventsValidateNewVacationTool(): EventsValidateNewVacationTool {
  const name: string = 'events-validate-new-vacation';

  const config: EventsValidateNewVacationTool[1] = {
    title: "Validate a new vacation request",
    description: "Validates the provided vacation request data.",
    inputSchema: {
      body: z.object({ startDate: z.string(), endDate: z.string(), userId: z.number().nullable() }),
      accessToken: z.string(),
    },
  };

  const cb: EventsValidateNewVacationTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.post(`${process.env.APP_URL}/events/vacation/validate`, params.body, { headers: { Authorization: `Bearer ${accessToken}` } });
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
