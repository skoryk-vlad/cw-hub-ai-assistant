import z from 'zod';
import axios, { AxiosError } from 'axios';
import { ToolDefinition } from '../../types.js';
import { buildUrl } from '../../helpers/build-url.helper.js';

type TimeCalendarReportTool = ToolDefinition<{
  startDate: z.ZodString;
  endDate: z.ZodString;
  userIds: z.ZodNullable<z.ZodArray<z.ZodNumber>>;
  sortDirection: z.ZodNullable<z.ZodEnum<["DESC", "ASC"]>>;
  userStatus: z.ZodNullable<z.ZodEnum<["all", "inactive", "active"]>>;
  accessToken: z.ZodString;
}>;

export function getTimeCalendarReportTool(): TimeCalendarReportTool {
  const name: string = 'time-calendar-report';

  const config: TimeCalendarReportTool[1] = {
    title: "Retrieve Excel calendar report",
    description: "Returns a calendar report in Excel format.",
    inputSchema: {
      startDate: z.string(),
      endDate: z.string(),
      userIds: z.array(z.number()).nullable(),
      sortDirection: z.enum(["DESC", "ASC"]).nullable(),
      userStatus: z.enum(["all", "inactive", "active"]).nullable(),
      accessToken: z.string(),
    },
  };

  const cb: TimeCalendarReportTool[2] = async ({ accessToken, ...params }) => {
    try {
      const response = await axios.get(buildUrl(`${process.env.APP_URL}/time/calendar-report`, params), { headers: { Authorization: `Bearer ${accessToken}` } });
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
