import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type EventsHistoryGetAllEventsGroupedHistoryTool = ToolDefinition<{
  offset: z.ZodNullable<z.ZodNumber>;
  limit: z.ZodNullable<z.ZodNumber>;
  startDate: z.ZodNullable<z.ZodString>;
  endDate: z.ZodNullable<z.ZodString>;
  employeeIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  eventTypeIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  actions: z.ZodNullable<z.ZodArray<z.ZodEnum<["CREATE", "UPDATE", "DELETE", "RESTORE"]>>>;
  fields: z.ZodNullable<z.ZodArray<z.ZodString>>;
  confirmedByIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  accessToken: z.ZodString;
}>;

export function getEventsHistoryGetAllEventsGroupedHistoryTool(): EventsHistoryGetAllEventsGroupedHistoryTool {
  const name: string = 'events-history-get-all-events-grouped-history';

  const config: EventsHistoryGetAllEventsGroupedHistoryTool[1] = {
    title: "Retrieve grouped event history",
    description: "Returns the complete grouped history of events.",
    inputSchema: {
      offset: z.number().nullable(),
      limit: z.number().nullable(),
      startDate: z.string().nullable(),
      endDate: z.string().nullable(),
      employeeIds: z.array(z.number()).nullable(),
      eventTypeIds: z.array(z.number()).nullable(),
      actions: z.array(z.enum(["CREATE", "UPDATE", "DELETE", "RESTORE"])).nullable(),
      fields: z.array(z.string()).nullable(),
      confirmedByIds: z.array(z.number()).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: EventsHistoryGetAllEventsGroupedHistoryTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/events/history`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
